use std::path::PathBuf;
use std::fs::OpenOptions;
use std::io::Write;
use tauri::{AppHandle, Manager, Runtime};

pub fn get_data_dir() -> PathBuf {
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

pub fn log_to_file<R: Runtime>(_app: &AppHandle<R>, message: &str) {
    let log_path = get_data_dir().join("app.log");
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(log_path)
        .unwrap();
    
    let timestamp = chrono::Local::now().format("%Y-%m-%d %H:%M:%S");
    writeln!(file, "[{}] {}", timestamp, message).unwrap();
}

pub fn clear_logs<R: Runtime>(_app: &AppHandle<R>) {
    let log_path = get_data_dir().join("app.log");
    let _ = std::fs::write(log_path, ""); // Truncate file
}

pub fn resolve_resource<R: Runtime>(app: &AppHandle<R>, name: &str) -> Result<PathBuf, String> {
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

pub fn parse_duration(s: &str) -> f64 {
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
