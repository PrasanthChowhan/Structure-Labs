import { create } from 'zustand';
import { type Doc } from '@blocksuite/store';
import { v4 as uuidv4 } from 'uuid';
import { AnalysisResult } from '../../../types';
import { ScriptEngine } from '../lib/ScriptEngine';

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
  
  versions: Record<string, ScriptVersionInfo>;
  activeVersionId: string;
  
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

export const useScriptStore = create<ScriptState>((set, get) => {
  const engine = ScriptEngine.getInstance();

  return {
    title: 'My Video Script',
    targetAudience: '',
    niche: '',
    versions: {},
    activeVersionId: '',

    setMetadata: (metadata) => set((state) => ({ ...state, ...metadata })),

    ensureDefaultVersion: () => {
      const state = get();
      if (Object.keys(state.versions).length > 0) return;

      console.log('useScriptStore: Ensuring default version...');
      get().createVersion('Initial Draft');
    },

    createVersion: (name, content = '') => {
      const { versions } = get();
      const versionId = uuidv4();
      
      const doc = engine.createDoc(name, content);
      
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

      engine.mountEditor(doc);
      return versionId;
    },

    switchVersion: (versionId) => {
      const { versions } = get();
      const version = versions[versionId];
      if (version) {
        const doc = engine.getDoc(version.docId);
        if (doc) {
          console.log(`useScriptStore: Switching to version ${version.name}`);
          engine.mountEditor(doc);
          set({ activeVersionId: versionId });
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
        
        if (nextActiveId) {
          const nextVersion = newVersions[nextActiveId];
          const doc = engine.getDoc(nextVersion.docId);
          if (doc) engine.mountEditor(doc);
        }
      }

      return {
        versions: newVersions,
        activeVersionId: nextActiveId
      };
    }),

    getActiveDoc: () => {
      const { versions, activeVersionId } = get();
      const version = versions[activeVersionId];
      if (!version) return undefined;
      return engine.getDoc(version.docId);
    },

    initializeFromAnalysis: (analysis) => {
      const content = analysis.adaptation_brief || '';
      get().createVersion('AI Draft', content);
      set({ title: 'Analyzed Script' });
    },

    applyPreset: (preset) => {
      const { versions } = get();
      const versionId = uuidv4();
      
      const doc = engine.applyPreset(preset.name, preset.structure);

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

      engine.mountEditor(doc);
    },
  };
});
