# Implementation Details: Structure Labs Workspace

This document outlines the technical implementation of the Structure Labs Workspace, focusing on the local-first media processing, proportional timeline, and editor-inspired UI.

## 1. UI Architecture (Workspace Layout)
The application uses a persistent "Workspace" layout inspired by professional video editors (like DaVinci Resolve).

- **Global Header:** Contains the persistent search bar for analyzing new URLs and standard app navigation.
- **Central Stage:** 
    - **Video Player:** Uses the standard HTML5 `<video>` element. To load local files, we use Tauri's `convertFileSrc` to bypass webview security restrictions.
    - **Proportional Timeline:** A horizontal flex container where each segment's width is calculated as:
      `widthPercent = (segment_duration / total_video_duration) * 100`.
- **Bottom Navigation:** A tabbed workspace switcher allowing users to toggle between "Timeline", "Analysis", and "Brief" views while the video context remains active.

## 2. Backend Media Processing (Rust & yt-dlp)
The `download_media` command in `src-tauri/src/lib.rs` handles the extraction process:

1. **Duration Extraction:** Executes `yt-dlp --get-duration` to determine the total length of the video for timeline scaling.
2. **Video Download:** Extracts the best available `.mp4` stream (compatible with the Tauri webview) and saves it to the app's local data directory.
3. **Audio Extraction:** Uses `yt-dlp` with `ffmpeg` post-processing to create a `16kHz mono .wav` file, which is the required input format for `whisper.cpp`.
4. **UUID Mapping:** Every download is assigned a unique ID (UUID v4) to prevent collisions and manage local storage.

## 3. Local Transcription (whisper.cpp)
Transcription is performed entirely on-device:
- The app executes the bundled `whisper-cli.exe`.
- It utilizes the `ggml-base.en.bin` model for a balance of speed and accuracy.
- Timestamps are suppressed during the initial transcription pass to provide a clean text block for LLM analysis.

## 4. AI Analysis (Google Gemini 1.5 Flash)
The backend sends the transcript to Gemini with a strictly defined system prompt:
- **Taxonomy Enforcement:** Gemini is instructed to pick from the fixed framework taxonomy (e.g., "Problem -> Solution -> Proof").
- **Structural Mapping:** The model extracts sections with both string timestamps (for display) and numeric `seconds` (for timeline seek logic).
- **JSON Mode:** The API is called with `response_mime_type: "application/json"` to ensure the output can be reliably parsed into the `AnalysisResult` struct.

## 5. Design System Integration
The styling follows the "Claude-inspired" system defined in `Design.md`:
- **Canvas:** Parchment (#f5f4ed) background.
- **Accents:** Terracotta Brand (#c96442) for CTAs and progress indicators.
- **Depth:** Custom ring shadows (`0 0 0 1px`) and whisper-soft shadows.
- **Typography:** Serif headings (Georgia/Anthropic Serif) paired with Sans-serif UI elements (Inter/Anthropic Sans).
