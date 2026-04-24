import { useEffect, useRef } from 'react';
import { useScriptStore } from '../../store/useScriptStore';
import '@blocksuite/presets/themes/affine.css';

export const ScriptEditor = () => {
  const { editor, getActiveDoc } = useScriptStore();
  const doc = getActiveDoc();
  const editorContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorContainerRef.current && editor) {
      console.log('ScriptEditor: Appending singleton editor');
      editorContainerRef.current.innerHTML = '';
      editorContainerRef.current.appendChild(editor);
    }
  }, [editor]);

  if (!doc) {
    return (
      <div className="flex items-center justify-center py-20 text-olive-gray text-sm italic">
        Select or create a script version to start editing.
      </div>
    );
  }

  return (
    <div className="w-full h-full relative px-4 pb-64 flex flex-col items-center">
        <div 
            ref={editorContainerRef} 
            className="w-full max-w-4xl bg-white rounded-generous shadow-sm border border-border-cream min-h-[600px] overflow-hidden editor-container"
        />
    </div>
  );
};
