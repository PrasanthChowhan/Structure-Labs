import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { 
  ScriptData, 
  ScriptVersion, 
  ScriptBlock, 
  BlockVariant,
  AnalysisResult 
} from '../../../types';

interface ScriptState extends ScriptData {
  // Actions
  setMetadata: (metadata: Partial<Pick<ScriptData, 'title' | 'targetAudience' | 'niche'>>) => void;
  
  // Version Actions
  createVersion: (name: string) => string;
  switchVersion: (versionId: string) => void;
  deleteVersion: (versionId: string) => void;
  
  // Block Actions
  addBlock: (type: string, initialContent: any, index?: number) => string;
  removeBlock: (blockId: string) => void;
  reorderBlocks: (newOrder: string[]) => void;
  
  // Variant Actions
  addVariant: (blockId: string, content: any, source: 'ai' | 'user', label?: string) => string;
  switchVariant: (blockId: string, variantId: string) => void;
  updateVariantContent: (blockId: string, variantId: string, content: any) => void;
  
  // Initialization
  initializeFromAnalysis: (analysis: AnalysisResult) => void;
  applyPreset: (preset: { structure: { type: string, content: string }[] }) => void;
}

export const useScriptStore = create<ScriptState>((set, get) => ({
  title: 'Untitled Script',
  targetAudience: '',
  niche: '',
  versions: {},
  activeVersionId: '',
  blocks: {},

  setMetadata: (metadata) => set((state) => ({ ...state, ...metadata })),

  createVersion: (name) => {
    const id = uuidv4();
    const state = get();
    const activeVersion = state.versions[state.activeVersionId];
    
    const newVersion: ScriptVersion = {
      id,
      name,
      blockOrder: activeVersion ? [...activeVersion.blockOrder] : [],
      activeVariants: activeVersion ? { ...activeVersion.activeVariants } : {},
      createdAt: Date.now(),
    };

    set((state) => ({
      versions: { ...state.versions, [id]: newVersion },
      activeVersionId: id,
    }));

    return id;
  },

  switchVersion: (versionId) => set({ activeVersionId: versionId }),

  deleteVersion: (versionId) => set((state) => {
    const { [versionId]: _, ...remainingVersions } = state.versions;
    let nextActiveId = state.activeVersionId;
    if (nextActiveId === versionId) {
      nextActiveId = Object.keys(remainingVersions)[0] || '';
    }
    return { versions: remainingVersions, activeVersionId: nextActiveId };
  }),

  addBlock: (type, initialContent, index) => {
    const blockId = uuidv4();
    const variantId = uuidv4();
    
    const variant: BlockVariant = {
      id: variantId,
      content: initialContent,
      label: 'V1',
      createdAt: Date.now(),
      source: 'user',
    };

    const block: ScriptBlock = {
      id: blockId,
      type,
      variants: { [variantId]: variant },
      defaultVariantId: variantId,
    };

    set((state) => {
      const activeVersion = state.versions[state.activeVersionId];
      if (!activeVersion) return state;

      const newBlockOrder = [...activeVersion.blockOrder];
      if (typeof index === 'number') {
        newBlockOrder.splice(index, 0, blockId);
      } else {
        newBlockOrder.push(blockId);
      }

      return {
        blocks: { ...state.blocks, [blockId]: block },
        versions: {
          ...state.versions,
          [state.activeVersionId]: {
            ...activeVersion,
            blockOrder: newBlockOrder,
            activeVariants: { ...activeVersion.activeVariants, [blockId]: variantId },
          },
        },
      };
    });

    return blockId;
  },

  removeBlock: (blockId) => set((state) => {
    const { [blockId]: _, ...remainingBlocks } = state.blocks;
    const newVersions = { ...state.versions };
    
    Object.keys(newVersions).forEach(vId => {
      newVersions[vId] = {
        ...newVersions[vId],
        blockOrder: newVersions[vId].blockOrder.filter(id => id !== blockId),
      };
      const { [blockId]: __, ...remainingVariants } = newVersions[vId].activeVariants;
      newVersions[vId].activeVariants = remainingVariants;
    });

    return { blocks: remainingBlocks, versions: newVersions };
  }),

  reorderBlocks: (newOrder) => set((state) => {
    const activeVersion = state.versions[state.activeVersionId];
    if (!activeVersion) return state;

    return {
      versions: {
        ...state.versions,
        [state.activeVersionId]: {
          ...activeVersion,
          blockOrder: newOrder,
        },
      },
    };
  }),

  addVariant: (blockId, content, source, label) => {
    const variantId = uuidv4();
    const variant: BlockVariant = {
      id: variantId,
      content,
      label: label || `V${Object.keys(get().blocks[blockId].variants).length + 1}`,
      createdAt: Date.now(),
      source,
    };

    set((state) => ({
      blocks: {
        ...state.blocks,
        [blockId]: {
          ...state.blocks[blockId],
          variants: { ...state.blocks[blockId].variants, [variantId]: variant },
        },
      },
    }));

    return variantId;
  },

  switchVariant: (blockId, variantId) => set((state) => {
    const activeVersion = state.versions[state.activeVersionId];
    if (!activeVersion) return state;

    return {
      versions: {
        ...state.versions,
        [state.activeVersionId]: {
          ...activeVersion,
          activeVariants: { ...activeVersion.activeVariants, [blockId]: variantId },
        },
      },
    };
  }),

  updateVariantContent: (blockId, variantId, content) => set((state) => {
    const block = state.blocks[blockId];
    if (!block || !block.variants[variantId]) return state;

    return {
      blocks: {
        ...state.blocks,
        [blockId]: {
          ...block,
          variants: {
            ...block.variants,
            [variantId]: { ...block.variants[variantId], content },
          },
        },
      },
    };
  }),

  initializeFromAnalysis: (analysis) => {
    const initialVersionId = uuidv4();
    const blocks: Record<string, ScriptBlock> = {};
    const blockOrder: string[] = [];
    const activeVariants: Record<string, string> = {};

    // Helper to add a block during initialization
    const addInitialBlock = (type: string, content: string) => {
      const bId = uuidv4();
      const vId = uuidv4();
      
      blocks[bId] = {
        id: bId,
        type,
        variants: {
          [vId]: {
            id: vId,
            content: { type: 'doc', content: [{ type, content: [{ type: 'text', text: content }] }] },
            label: 'V1',
            createdAt: Date.now(),
            source: 'user',
          }
        },
        defaultVariantId: vId,
      };
      blockOrder.push(bId);
      activeVariants[bId] = vId;
    };

    // Auto-populate based on analysis
    addInitialBlock('heading', analysis.reusable_template || 'Draft Script');
    
    // Add sections from framework if possible, otherwise use adaptation brief
    if (analysis.video_structure && analysis.video_structure.length > 0) {
      analysis.video_structure.forEach(section => {
        addInitialBlock('heading', section.title);
        addInitialBlock('paragraph', section.description);
      });
    } else {
      addInitialBlock('paragraph', analysis.adaptation_brief || 'Start writing here...');
    }

    const initialVersion: ScriptVersion = {
      id: initialVersionId,
      name: 'V1 - Default',
      blockOrder,
      activeVariants,
      createdAt: Date.now(),
    };

    set({
      blocks,
      versions: { [initialVersionId]: initialVersion },
      activeVersionId: initialVersionId,
      title: analysis.reusable_template || 'Untitled Script',
    });
  },

  applyPreset: (preset) => {
    const blocks: Record<string, ScriptBlock> = {};
    const blockOrder: string[] = [];
    const activeVariants: Record<string, string> = {};

    preset.structure.forEach((item) => {
      const bId = uuidv4();
      const vId = uuidv4();
      
      blocks[bId] = {
        id: bId,
        type: item.type,
        variants: {
          [vId]: {
            id: vId,
            content: { 
              type: 'doc', 
              content: [{ 
                type: item.type === 'heading' ? 'heading' : 'paragraph', 
                attrs: item.type === 'heading' ? { level: 2 } : {},
                content: [{ type: 'text', text: item.content }] 
              }] 
            },
            label: 'V1',
            createdAt: Date.now(),
            source: 'user',
          }
        },
        defaultVariantId: vId,
      };
      blockOrder.push(bId);
      activeVariants[bId] = vId;
    });

    set((state) => {
      const newVersionId = uuidv4();
      const newVersion: ScriptVersion = {
        id: newVersionId,
        name: `V${Object.keys(state.versions).length + 1} - Preset`,
        blockOrder,
        activeVariants,
        createdAt: Date.now(),
      };

      return {
        blocks: { ...state.blocks, ...blocks },
        versions: { ...state.versions, [newVersionId]: newVersion },
        activeVersionId: newVersionId,
      };
    });
  },
}));
