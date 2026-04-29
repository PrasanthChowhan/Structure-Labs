import { useEffect, useRef, useState } from 'react';
import { useScriptStore } from '../../store/useScriptStore';
import '@toeverything/theme/style.css';

export const ScriptEditor = () => {
  const { editor, getActiveDoc, isInitialized } = useScriptStore();
  const doc = getActiveDoc();
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [isMounting, setIsMounting] = useState(false);

  useEffect(() => {
    const container = editorContainerRef.current;
    if (!container || !editor || !doc) return;

    console.log('ScriptEditor: Attempting to mount editor for doc:', doc.id);
    setIsMounting(true);

    // Ensure the editor has the correct doc BEFORE mounting
    if (editor.doc !== doc) {
      console.log('ScriptEditor: Pre-syncing doc to editor');
      editor.doc = doc;
    }

    // Small delay to ensure the container is ready in the DOM
    // and to avoid issues with React StrictMode's double-mount
    const timer = setTimeout(() => {
      if (!container.contains(editor)) {
        console.log('ScriptEditor: Appending editor to container');
        container.innerHTML = '';
        container.appendChild(editor);
      }
      setIsMounting(false);
    }, 50);

    return () => {
      clearTimeout(timer);
      if (container.contains(editor)) {
        console.log('ScriptEditor: Detaching editor from container');
        container.removeChild(editor);
      }
    };
  }, [editor, doc]); 

  if (!isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-olive-gray text-sm italic">
        Initializing BlockSuite...
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-olive-gray text-sm italic bg-parchment/5 rounded-generous border border-dashed border-border-cream">
        <div className="mb-2">No active script version found.</div>
        <button 
          onClick={() => useScriptStore.getState().ensureDefaultVersion()}
          className="text-terracotta hover:underline font-bold"
        >
          Initialize Default Version
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative px-4 pb-64 flex flex-col items-center">
        {isMounting && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
            <div className="text-xs text-olive-gray animate-pulse">Mounting Editor...</div>
          </div>
        )}
        <div 
            ref={editorContainerRef} 
            className="w-full max-w-4xl bg-white rounded-generous shadow-sm border border-border-cream min-h-[700px] overflow-hidden editor-container flex flex-col"
            style={{ 
                outline: 'none',
                cursor: 'text',
                position: 'relative',
                zIndex: 1
            }}
        />
        <style dangerouslySetInnerHTML={{ __html: `
            .editor-container > page-editor {
                display: block;
                flex: 1;
                width: 100%;
                height: 100%;
                min-height: 700px;
                background: white;
            }
            /* If it mounts as affine-editor-container instead */
            .editor-container > affine-editor-container {
                display: block;
                flex: 1;
                width: 100%;
                height: 100%;
                min-height: 700px;
                background: white;
            }
        `}} />
    </div>
  );
};
