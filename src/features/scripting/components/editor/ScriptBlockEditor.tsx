import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Typography from '@tiptap/extension-typography';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import AutoJoiner from 'tiptap-extension-auto-joiner';
import { SlashCommand } from './extensions/SlashCommand';
import { suggestion } from './extensions/suggestion';
import { FormattingBubbleMenu } from './FormattingBubbleMenu';
import { useEffect, useRef, useCallback, useState } from 'react';
import { useScriptStore } from '../../store/useScriptStore';
import { 
  ChevronDown, 
  Plus, 
  Trash2, 
  Copy,
  GripVertical
} from 'lucide-react';

interface ScriptBlockEditorProps {
  blockId: string;
  index: number;
  draggedBlockId: string | null;
  setDraggedBlockId: (id: string | null) => void;
  autoFocus?: boolean;
}

export const ScriptBlockEditor = ({ 
  blockId, 
  index,
  draggedBlockId,
  setDraggedBlockId,
  autoFocus = false 
}: ScriptBlockEditorProps) => {
  const { 
    blocks,
    versions,
    activeVersionId,
    syncBlockContent,
    getBlockContent,
    switchVariant,
    addVariant,
    deleteVariant,
    removeBlock,
    addBlock,
    updateBlockType,
    reorderBlocks,
    selectedBlocks,
    selectAllBlocks,
    clearSelection
  } = useScriptStore();

  const [showVersionMenu, setShowVersionMenu] = useState(false);
  const isSettingContent = useRef(false);
  const lastVariantId = useRef<string>('');
  const syncTimeoutRef = useRef<NodeJS.Timeout>(undefined);

  const block = blocks[blockId];
  const activeVersion = versions[activeVersionId];
  
  if (!block || !activeVersion) return null;

  const activeVariantId = activeVersion.activeVariants[blockId] || block.defaultVariantId;
  const activeVariant = block.variants[activeVariantId];

  const handleUpdate = useCallback(({ editor }: any) => {
    if (isSettingContent.current) return;
    
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    syncTimeoutRef.current = setTimeout(() => {
      syncBlockContent(blockId, activeVariantId, editor.getJSON());
    }, 500);
  }, [syncBlockContent, blockId, activeVariantId]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        dropcursor: { color: '#c96442', width: 2 },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return 'Section Heading...';
          }
          return 'Write section content, or press "/" for commands...';
        },
        includeChildren: true,
      }),
      Link.configure({ openOnClick: false }),
      Image.configure({ allowBase64: true }),
      Typography,
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      AutoJoiner,
      SlashCommand.configure({ 
        suggestion: {
          ...suggestion,
          items: (props: any) => suggestion.items({ ...props, blockId }),
        }
      }),
    ],
    editorProps: {
      attributes: {
        class: 'prose-editor focus:outline-none min-h-[1.5em]',
      },
      handleKeyDown: (view, event) => {
        // Handle Cmd+A / Ctrl+A
        if ((event.metaKey || event.ctrlKey) && event.key === 'a') {
          const { selection, doc } = view.state;
          // If block is already fully selected (or empty), select all blocks
          if (selection.empty || (selection.from <= 1 && selection.to >= doc.content.size - 1)) {
            event.preventDefault();
            selectAllBlocks();
            view.dom.blur();
            return true;
          }
        }

        if (event.key === 'Enter' && !event.shiftKey) {
          // Check if any context menu (Slash Command / Tippy) is open
          const isMenuOpen = !!document.querySelector('[data-tippy-root]');
          if (isMenuOpen) return false;

          const { selection, doc } = view.state;
          // In ProseMirror, selection.$head.pos at the end of the text is doc.content.size - 1
          if (selection.empty && selection.$head.pos >= doc.content.size - 2) {
            event.preventDefault();
            handleAddBlockBelow();
            return true;
          }
        }
        return false;
      },
    },
    content: getBlockContent(blockId),
    onUpdate: handleUpdate,
    autofocus: autoFocus ? 'start' : false,
  });

  // Sync editor when variant changes
  useEffect(() => {
    if (!editor || !activeVariantId) return;
    if (lastVariantId.current === activeVariantId) return;

    lastVariantId.current = activeVariantId;
    isSettingContent.current = true;

    editor.commands.setContent(activeVariant.content);

    requestAnimationFrame(() => {
      isSettingContent.current = false;
    });
  }, [activeVariantId, activeVariant, editor]);

  const handleAddVariant = (duplicate = false) => {
    const content = duplicate ? activeVariant.content : { type: 'doc', content: [{ type: 'paragraph' }] };
    const newId = addVariant(blockId, content, 'user');
    switchVariant(blockId, newId);
    setShowVersionMenu(false);
  };

  const handleAddBlockBelow = () => {
    const activeVersion = versions[activeVersionId];
    const currentIndex = activeVersion.blockOrder.indexOf(blockId);
    addBlock('paragraph', { type: 'doc', content: [{ type: 'paragraph' }] }, currentIndex + 1);
    
    // Auto-focus next block
    setTimeout(() => {
      const editors = document.querySelectorAll('.prose-editor');
      (editors[currentIndex + 1] as HTMLElement)?.focus();
    }, 50);
  };

  const handleDelete = () => {
    const activeVersion = versions[activeVersionId];
    if (activeVersion.blockOrder.length <= 1) {
      alert('Cannot delete the last block in your script.');
      return;
    }

    if (!isVersioned) {
      if (confirm('Are you sure you want to delete this block?')) {
        removeBlock(blockId);
      }
      return;
    }

    // For versioned blocks, offer a choice
    const blockChoice = confirm('Delete entire block? \n\n(Click Cancel if you only want to delete the current VERSION "'+activeVariant.label+'")');
    
    if (blockChoice) {
      removeBlock(blockId);
    } else {
      const variantCount = Object.keys(block.variants).length;
      if (variantCount > 1) {
        if (confirm('Delete version "'+activeVariant.label+'"? This cannot be undone.')) {
          deleteVariant(blockId, activeVariantId);
        }
      } else {
        alert('This is the only version of this block. If you want to delete it, you must delete the entire block.');
      }
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent) => {
    setDraggedBlockId(blockId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', blockId); // Required for Firefox
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedBlockId || draggedBlockId === blockId) return;

    const newOrder = [...activeVersion.blockOrder];
    const draggedIndex = newOrder.indexOf(draggedBlockId);
    const targetIndex = newOrder.indexOf(blockId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedBlockId);
    
    reorderBlocks(newOrder);
    setDraggedBlockId(null);
  };

  const handleDragEnd = () => {
    setDraggedBlockId(null);
  };

  const handleDeleteVariant = () => {
    const variantCount = Object.keys(block.variants).length;
    if (variantCount <= 1) {
      alert('This is the only version of this block. You cannot delete it.');
      return;
    }

    if (confirm(`Delete version "${activeVariant.label}"? This cannot be undone.`)) {
      deleteVariant(blockId, activeVariantId);
      setShowVersionMenu(false);
    }
  };

  const isVersioned = block.isVersioned;
  const isDragging = draggedBlockId === blockId;
  const isSelected = selectedBlocks.includes(blockId);

  return (
    <div 
      className={`group/block relative my-0.5 flex items-start gap-3 w-full transition-all duration-200 ${
        isDragging ? 'opacity-30' : 'opacity-100'
      } ${
        isSelected ? 'bg-terracotta/5 ring-1 ring-terracotta/20 rounded-comfort' : ''
      }`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseDown={() => {
        if (selectedBlocks.length > 0) clearSelection();
      }}
    >
      {/* Left Gutter: Drag Handle */}
      <div className="flex flex-col items-center pt-0.5 w-6 shrink-0 opacity-20 group-hover/block:opacity-100 focus-within:opacity-100 transition-opacity">
        <div 
          draggable
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          className="p-1 cursor-grab active:cursor-grabbing text-stone-gray/40 hover:text-near-black transition-colors"
          title="Drag to reorder"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 relative">
        {/* Versioning Header (Overlay) */}
        {isVersioned && (
          <div className={`absolute top-0 right-0 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm border border-border-cream/80 rounded-comfort p-0.5 shadow-sm transition-opacity duration-200 ${
            showVersionMenu ? 'opacity-100' : 'opacity-0 group-hover/block:opacity-100 focus-within:opacity-100'
          }`}>
            <input
              value={block.type}
              onChange={(e) => updateBlockType(blockId, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="text-[10px] font-bold text-stone-gray uppercase tracking-wider bg-transparent outline-none w-20 focus:text-terracotta transition-colors px-1"
              placeholder="Label"
            />
            
            <div className="w-px h-3 bg-border-cream/80" />

            {/* Version Switcher */}
            <div className="relative">
              <button 
                onClick={() => setShowVersionMenu(!showVersionMenu)}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-parchment/60 transition-colors text-[10px] font-bold text-olive-gray uppercase"
              >
                {activeVariant.label}
                <ChevronDown className="w-2.5 h-2.5 text-stone-gray" />
              </button>

              {showVersionMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowVersionMenu(false)} />
                  <div className="absolute top-full right-0 mt-1 z-50 bg-white border border-border-cream rounded-comfort shadow-whisper min-w-[140px] p-1 animate-in fade-in slide-in-from-top-1 duration-150">
                    {Object.values(block.variants).map(v => (
                      <button
                        key={v.id}
                        onClick={() => {
                          switchVariant(blockId, v.id);
                          setShowVersionMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-[10px] font-medium transition-colors ${
                          v.id === activeVariantId 
                            ? 'bg-terracotta/10 text-terracotta' 
                            : 'text-near-black hover:bg-parchment/60'
                        }`}
                      >
                        {v.label}
                        {v.id === activeVariantId && <div className="w-1.5 h-1.5 rounded-full bg-terracotta" />}
                      </button>
                    ))}
                    <div className="h-px bg-border-cream my-1" />
                    <button
                      onClick={() => handleAddVariant(false)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[10px] font-medium text-olive-gray hover:bg-parchment/60 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      New Version
                    </button>
                    <button
                      onClick={() => handleAddVariant(true)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[10px] font-medium text-olive-gray hover:bg-parchment/60 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      Duplicate Current
                    </button>
                    <button
                      onClick={handleDeleteVariant}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[10px] font-medium text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete Current
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Editor Wrapper */}
        <div className="relative">
          {editor && <FormattingBubbleMenu editor={editor} />}
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};