# GEMINI.md (WORKTREE: TIMELINE)

> [!IMPORTANT]
> This worktree is dedicated to the **Timeline Feature** and the **High-Density Workbench**. All changes here focus on the proportional timeline, video playback synchronization, and the unified scripting/blueprint interface.

---

## 🚀 Worktree Scope
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
- **Model:** Gemma 4 26B (via Gemini API).

### 2. High-Density Workbench Architecture
- **Timeline:** Full-width, gap-free block visualization. Color-coded by `segment_type`.
- **Dual-Column Grid:** 50/50 vertical split between:
  - **The Blueprint (Left):** Structural analysis showing "What was said" (verbatim for Hooks) and "Why it works".
  - **Adaptation Script (Right):** Tiptap editor pre-populated with "Mad-Libs" style AI templates.
- **Seamless Layout:** Zero-padding, header-integrated timeline, and responsive vertical compression in Focus Mode.

### 3. Data Flow
- **Analysis -> Store:** `analyze_transcript` (Rust) returns `templatized_version` per section.
- **Store -> Editor:** `useScriptStore.ts` initializes the editor with these templates for rapid adaptation.
- **Sync:** Frame-accurate playhead synchronization across Timeline, Blueprint cards, and Video Player.

---

## 🧠 Behavioral Guidelines
1. **Focus:** Maintain the "instrument-like" feel of the workbench. High-density, functional, and authoritative.
2. **Synchronization:** Ensure all components (Timeline, Blueprint, Video) react to the `currentTime` from `TimelineContext`.
3. **Surgicality:** Do not modify the underlying Tiptap extension logic unless strictly required for layout stability.
4. **Data Integrity:** The `templatized_version` is a required field; always ensure it has a fallback to the original `description`.
