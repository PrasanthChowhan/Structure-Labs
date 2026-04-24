# Technical Report: Blocksuite Migration & "Blank Page" Resolution
**Date:** April 24, 2026
**Status:** Completed & Verified

## 1. Executive Summary
Successfully migrated the text editing engine from TipTap to BlockSuite. The primary goal was to leverage BlockSuite's CRDT-based block editing for future-proofing and modern UX. The process encountered significant stability issues (blank pages) which were resolved by strictly aligning the architecture with a verified reference implementation.

## 2. What We Did
- **Engine Replacement**: Removed TipTap and all its 15+ related extensions.
- **Dependency Integration**: Installed `@blocksuite/store`, `@blocksuite/blocks`, and `@blocksuite/presets`.
- **State Overhaul**: Refactored `useScriptStore.ts` to manage a `DocCollection` (BlockSuite's workspace model) and map script versions directly to Yjs Documents.
- **Singleton Implementation**: Moved the `AffineEditorContainer` instantiation out of the React lifecycle and into the global store to prevent expensive re-renders and mounting race conditions.
- **Export Logic**: Rebuilt the Markdown export utility to traverse the BlockSuite block tree instead of TipTap's JSON structure.

## 3. Roadblocks & Failures
### The "Infinite Blank Page"
The most persistent issue was the editor mounting a container but rendering absolutely no content inside it. Even when blocks were added to the store, the UI remained empty.

### Root Causes of the Roadblock:
1. **Internal Dependency Typo (Version Mismatch)**: Version `0.19.x` of `@blocksuite/affine-components` had a hardcoded typo (`CheckBoxCkeckSolidIcon`) that conflicted with the corrected `@blocksuite/icons` package. This prevented the editor bundle from loading in production.
2. **Initialization Race Conditions**: In version `0.19+`, the initialization of the `Doc` requires a specific sequence. Attempting to add text content (`new Text()`) during the initial `load()` phase caused silent runtime crashes in the Web Component's shadow DOM.
3. **CSS Specifier Resolution**: Vite could not resolve the theme CSS from `@blocksuite/presets/themes/affine.css` because the package's export map changed between major versions.
4. **Lifecycle mismatch**: React's `useEffect` was trying to append the editor multiple times, causing BlockSuite's internal Layout Engine to lose track of the root node.

## 4. How We Solved It
The breakthrough came from analyzing a **Verified Sample Project** and performing a **Strict Version Alignment**:

- **Downgrade to Stable Aligned Versions**: We rolled back from the fragmented `canary`/`latest` versions to a specific, internally consistent release: `0.15.0-canary-202406291027-8aed732`.
- **Singleton Pattern**: We adopted the sample's `initEditor()` strategy. The editor is created **once** globally. React merely "borrows" it by appending it to a ref on mount.
- **Simplified `doc.load()`**: We discovered that the most stable way to initialize a document is to create the block IDs first with empty property objects (`{}`) and let BlockSuite's reactive system populate them, rather than passing complex `new Text()` objects during the initial creation.
- **Hierarchy Enforcement**: We strictly enforced the hierarchy: `affine:page` -> (`affine:surface`, `affine:note`) -> `affine:paragraph`. Missing the `affine:note` wrapper often resulted in blocks being logically present but visually hidden.

## 5. Lessons for Future Issues
- **Shadow DOM Isolation**: Remember that BlockSuite uses Web Components. Standard Tailwind/Global CSS cannot "reach into" the editor easily. Rely on native theme imports.
- **Version Pinning**: BlockSuite is a collection of 10+ interconnected packages. Never use `^` or `latest` for these; always pin to exact versions to avoid the typo/mismatch errors we saw.
- **The "Singleton" is King**: For heavy Web Components like this, React shouldn't manage their creation; it should only manage their visibility and their container.

## 6. Verification Results
- **Mounting**: Success.
- **Typing**: Success.
- **Persistence**: Zustand holds the collection; documents are retrievable by ID.
- **Build**: `pnpm build` completes with zero errors.
