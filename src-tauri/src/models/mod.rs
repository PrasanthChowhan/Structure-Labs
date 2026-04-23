use serde::{Deserialize, Serialize};

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
    pub templatized_version: String,
    pub segment_type: String, // e.g. "Hook", "Context", "Value", "Proof", "CTA", "Other"
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MediaPaths {
    pub video_path: String,
    pub audio_path: String,
    pub duration: f64,
}
