# GEMINI.md

> [!IMPORTANT]
> This repository uses a worktree-based workflow. Ensure you are aware of the current feature focus.

---

## 🚀 Workspace Features

### 1. Scripting Feature
- **Primary Goal:** Enhance the Scripting editor and user experience.
- **Key Files:** `src/features/scripting/store/useScriptStore.ts`, `src/features/scripting/views/ScriptingView.tsx`, `src/features/scripting/components/editor/`.
- **Branch:** `feature/scripting`

### 2. Timeline Feature & High-Density Workbench
- **Primary Goal:** Implement and refine the Video Timeline, Playback synchronization, and the Split-View Workbench.
- **Key Files:** 
  - `src/features/timeline/hooks/useVideoPlayback.ts`
  - `src/features/timeline/components/ProportionalTimeline.tsx`
  - `src/features/timeline/views/TimelineView.tsx` (Architecture Root)
  - `src/features/timeline/components/BlueprintDraftView.tsx` (Split Interface)

---

## 🛠️ Technical Map (Global)

### 1. Core Tech Stack
- **Frontend:** React 19 (Vite), Tailwind CSS 4, Lucide Icons.
- **State:** Zustand (`useScriptStore.ts`) for document state; React Context (`TimelineContext.tsx`) for playback.
- **Backend:** Tauri v2 (Rust).
- **Model:** Gemini API.

### 2. High-Density Workbench Architecture
- **Timeline:** Full-width, gap-free block visualization. Color-coded by `segment_type`.
- **Dual-Column Grid:** 50/50 vertical split between The Blueprint (Left) and Adaptation Script (Right).
- **Sync:** Frame-accurate playhead synchronization across Timeline, Blueprint cards, and Video Player.

---

## 🧠 Behavioral Guidelines
1. **Scripting:** Ensure the Tiptap editor remains responsive with large scripts. Maintain consistent patterns in `useScriptStore.ts`.
2. **Timeline:** Ensure all components reaction to the `currentTime` from `TimelineContext`.
3. **Surgicality:** Do not modify the underlying Tiptap extension logic unless strictly required for layout stability.
4. **Data Flow:** Frontend persistent via Zustand; Backend handles analysis and transcription.
