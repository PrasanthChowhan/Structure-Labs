use serde::{Deserialize, Serialize};
use std::process::Command;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug)]
pub struct AnalysisResult {
    pub hook_type: String,
    pub video_structure: Vec<VideoSection>,
    pub framework_detected: String,
    pub why_it_works: String,
    pub reusable_template: String,
    pub adaptation_brief: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct VideoSection {
    pub timestamp: String,
    pub title: String,
    pub description: String,
}

#[tauri::command]
async fn download_audio(app: AppHandle, url: String) -> Result<String, String> {
    let app_dir = app.path().app_local_data_dir().map_err(|e| e.to_string())?;
    if !app_dir.exists() {
        std::fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;
    }

    let id = Uuid::new_v4().to_string();
    let output_path = app_dir.join(format!("{}.wav", id));
    
    let resource_dir = app.path().resource_dir().map_err(|e| e.to_string())?;
    let yt_dlp_path = resource_dir.join("resources/yt-dlp.exe");

    let output = Command::new(yt_dlp_path)
        .args([
            "-x",
            "--audio-format", "wav",
            "--postprocessor-args", "ffmpeg:-ar 16000 -ac 1",
            "-o", output_path.to_str().unwrap(),
            &url
        ])
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Ok(output_path.to_str().unwrap().to_string())
}

#[tauri::command]
async fn transcribe_audio(app: AppHandle, path: String) -> Result<String, String> {
    let resource_dir = app.path().resource_dir().map_err(|e| e.to_string())?;
    let whisper_path = resource_dir.join("resources/whisper-cli.exe");
    let model_path = resource_dir.join("resources/ggml-base.en.bin");

    let output = Command::new(whisper_path)
        .args([
            "-m", model_path.to_str().unwrap(),
            "-f", &path,
            "-nt", // no timestamps for the raw transcript
            "-np", // no prints
        ])
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    let transcript = String::from_utf8_lossy(&output.stdout).trim().to_string();
    Ok(transcript)
}

#[tauri::command]
async fn analyze_transcript(transcript: String) -> Result<AnalysisResult, String> {
    dotenvy::dotenv().ok();
    let api_key = std::env::var("GEMINI_API_KEY").map_err(|_| "GEMINI_API_KEY not found")?;

    let client = reqwest::Client::new();
    let prompt = format!(
        "Analyze the following YouTube video transcript and break it down into a structural format.
        Return the result as a raw JSON object with the following keys:
        - hook_type: Explains what the opening is trying to do.
        - video_structure: An array of objects with 'timestamp' (e.g. 0:00), 'title', and 'description'.
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
        - adaptation_brief: How to apply this to a new niche.

        Transcript:
        {}
        ",
        transcript
    );

    let response = client
        .post(format!("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={}", api_key))
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

    let json: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;
    
    let content = json["candidates"][0]["content"]["parts"][0]["text"]
        .as_str()
        .ok_or("Failed to get response from Gemini")?;

    let result: AnalysisResult = serde_json::from_str(content).map_err(|e| e.to_string())?;
    Ok(result)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            download_audio,
            transcribe_audio,
            analyze_transcript
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
