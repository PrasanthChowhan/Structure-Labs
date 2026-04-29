import { useEffect, useRef } from 'react';
import { useScriptStore } from '../../store/useScriptStore';
import '@blocksuite/presets/themes/affine.css';

export const ScriptEditor = () => {
  const { editor, getActiveDoc } = useScriptStore();
  const doc = getActiveDoc();
  const editorContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = editorContainerRef.current;
    if (container && editor) {
      // If the editor is already in this container, just ensure doc is correct
      if (container.contains(editor)) {
        if (doc && editor.doc !== doc) {
          console.log('ScriptEditor: Updating doc on existing editor');
          editor.doc = doc;
        }
        return;
      }

      console.log('ScriptEditor: Appending singleton editor');
      container.appendChild(editor);
      
      // Always ensure the doc is assigned after appending
      if (doc) {
        editor.doc = doc;
      }
      
      return () => {
        // We only remove if we are actually unmounting or the editor instance changed
        // But since it's a singleton, we mostly want to remove on unmount so it can move.
        if (container.contains(editor)) {
          container.removeChild(editor);
        }
      };
    }
  }, [editor, doc]); 

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
            className="w-full max-w-4xl bg-white rounded-generous shadow-sm border border-border-cream min-h-[700px] overflow-hidden editor-container flex flex-col"
            style={{ 
                outline: 'none',
                cursor: 'text',
                position: 'relative',
                zIndex: 1
            }}
        />
        <style dangerouslySetInnerHTML={{ __html: `
            .editor-container > affine-editor-container {
                display: block;
                flex: 1;
                width: 100%;
                height: 100%;
                min-height: 700px;
            }
            /* Ensure the inner editor parts are visible */
            .editor-container .affine-page-viewport {
                padding-bottom: 200px !important;
            }
        `}} />
    </div>
  );
};
