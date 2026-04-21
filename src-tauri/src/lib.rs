use serde::{Deserialize, Serialize};
use std::process::Command;
use tauri::{AppHandle, Manager, Runtime};
use uuid::Uuid;
use std::path::PathBuf;
use std::fs::OpenOptions;
use std::io::Write;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AnalysisResult {
    pub hook_type: String,
    pub video_structure: Vec<VideoSection>,
    pub framework_detected: String,
    pub why_it_works: String,
    pub reusable_template: String,
    pub adaptation_brief: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct VideoSection {
    pub timestamp: String, // e.g. "0:00"
    pub seconds: f64,      // for proportional calculation
    pub title: String,
    pub description: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MediaPaths {
    pub video_path: String,
    pub audio_path: String,
    pub duration: f64,
}

fn get_data_dir() -> PathBuf {
    let mut dir = std::env::current_dir().unwrap_or_default();
    
    // If we are in src-tauri (typical for tauri dev), move up to project root
    if dir.ends_with("src-tauri") {
        dir.pop();
    }
    
    let dir = dir.join("workspace_data");
    if !dir.exists() {
        let _ = std::fs::create_dir_all(&dir);
    }
    dir
}

fn log_to_file<R: Runtime>(_app: &AppHandle<R>, message: &str) {
    let log_path = get_data_dir().join("app.log");
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(log_path)
        .unwrap();
    
    let timestamp = chrono::Local::now().format("%Y-%m-%d %H:%M:%S");
    writeln!(file, "[{}] {}", timestamp, message).unwrap();
}

fn clear_logs<R: Runtime>(_app: &AppHandle<R>) {
    let log_path = get_data_dir().join("app.log");
    let _ = std::fs::write(log_path, ""); // Truncate file
}

fn resolve_resource<R: Runtime>(app: &AppHandle<R>, name: &str) -> Result<PathBuf, String> {
    let resource_dir = app.path().resource_dir().map_err(|e| e.to_string())?;
    
    // Try root of resource dir
    let path = resource_dir.join(name);
    if path.exists() {
        return Ok(path);
    }

    // Try resources/ subdirectory
    let path = resource_dir.join("resources").join(name);
    if path.exists() {
        return Ok(path);
    }

    // Also check current dir for dev
    let path = std::env::current_dir().unwrap_or_default().join("resources").join(name);
    if path.exists() {
        return Ok(path);
    }

    Err(format!("Could not find resource '{}' in resource_dir ({:?}) or resources/ folder", name, resource_dir))
}

#[tauri::command]
async fn download_media(app: AppHandle, url: String) -> Result<MediaPaths, String> {
    log_to_file(&app, &format!("Starting download for URL: {}", url));
    let app_dir = get_data_dir();
    
    // Extract a simple ID from the URL (e.g. YouTube video ID)
    let id = url.split("v=").last().unwrap_or(&url).split('&').next().unwrap_or(&url).replace(&['/', '\\', '?', '%', '*', ':', '|', '"', '<', '>'][..], "");
    let id = if id.is_empty() { "default_video".to_string() } else { id };

    let video_path = app_dir.join(format!("{}.mp4", id));
    let audio_path = app_dir.join(format!("{}.wav", id));
    let duration_path = app_dir.join(format!("{}.duration", id));

    if video_path.exists() && audio_path.exists() && duration_path.exists() {
        log_to_file(&app, "Using cached media files from workspace_data folder");
        let duration_str = std::fs::read_to_string(&duration_path).unwrap_or_default();
        return Ok(MediaPaths {
            video_path: video_path.to_str().unwrap().to_string(),
            audio_path: audio_path.to_str().unwrap().to_string(),
            duration: parse_duration(&duration_str),
        });
    }
    
    let yt_dlp_path = resolve_resource(&app, "yt-dlp.exe")?;

    // Check if ffmpeg is available (yt-dlp needs it for conversion)
    let ffmpeg_check = Command::new("ffmpeg").arg("-version").output();
    if ffmpeg_check.is_err() {
        log_to_file(&app, "Error: ffmpeg not found");
        return Err("ffmpeg not found in system PATH. It is required for audio extraction.".to_string());
    }

    // 1. Get Duration first
    let duration_output = Command::new(&yt_dlp_path)
        .args(["--get-duration", &url])
        .output()
        .map_err(|e| format!("Failed to execute yt-dlp to get duration: {}", e))?;
    
    if !duration_output.status.success() {
        let err = String::from_utf8_lossy(&duration_output.stderr);
        log_to_file(&app, &format!("yt-dlp duration error: {}", err));
        return Err(format!("yt-dlp duration error: {}", err));
    }

    let duration_str = String::from_utf8_lossy(&duration_output.stdout).trim().to_string();
    log_to_file(&app, &format!("Video duration: {}", duration_str));
    let duration_secs = parse_duration(&duration_str);
    let _ = std::fs::write(&duration_path, &duration_str);

    // 2. Download Video (mp4)
    log_to_file(&app, "Downloading video...");
    let video_output = Command::new(&yt_dlp_path)
        .args([
            "-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
            "-o", video_path.to_str().unwrap(),
            &url
        ])
        .output()
        .map_err(|e| format!("Failed to execute yt-dlp to download video: {}", e))?;

    if !video_output.status.success() {
        let err = String::from_utf8_lossy(&video_output.stderr);
        log_to_file(&app, &format!("yt-dlp video error: {}", err));
        return Err(format!("yt-dlp video error: {}", err));
    }

    // 3. Extract Audio (wav 16k mono for whisper)
    log_to_file(&app, "Extracting audio...");
    let audio_output = Command::new(&yt_dlp_path)
        .args([
            "-x",
            "--audio-format", "wav",
            "--postprocessor-args", "ffmpeg:-ar 16000 -ac 1",
            "-o", audio_path.to_str().unwrap(),
            &url
        ])
        .output()
        .map_err(|e| format!("Failed to execute yt-dlp to extract audio: {}", e))?;

    if !audio_output.status.success() {
        let err = String::from_utf8_lossy(&audio_output.stderr);
        log_to_file(&app, &format!("yt-dlp audio error: {}", err));
        return Err(format!("yt-dlp audio error: {}", err));
    }

    log_to_file(&app, "Media processing complete");
    Ok(MediaPaths {
        video_path: video_path.to_str().unwrap().to_string(),
        audio_path: audio_path.to_str().unwrap().to_string(),
        duration: duration_secs,
    })
}

fn parse_duration(s: &str) -> f64 {
    let parts: Vec<&str> = s.split(':').collect();
    let mut total_secs = 0.0;
    if parts.len() == 3 {
        total_secs += parts[0].parse::<f64>().unwrap_or(0.0) * 3600.0;
        total_secs += parts[1].parse::<f64>().unwrap_or(0.0) * 60.0;
        total_secs += parts[2].parse::<f64>().unwrap_or(0.0);
    } else if parts.len() == 2 {
        total_secs += parts[0].parse::<f64>().unwrap_or(0.0) * 60.0;
        total_secs += parts[1].parse::<f64>().unwrap_or(0.0);
    } else {
        total_secs += s.parse::<f64>().unwrap_or(0.0);
    }
    total_secs
}

use sha2::{Sha256, Digest};

#[tauri::command]
async fn transcribe_audio(app: AppHandle, path: String) -> Result<String, String> {
    log_to_file(&app, &format!("STEP: Transcription started for {}", path));
    
    let path_buf = PathBuf::from(&path);
    let transcript_path = get_data_dir().join(path_buf.file_name().unwrap()).with_extension("txt");
    
    if transcript_path.exists() {
        log_to_file(&app, "CACHE HIT: Using existing transcript from workspace_data");
        return Ok(std::fs::read_to_string(transcript_path).unwrap_or_default());
    }

    let whisper_path = resolve_resource(&app, "whisper-cli.exe")?;
    let model_path = resolve_resource(&app, "ggml-base.en.bin")?;

    log_to_file(&app, "RUNNING: whisper-cli (with timestamps)");
    let output = Command::new(whisper_path)
        .args([
            "-m", model_path.to_str().unwrap(),
            "-f", &path,
            "-np", // no prints
        ])
        .output()
        .map_err(|e| format!("Failed to execute whisper-cli: {}", e))?;

    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr);
        log_to_file(&app, &format!("ERROR: Whisper failed: {}", err));
        return Err(format!("Whisper error: {}", err));
    }

    let transcript = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let _ = std::fs::write(&transcript_path, &transcript);
    log_to_file(&app, &format!("SUCCESS: Transcription saved to {:?}", transcript_path));
    Ok(transcript)
}

#[tauri::command]
async fn analyze_transcript(app: AppHandle, transcript: String, niche: Option<String>) -> Result<AnalysisResult, String> {
    log_to_file(&app, "STEP: Analysis started");
    
    // Create a cache key from transcript + niche
    let mut hasher = Sha256::new();
    hasher.update(transcript.as_bytes());
    if let Some(ref n) = niche {
        hasher.update(n.as_bytes());
    }
    let cache_key = hex::encode(hasher.finalize());
    let cache_path = get_data_dir().join(format!("analysis_{}.json", cache_key));

    if cache_path.exists() {
        log_to_file(&app, "CACHE HIT: Using existing analysis from workspace_data");
        let cached_data = std::fs::read_to_string(cache_path).map_err(|e| e.to_string())?;
        return serde_json::from_str(&cached_data).map_err(|e| e.to_string());
    }

    dotenvy::dotenv().ok();
    let api_key = std::env::var("GEMINI_API_KEY").map_err(|_| "GEMINI_API_KEY not found")?;

    let client = reqwest::Client::new();
    let niche_context = niche.map(|n| format!("Target Niche: {}\n", n)).unwrap_or_default();
    
    let prompt = format!(
        "Analyze the following YouTube video transcript (which includes timestamps) and break it down into a structural format.
        Return the result as a raw JSON object with the following keys:
        - hook_type: Explains what the opening is trying to do.
        - video_structure: An array of objects with 'timestamp' (e.g. 0:00), 'seconds' (the numeric start time in seconds), 'title', and 'description'. Use the timestamps provided in the transcript for accuracy.
        - framework_detected: Identify the likely framework from this taxonomy:
            * Problem -> Solution -> Proof
            * Contrarian claim -> Evidence -> Takeaway
            * Story -> Lesson -> Action
            * Mistakes -> Consequences -> Fixes
            * Case study -> Breakdown -> Insight
            * Transformation -> Obstacles -> Result
            * Myth -> Debunk -> Proof
            * Challenge/experiment -> Stakes -> Outcome
            * Ranking/list -> Escalation -> Winner
            * Tutorial -> Steps -> CTA
        - why_it_works: Explains pacing, curiosity, or payoff logic.
        - reusable_template: Converts the structure into a generalized format.
        - adaptation_brief: How to apply this format specifically to the target niche.

        {}
        Transcript:
        {}
        ",
        niche_context,
        transcript
    );

    // Save prompt for debugging
    let _ = std::fs::write(get_data_dir().join("last_prompt.txt"), &prompt);
    log_to_file(&app, "DEBUG: Prompt saved to workspace_data/last_prompt.txt");

    log_to_file(&app, "SENDING: Request to Gemma 4 31B...");
    let response = client
        .post(format!("https://generativelanguage.googleapis.com/v1beta/models/gemma-4-31b-it:generateContent?key={}", api_key))
        .json(&serde_json::json!({
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }],
            "generationConfig": {
                "response_mime_type": "application/json"
            }
        }))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let raw_body = response.text().await.map_err(|e| e.to_string())?;
    let _ = std::fs::write(get_data_dir().join("last_response_raw.json"), &raw_body);
    log_to_file(&app, "DEBUG: Raw response saved to workspace_data/last_response_raw.json");

    let json: serde_json::Value = serde_json::from_str(&raw_body).map_err(|e| {
        log_to_file(&app, &format!("ERROR: JSON Value Parse: {}", e));
        format!("JSON Parsing Error (Value): {}", e)
    })?;
    
    // Log token usage
    if let (Some(p_tokens), Some(c_tokens), Some(t_tokens)) = (
        json["usageMetadata"]["promptTokenCount"].as_i64(),
        json["usageMetadata"]["candidatesTokenCount"].as_i64(),
        json["usageMetadata"]["totalTokenCount"].as_i64()
    ) {
        let token_log_path = get_data_dir().join("tokens.log");
        if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(token_log_path) {
            let timestamp = chrono::Local::now().format("%Y-%m-%d %H:%M:%S");
            writeln!(file, "[{}] Tokens - Prompt: {}, Candidate: {}, Total: {}", timestamp, p_tokens, c_tokens, t_tokens).unwrap();
        }
    }
    
    let parts = json["candidates"][0]["content"]["parts"]
        .as_array()
        .ok_or_else(|| "Failed to get response parts from AI".to_string())?;

    let text_part = parts.iter()
        .find(|p| p.get("thought").is_none() || p["thought"].as_bool() == Some(false))
        .unwrap_or_else(|| parts.last().unwrap());

    let content = text_part["text"].as_str().ok_or_else(|| "Failed to get text from AI".to_string())?;

    let json_content = if let (Some(start), Some(end)) = (content.find('{'), content.rfind('}')) {
        &content[start..=end]
    } else {
        content
    };

    let result: AnalysisResult = serde_json::from_str(json_content).map_err(|e| {
        log_to_file(&app, &format!("ERROR: AnalysisResult Parse: {}", e));
        format!("JSON Parsing Error (Result Struct): {}", e)
    })?;
    
    // Save to cache
    let _ = std::fs::write(&cache_path, serde_json::to_string(&result).unwrap());
    log_to_file(&app, &format!("SUCCESS: Analysis saved to {:?}", cache_path));
    Ok(result)
}



#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            clear_logs(&app.app_handle());
            log_to_file(&app.app_handle(), "Application initialized");
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            download_media,
            transcribe_audio,
            analyze_transcript
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
