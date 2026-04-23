import { useState, useEffect } from 'react';
import { useScriptStore } from '../../store/useScriptStore';
import { ScriptBlockEditor } from './ScriptBlockEditor';
import { Plus } from 'lucide-react';

export const ScriptEditor = () => {
  const { 
    activeVersionId, 
    versions, 
    ensureDefaultVersion,
    addBlock,
    selectedBlocks,
    clearSelection,
    deleteSelectedBlocks,
    copySelectedBlocks
  } = useScriptStore();

  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);

  const activeVersion = versions[activeVersionId];

  // Global Keyboard Handlers for selection
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (selectedBlocks.length > 0) {
        if (e.key === 'Backspace' || e.key === 'Delete') {
          // If no input/textarea/editable is focused, delete selected blocks
          const target = e.target as HTMLElement;
          if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
            e.preventDefault();
            deleteSelectedBlocks();
          }
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
          // If no text is selected on page, copy selected blocks
          if (window.getSelection()?.toString() === '') {
            e.preventDefault();
            copySelectedBlocks();
          }
        } else if (e.key === 'Escape') {
          clearSelection();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [selectedBlocks, deleteSelectedBlocks, copySelectedBlocks, clearSelection]);

  if (!activeVersion) {
    return (
      <div className="flex items-center justify-center py-20 text-olive-gray text-sm">
        Loading editor...
      </div>
    );
  }

  const handleAddBlock = () => {
    const type = 'paragraph';
    const content = { type: 'doc', content: [{ type: 'paragraph' }] };
    addBlock(type, content);
  };

  return (
    <div 
      className="w-full relative px-12 pb-64 min-h-[500px]"
      onClick={(e) => {
        // Clear selection if clicking on the background container
        if (e.target === e.currentTarget) clearSelection();
      }}
    >
      {/* Seamless Block List */}
      <div 
        className="flex flex-col"
        onDragOver={(e) => e.preventDefault()}
      >
        {activeVersion.blockOrder.map((blockId, index) => (
          <ScriptBlockEditor 
            key={blockId} 
            blockId={blockId} 
            index={index}
            draggedBlockId={draggedBlockId}
            setDraggedBlockId={setDraggedBlockId}
            autoFocus={index === 0 && activeVersion.blockOrder.length === 1}
          />
        ))}
      </div>

      {/* Add Block Button */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={handleAddBlock}
          className="flex items-center gap-2 px-4 py-2 rounded-comfort border border-dashed border-border-cream hover:border-terracotta hover:bg-terracotta/5 text-stone-gray hover:text-terracotta transition-all text-xs font-medium group"
        >
          <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
          Add new block
        </button>
      </div>
    </div>
  );
};
