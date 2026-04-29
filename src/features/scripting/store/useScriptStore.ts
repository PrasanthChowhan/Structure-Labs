import { create } from 'zustand';
import { DocCollection, Schema, type Doc } from '@blocksuite/store';
import { AffineSchemas } from '@blocksuite/blocks';
import { PageEditor } from '@blocksuite/presets';
import { v4 as uuidv4 } from 'uuid';
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
  
  collection: DocCollection | null;
  versions: Record<string, ScriptVersionInfo>;
  activeVersionId: string;
  
  // Singleton editor instance
  editor: PageEditor | null;
  
  isInitialized: boolean;

  // Metadata Actions
  setMetadata: (metadata: Partial<Pick<ScriptState, 'title' | 'targetAudience' | 'niche'>>) => void;
  
  // Version Actions
  createVersion: (name: string, content?: string) => string;
  switchVersion: (versionId: string) => void;
  deleteVersion: (versionId: string) => void;
  
  // Lifecycle
  ensureDefaultVersion: () => void;
  initializeFromAnalysis: (analysis: AnalysisResult) => void;
  applyPreset: (preset: { name: string; structure: { type: string; content: string }[] }) => void;

  // Computed
  getActiveDoc: () => Doc | undefined;
}

// Helper to initialize BlockSuite hierarchy
const initDocHierarchy = (doc: Doc, title: string = '', content: string = '') => {
  doc.load(() => {
    const pageBlockId = doc.addBlock('affine:page', {
      title: new doc.Text(title),
    });
    doc.addBlock('affine:surface', {}, pageBlockId);
    const noteId = doc.addBlock('affine:note', {}, pageBlockId);
    doc.addBlock('affine:paragraph', {
      text: new doc.Text(content),
    }, noteId);
  });
};

export const useScriptStore = create<ScriptState>((set, get) => ({
  title: 'My Video Script',
  targetAudience: '',
  niche: '',
  collection: null,
  versions: {},
  activeVersionId: '',
  editor: null,
  isInitialized: false,

  setMetadata: (metadata) => set((state) => ({ ...state, ...metadata })),

  ensureDefaultVersion: () => {
    const state = get();
    if (state.isInitialized) return;

    console.log('useScriptStore: Initializing BlockSuite...');

    // 1. Initialize Schema & Collection
    const schema = new Schema().register(AffineSchemas);
    const collection = new DocCollection({ schema });
    
    // collection.meta.initialize() is synchronous but good to have
    collection.meta.initialize();

    // 2. Initialize Singleton Editor
    const editor = document.createElement('page-editor') as PageEditor;
    
    // Force a re-render once initialized
    set({ 
      collection, 
      editor,
      isInitialized: true 
    });

    console.log('useScriptStore: BlockSuite initialized, creating default version...');

    // 3. Create initial version if none exists
    if (Object.keys(state.versions).length === 0) {
      get().createVersion('Initial Draft');
    }
  },

  createVersion: (name, content = '') => {
    const { collection, versions } = get();
    if (!collection) {
      console.warn('useScriptStore: Cannot create version - collection not initialized');
      return '';
    }

    const versionId = uuidv4();
    const doc = collection.createDoc();
    console.log(`useScriptStore: Created new doc ${doc.id} for version ${name}`);
    
    // Ensure doc is loaded before adding blocks
    initDocHierarchy(doc, name, content);

    const newVersion: ScriptVersionInfo = {
      id: versionId,
      name,
      docId: doc.id,
      createdAt: Date.now(),
    };

    set({
      versions: { ...versions, [versionId]: newVersion },
      activeVersionId: versionId,
    });

    // If this is the active version, sync the editor immediately
    const editor = get().editor;
    if (editor) {
      editor.doc = doc;
    }

    return versionId;
  },

  switchVersion: (versionId) => {
    const { versions, collection, editor } = get();
    const version = versions[versionId];
    if (version && collection && editor) {
      const doc = collection.getDoc(version.docId);
      if (doc) {
        console.log(`useScriptStore: Switching to version ${version.name} (doc ${doc.id})`);
        editor.doc = doc;
        set({ activeVersionId: versionId });
      } else {
        console.error(`useScriptStore: Could not find doc ${version.docId} for version ${versionId}`);
      }
    }
  },

  deleteVersion: (versionId) => set((state) => {
    const newVersions = { ...state.versions };
    delete newVersions[versionId];
    
    let nextActiveId = state.activeVersionId;
    if (versionId === state.activeVersionId) {
      const remainingIds = Object.keys(newVersions);
      nextActiveId = remainingIds.length > 0 ? remainingIds[0] : '';
    }

    return {
      versions: newVersions,
      activeVersionId: nextActiveId
    };
  }),

  getActiveDoc: () => {
    const { versions, activeVersionId, collection } = get();
    const version = versions[activeVersionId];
    if (!version || !collection) return undefined;
    return collection.getDoc(version.docId) as Doc;
  },

  initializeFromAnalysis: (analysis) => {
    const { isInitialized, ensureDefaultVersion } = get();
    if (!isInitialized) ensureDefaultVersion();

    const content = analysis.adaptation_brief || '';
    get().createVersion('AI Draft', content);
    
    set({
      title: 'Analyzed Script',
    });
  },

  applyPreset: (preset) => {
    const { collection, versions } = get();
    if (!collection) return;

    const versionId = uuidv4();
    const doc = collection.createDoc();
    
    doc.load(() => {
      const pageBlockId = doc.addBlock('affine:page', {
        title: new doc.Text(preset.name),
      });
      doc.addBlock('affine:surface', {}, pageBlockId);
      const noteId = doc.addBlock('affine:note', {}, pageBlockId);
      
      preset.structure.forEach(item => {
        if (item.type === 'heading') {
          doc.addBlock('affine:paragraph', {
            text: new doc.Text(item.content),
            type: 'h2'
          }, noteId);
        } else {
          doc.addBlock('affine:paragraph', {
            text: new doc.Text(item.content),
          }, noteId);
        }
      });
    });

    const newVersion: ScriptVersionInfo = {
      id: versionId,
      name: preset.name,
      docId: doc.id,
      createdAt: Date.now(),
    };

    set({
      versions: { ...versions, [versionId]: newVersion },
      activeVersionId: versionId,
    });
  },
}));
