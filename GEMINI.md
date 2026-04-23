# GEMINI.md (WORKTREE: SCRIPTING)

> [!IMPORTANT]
> This worktree is dedicated to the **Scripting Feature**. All changes here should focus on the script editor, document state, and analysis integration.

---

## 🚀 Worktree Scope
- **Primary Goal:** Enhance the Scripting editor and user experience.
- **Key Files:** `src/features/scripting/store/useScriptStore.ts`, `src/features/scripting/views/ScriptingView.tsx`, `src/features/scripting/components/editor/`.
- **Branch:** `feature/scripting`

---

## 🛠️ Technical Map (Global)

### 1. Core Tech Stack
- **Frontend:** React 19 (Vite), Tailwind CSS 4, Lucide Icons.
- **State:** Zustand (`useScriptStore.ts`) for document state.
- **Backend:** Tauri v2 (Rust).

### 2. Data Flow
- **Frontend -> Backend:** Scripting updates are persisted via Zustand and can trigger re-analysis.

---

## 🧠 Behavioral Guidelines
1. **Focus:** Keep changes isolated to the scripting editor and store.
2. **Performance:** Ensure the Tiptap editor remains responsive with large scripts.
3. **Consistency:** Match the established patterns in `useScriptStore.ts`.
