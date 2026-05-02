mod models;
mod utils;
mod commands;

use crate::utils::{clear_logs, log_to_file};
use crate::commands::{
    media::download_media,
    transcribe::transcribe_audio,
    analyze::analyze_transcript,
    feedback::submit_feedback,
};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Load .env file
    let _ = dotenvy::dotenv();

    tauri::Builder::default()
        .setup(|app| {
            clear_logs(&app.app_handle());
            log_to_file(&app.app_handle(), "Application initialized");
            Ok(())
        })
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_screenshots::init())
        .invoke_handler(tauri::generate_handler![
            download_media,
            transcribe_audio,
            analyze_transcript,
            submit_feedback
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
