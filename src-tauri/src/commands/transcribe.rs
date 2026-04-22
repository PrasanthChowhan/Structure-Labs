use std::process::Command;
use std::path::PathBuf;
use tauri::AppHandle;
use crate::utils::{get_data_dir, log_to_file, resolve_resource};

#[tauri::command]
pub async fn transcribe_audio(app: AppHandle, path: String) -> Result<String, String> {
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
