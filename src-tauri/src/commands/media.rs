use std::process::Command;
use tauri::AppHandle;
use crate::models::MediaPaths;
use crate::utils::{get_data_dir, log_to_file, resolve_resource, parse_duration};

#[tauri::command]
pub async fn download_media(app: AppHandle, url: String) -> Result<MediaPaths, String> {
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

    // 2. Download Video (mp4 with H.264 for compatibility)
    log_to_file(&app, "Downloading video...");
    let video_output = Command::new(&yt_dlp_path)
        .args([
            "-f", "bestvideo[vcodec^=avc1][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
            "--postprocessor-args", "ffmpeg:-movflags +faststart",
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
