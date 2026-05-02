# Structure Labs Context

## Glossary

### Analysis
The process of fetching a video, transcribing its audio, and using AI to identify its framework and structure.

### Workbench
The central orchestration layer and UI shell that manages the transition between video analysis and script editing.

### Script
The adaptation of an analyzed video into a new content draft, managed via BlockSuite.

### Feedback
A development-only feature that allows the user to quickly report issues or ideas directly from the UI.

### Application State
A lean snapshot of the current UI status (e.g., active tab, focus mode, analyzer status) used for diagnostic purposes in Feedback submissions.

## Architecture

- **Deep Modules**: We prefer simple interfaces that hide significant complexity (e.g., `ScriptEngine` wrapping BlockSuite).
- **Singleton Orchestrators**: Primary logic is managed by singletons like `Workbench` and `VideoAnalyzer`.
- **Tauri Integration**: Hardware-intensive or secure tasks (like media downloading or GitHub API interaction) are handled in the Rust backend.
