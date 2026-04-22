import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Typography from '@tiptap/extension-typography';
import { SlashCommand } from './extensions/SlashCommand';
import { suggestion } from './extensions/suggestion';
import { FormattingBubbleMenu } from './FormattingBubbleMenu';
import { SlashFloatingMenu } from './SlashFloatingMenu';
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
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: 'Write something or press "/" for commands...',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-terracotta underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg border border-border-cream max-w-full h-auto my-4',
        },
      }),
      Typography,
      SlashCommand.configure({
        suggestion,
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      // Future: Selective block sync
    },
  });

  useEffect(() => {
    if (editor && activeVersion) {
      const content = activeVersion.blockOrder.map(bId => {
        const block = blocks[bId];
        const vId = activeVersion.activeVariants[bId];
        const variant = block.variants[vId];
        return variant.content;
      });

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
    <div className="prose prose-olive max-w-none w-full relative">
      <FormattingBubbleMenu editor={editor} />
      <SlashFloatingMenu editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};
