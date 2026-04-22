import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { 
  ScriptData, 
  ScriptVersion, 
  ScriptBlock, 
  BlockVariant,
  AnalysisResult 
} from '../../../types';

// ── Helpers to build valid ProseMirror JSON ──────────────────────────
function makeTextNode(text: string) {
  return { type: 'text', text };
}

function makeHeadingNode(text: string, level: number = 2) {
  return {
    type: 'heading',
    attrs: { level },
    content: [makeTextNode(text)],
  };
}

function makeParagraphNode(text: string) {
  return {
    type: 'paragraph',
    content: text ? [makeTextNode(text)] : [],
  };
}

function makeCalloutNode(text: string) {
  // We'll render callouts as blockquotes with a special class
  return {
    type: 'blockquote',
    content: [makeParagraphNode(text)],
  };
}

function makeDocContent(nodes: any[]) {
  return { type: 'doc', content: nodes };
}

// ── Store Interface ──────────────────────────────────────────────────
interface ScriptState extends ScriptData {
  // Lifecycle
  isInitialized: boolean;
  ensureDefaultVersion: () => void;

  // Metadata
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
  deleteVariant: (blockId: string, variantId: string) => void;
  
  // Content sync (editor → store)
  syncEditorContent: (editorJson: any) => void;
  
  // Initialization
  initializeFromAnalysis: (analysis: AnalysisResult) => void;
  applyPreset: (preset: { name: string; structure: { type: string; content: string }[] }) => void;
  
  // Computed
  getActiveVersion: () => ScriptVersion | undefined;
  getEditorContent: () => any;
}

// ── Create a block + variant pair ───────────────────────────────────
function createBlockWithVariant(
  type: string,
  pmContent: any,
  source: 'ai' | 'user' = 'user'
): { block: ScriptBlock; variantId: string } {
  const blockId = uuidv4();
  const variantId = uuidv4();

  const variant: BlockVariant = {
    id: variantId,
    content: pmContent,
    label: 'V1',
    createdAt: Date.now(),
    source,
  };

  const block: ScriptBlock = {
    id: blockId,
    type,
    variants: { [variantId]: variant },
    defaultVariantId: variantId,
  };

  return { block, variantId };
}

// ── Store Implementation ────────────────────────────────────────────
export const useScriptStore = create<ScriptState>((set, get) => ({
  title: 'Untitled Script',
  targetAudience: '',
  niche: '',
  versions: {},
  activeVersionId: '',
  blocks: {},
  isInitialized: false,

  // Ensure a default empty version always exists
  ensureDefaultVersion: () => {
    const state = get();
    if (Object.keys(state.versions).length > 0) return;

    const versionId = uuidv4();
    const blockId = uuidv4();
    const variantId = uuidv4();

    // Create a single empty paragraph block so editor has something to focus
    const variant: BlockVariant = {
      id: variantId,
      content: makeDocContent([makeParagraphNode('')]),
      label: 'V1',
      createdAt: Date.now(),
      source: 'user',
    };

    const block: ScriptBlock = {
      id: blockId,
      type: 'paragraph',
      variants: { [variantId]: variant },
      defaultVariantId: variantId,
    };

    const version: ScriptVersion = {
      id: versionId,
      name: 'V1 – Default',
      blockOrder: [blockId],
      activeVariants: { [blockId]: variantId },
      createdAt: Date.now(),
    };

    set({
      blocks: { [blockId]: block },
      versions: { [versionId]: version },
      activeVersionId: versionId,
      isInitialized: true,
    });
  },

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
    const versionKeys = Object.keys(state.versions);
    if (versionKeys.length <= 1) return state; // Don't delete the last version

    const { [versionId]: _, ...remainingVersions } = state.versions;
    let nextActiveId = state.activeVersionId;
    if (nextActiveId === versionId) {
      nextActiveId = Object.keys(remainingVersions)[0] || '';
    }
    return { versions: remainingVersions, activeVersionId: nextActiveId };
  }),

  addBlock: (type, initialContent, index) => {
    const state = get();
    state.ensureDefaultVersion();
    
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
    const block = get().blocks[blockId];
    if (!block) return '';

    const variant: BlockVariant = {
      id: variantId,
      content,
      label: label || `V${Object.keys(block.variants).length + 1}`,
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

  deleteVariant: (blockId, variantId) => set((state) => {
    const block = state.blocks[blockId];
    if (!block) return state;
    // Don't delete the last variant
    if (Object.keys(block.variants).length <= 1) return state;

    const { [variantId]: _, ...remaining } = block.variants;
    const newDefault = Object.keys(remaining)[0];

    // Also update active variant in current version if it was pointing to deleted one
    const activeVersion = state.versions[state.activeVersionId];
    const updatedActiveVariants = { ...activeVersion?.activeVariants };
    if (updatedActiveVariants[blockId] === variantId) {
      updatedActiveVariants[blockId] = newDefault;
    }

    return {
      blocks: {
        ...state.blocks,
        [blockId]: {
          ...block,
          variants: remaining,
          defaultVariantId: block.defaultVariantId === variantId ? newDefault : block.defaultVariantId,
        },
      },
      versions: activeVersion ? {
        ...state.versions,
        [state.activeVersionId]: {
          ...activeVersion,
          activeVariants: updatedActiveVariants,
        },
      } : state.versions,
    };
  }),

  // Sync full editor JSON back into store as a single mega-block
  // This is the pragmatic MVP approach: the editor owns the content,
  // the store snapshots it for versioning/export
  syncEditorContent: (editorJson) => {
    const state = get();
    const activeVersion = state.versions[state.activeVersionId];
    if (!activeVersion || !activeVersion.blockOrder.length) return;

    // Update the first block's active variant with the full editor content
    const firstBlockId = activeVersion.blockOrder[0];
    const block = state.blocks[firstBlockId];
    if (!block) return;

    const activeVariantId = activeVersion.activeVariants[firstBlockId] || block.defaultVariantId;
    
    set((s) => ({
      blocks: {
        ...s.blocks,
        [firstBlockId]: {
          ...block,
          variants: {
            ...block.variants,
            [activeVariantId]: {
              ...block.variants[activeVariantId],
              content: editorJson,
            },
          },
        },
      },
    }));
  },

  getActiveVersion: () => {
    const state = get();
    return state.versions[state.activeVersionId];
  },

  getEditorContent: () => {
    const state = get();
    const version = state.versions[state.activeVersionId];
    if (!version || version.blockOrder.length === 0) {
      return makeDocContent([makeParagraphNode('')]);
    }

    // Collect all block contents into a single doc
    const allNodes: any[] = [];
    version.blockOrder.forEach(bId => {
      const block = state.blocks[bId];
      if (!block) return;
      const vId = version.activeVariants[bId] || block.defaultVariantId;
      const variant = block.variants[vId];
      if (!variant || !variant.content) return;

      // The variant content is a full doc — extract its inner nodes
      if (variant.content.type === 'doc' && variant.content.content) {
        allNodes.push(...variant.content.content);
      }
    });

    if (allNodes.length === 0) {
      return makeDocContent([makeParagraphNode('')]);
    }

    return makeDocContent(allNodes);
  },

  initializeFromAnalysis: (analysis) => {
    const initialVersionId = uuidv4();
    const blocks: Record<string, ScriptBlock> = {};
    const blockOrder: string[] = [];
    const activeVariants: Record<string, string> = {};

    const addInitBlock = (type: string, pmNode: any, source: 'ai' | 'user' = 'ai') => {
      const { block, variantId } = createBlockWithVariant(type, makeDocContent([pmNode]), source);
      blocks[block.id] = block;
      blockOrder.push(block.id);
      activeVariants[block.id] = variantId;
    };

    // Title from template
    addInitBlock('heading', makeHeadingNode(analysis.reusable_template || 'Draft Script', 1));

    // Add sections from video structure
    if (analysis.video_structure && analysis.video_structure.length > 0) {
      analysis.video_structure.forEach(section => {
        addInitBlock('heading', makeHeadingNode(section.title, 2));
        addInitBlock('paragraph', makeParagraphNode(section.description));
      });
    }

    // Add adaptation brief as a callout
    if (analysis.adaptation_brief) {
      addInitBlock('callout', makeCalloutNode(`Adaptation Guide: ${analysis.adaptation_brief}`));
    }

    // Add why it works as a callout
    if (analysis.why_it_works) {
      addInitBlock('callout', makeCalloutNode(`Why it works: ${analysis.why_it_works}`));
    }

    const initialVersion: ScriptVersion = {
      id: initialVersionId,
      name: 'V1 – From Analysis',
      blockOrder,
      activeVariants,
      createdAt: Date.now(),
    };

    set({
      blocks,
      versions: { [initialVersionId]: initialVersion },
      activeVersionId: initialVersionId,
      title: analysis.reusable_template || 'Untitled Script',
      isInitialized: true,
    });
  },

  applyPreset: (preset) => {
    const blocks: Record<string, ScriptBlock> = {};
    const blockOrder: string[] = [];
    const activeVariants: Record<string, string> = {};

    preset.structure.forEach((item) => {
      let pmNode: any;
      if (item.type === 'heading') {
        pmNode = makeHeadingNode(item.content, 2);
      } else if (item.type === 'callout') {
        pmNode = makeCalloutNode(item.content);
      } else {
        pmNode = makeParagraphNode(item.content);
      }

      const { block, variantId } = createBlockWithVariant(item.type, makeDocContent([pmNode]));
      blocks[block.id] = block;
      blockOrder.push(block.id);
      activeVariants[block.id] = variantId;
    });

    set((state) => {
      const newVersionId = uuidv4();
      const presetName = (preset as any).name || 'Preset';
      const newVersion: ScriptVersion = {
        id: newVersionId,
        name: `V${Object.keys(state.versions).length + 1} – ${presetName}`,
        blockOrder,
        activeVariants,
        createdAt: Date.now(),
      };

      return {
        blocks: { ...state.blocks, ...blocks },
        versions: { ...state.versions, [newVersionId]: newVersion },
        activeVersionId: newVersionId,
        isInitialized: true,
      };
    });
  },
}));
