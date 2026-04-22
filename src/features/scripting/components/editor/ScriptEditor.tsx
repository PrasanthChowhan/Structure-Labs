import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { SlashCommand } from './extensions/SlashCommand';
import { suggestion } from './extensions/suggestion';
import { useEffect } from 'react';
import { useScriptStore } from '../../store/useScriptStore';

export const ScriptEditor = () => {
  const { 
    activeVersionId, 
    versions, 
    blocks 
  } = useScriptStore();

  const activeVersion = versions[activeVersionId];

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Write something or press "/" for commands...',
      }),
      SlashCommand.configure({
        suggestion,
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      // In a real block-based editor, we'd find which block changed.
      // For MVP initialization, we'll just log it.
      console.log('Editor update:', json);
    },
  });

  useEffect(() => {
    if (editor && activeVersion) {
      // Construct content from active variants of the current version
      const content = activeVersion.blockOrder.map(bId => {
        const block = blocks[bId];
        const vId = activeVersion.activeVariants[bId];
        const variant = block.variants[vId];
        return variant.content;
      });

      // Wrap in a doc
      editor.commands.setContent({
        type: 'doc',
        content: content.flatMap(c => c.content || []),
      });
    }
  }, [activeVersionId, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="prose prose-invert max-w-none w-full">
      <EditorContent editor={editor} />
    </div>
  );
};
