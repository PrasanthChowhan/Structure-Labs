use tauri::AppHandle;
use sha2::{Sha256, Digest};
use std::fs::OpenOptions;
use std::io::Write;
use crate::models::AnalysisResult;
use crate::utils::{get_data_dir, log_to_file};

#[tauri::command]
pub async fn analyze_transcript(app: AppHandle, transcript: String, niche: Option<String>) -> Result<AnalysisResult, String> {
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
        Return the result as a raw JSON object with the following keys. IMPORTANT: All values except 'video_structure' MUST be plain strings (use newlines for formatting). Do not use nested objects or arrays for these fields:
        - hook_type: Explains what the opening is trying to do.
        - video_structure: An array of objects with:
            * timestamp: e.g. 0:00
            * seconds: the numeric start time in seconds
            * title: a short, descriptive title
            * description: a 1-2 sentence explanation of the segment
            * segment_type: categorize the segment into one of: 'Hook', 'Context', 'Value', 'Proof', 'Story', 'CTA', or 'Other'.
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
