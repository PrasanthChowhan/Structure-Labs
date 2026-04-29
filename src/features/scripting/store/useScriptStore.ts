import { create } from 'zustand';
import { DocCollection, Schema, Doc } from '@blocksuite/store';
import { AffineEditorContainer } from '@blocksuite/presets';
import { AffineSchemas } from '@blocksuite/blocks';
// Side-effect imports to ensure blocks are registered
import '@blocksuite/blocks';
import '@blocksuite/presets';
import { AnalysisResult } from '../../../types';

interface ScriptVersionInfo {
  id: string;
  name: string;
  docId: string;
  createdAt: number;
}

interface ScriptState {
  title: string;
  targetAudience: string;
  niche: string;
  
  collection: DocCollection;
  versions: Record<string, ScriptVersionInfo>;
  activeVersionId: string;
  
  // Singleton editor instance
  editor: AffineEditorContainer;
  
  isInitialized: boolean;

  // Metadata Actions
  setMetadata: (metadata: Partial<Pick<ScriptState, 'title' | 'targetAudience' | 'niche'>>) => void;
  
  // Version Actions
  createVersion: (name: string) => string;
  switchVersion: (versionId: string) => void;
  deleteVersion: (versionId: string) => void;
  
  // Lifecycle
  ensureDefaultVersion: () => void;
  initializeFromAnalysis: (analysis: AnalysisResult) => void;
  applyPreset: (preset: { name: string; structure: { type: string; content: string }[] }) => void;

  // Computed
  getActiveDoc: () => Doc | undefined;
}

const schema = new Schema().register(AffineSchemas);
const collection = new DocCollection({ schema });
collection.meta.initialize();

// Create the singleton editor instance
const editor = new AffineEditorContainer();

export const useScriptStore = create<ScriptState>((set, get) => ({
  title: 'Untitled Script',
  targetAudience: '',
  niche: '',
  collection,
  versions: {},
  activeVersionId: '',
  editor,
  isInitialized: false,

  setMetadata: (metadata) => set((state) => ({ ...state, ...metadata })),

  ensureDefaultVersion: () => {
    const state = get();
    if (Object.keys(state.versions).length > 0) return;

    const doc = state.collection.createDoc({ id: 'v1-default' });
    
    console.log('useScriptStore: Creating default version', doc.id);
    doc.load(() => {
        console.log('useScriptStore: Doc loaded, adding initial blocks');
        const pageBlockId = doc.addBlock('affine:page', {});
        doc.addBlock('affine:surface', {}, pageBlockId);
        const noteId = doc.addBlock('affine:note', {}, pageBlockId);
        doc.addBlock('affine:paragraph', {}, noteId);
        console.log('useScriptStore: Initial blocks added');
    });

    const versionId = doc.id;
    const version: ScriptVersionInfo = {
      id: versionId,
      name: 'V1 – Default',
      docId: doc.id,
      createdAt: Date.now(),
    };

    // Bind editor to the first doc
    state.editor.doc = doc;

    set({
      versions: { [versionId]: version },
      activeVersionId: versionId,
      isInitialized: true,
    });
  },

  createVersion: (name) => {
    const state = get();
    const newDoc = state.collection.createDoc();
    
    newDoc.load(() => {
        const pageBlockId = newDoc.addBlock('affine:page', {});
        newDoc.addBlock('affine:surface', {}, pageBlockId);
        const noteId = newDoc.addBlock('affine:note', {}, pageBlockId);
        newDoc.addBlock('affine:paragraph', {}, noteId);
    });

    const versionId = newDoc.id;
    const version: ScriptVersionInfo = {
      id: versionId,
      name,
      docId: newDoc.id,
      createdAt: Date.now(),
    };

    // Switch editor to new doc
    state.editor.doc = newDoc;

    set((state) => ({
      versions: { ...state.versions, [versionId]: version },
      activeVersionId: versionId,
    }));

    return versionId;
  },

  switchVersion: (versionId) => {
    const state = get();
    const version = state.versions[versionId];
    if (version) {
        const doc = state.collection.getDoc(version.docId);
        if (doc) {
            state.editor.doc = doc;
        }
    }
    set({ activeVersionId: versionId });
  },

  deleteVersion: (versionId) => set((state) => {
    const versionKeys = Object.keys(state.versions);
    if (versionKeys.length <= 1) return state;

    const { [versionId]: versionToDelete, ...remainingVersions } = state.versions;
    
    state.collection.removeDoc(versionToDelete.docId);

    let nextActiveId = state.activeVersionId;
    if (nextActiveId === versionId) {
      nextActiveId = Object.keys(remainingVersions)[0] || '';
      const nextVersion = remainingVersions[nextActiveId];
      if (nextVersion) {
          const doc = state.collection.getDoc(nextVersion.docId);
          if (doc) state.editor.doc = doc;
      }
    }
    return { versions: remainingVersions, activeVersionId: nextActiveId };
  }),

  getActiveDoc: () => {
    const state = get();
    const version = state.versions[state.activeVersionId];
    if (!version) return undefined;
    return state.collection.getDoc(version.docId) || undefined;
  },

  initializeFromAnalysis: (analysis) => {
    const state = get();
    const doc = state.collection.createDoc();
    
    doc.load(() => {
        const pageBlockId = doc.addBlock('affine:page', {});
        doc.addBlock('affine:surface', {}, pageBlockId);
        const noteId = doc.addBlock('affine:note', {}, pageBlockId);
        
        // Use the sample's way - no initial complex content inside load to avoid crashes
        doc.addBlock('affine:paragraph', {}, noteId);
    });

    const versionId = doc.id;
    const version: ScriptVersionInfo = {
      id: versionId,
      name: 'V1 – From Analysis',
      docId: doc.id,
      createdAt: Date.now(),
    };

    // Bind editor
    state.editor.doc = doc;

    set({
      versions: { [versionId]: version },
      activeVersionId: versionId,
      title: analysis.reusable_template || 'Untitled Script',
      isInitialized: true,
    });
  },

  applyPreset: (preset) => {
    const state = get();
    const doc = state.collection.createDoc();
    
    doc.load(() => {
        const pageBlockId = doc.addBlock('affine:page', {});
        doc.addBlock('affine:surface', {}, pageBlockId);
        const noteId = doc.addBlock('affine:note', {}, pageBlockId);
        doc.addBlock('affine:paragraph', {}, noteId);
    });

    const versionId = doc.id;
    const version: ScriptVersionInfo = {
      id: versionId,
      name: `V${Object.keys(state.versions).length + 1} – ${preset.name}`,
      docId: doc.id,
      createdAt: Date.now(),
    };

    // Bind editor
    state.editor.doc = doc;

    set((state) => ({
      versions: { ...state.versions, [versionId]: version },
      activeVersionId: versionId,
      isInitialized: true,
    }));
  },
}));
