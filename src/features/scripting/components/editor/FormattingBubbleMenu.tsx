import { BubbleMenu, Editor } from '@tiptap/react';
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Link as LinkIcon,
  Type
} from 'lucide-react';

export const FormattingBubbleMenu = ({ editor }: { editor: Editor }) => {
  return (
    <BubbleMenu 
      editor={editor} 
      tippyOptions={{ duration: 100 }}
      className="flex items-center gap-0.5 bg-near-black border border-white/10 rounded-lg shadow-xl p-1 overflow-hidden"
    >
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded hover:bg-white/10 transition-colors ${editor.isActive('bold') ? 'text-terracotta bg-white/5' : 'text-white/70'}`}
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded hover:bg-white/10 transition-colors ${editor.isActive('italic') ? 'text-terracotta bg-white/5' : 'text-white/70'}`}
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded hover:bg-white/10 transition-colors ${editor.isActive('strike') ? 'text-terracotta bg-white/5' : 'text-white/70'}`}
      >
        <Strikethrough className="w-4 h-4" />
      </button>
      
      <div className="w-px h-4 bg-white/10 mx-1" />
      
      <button
        onClick={() => {
          const url = window.prompt('URL:');
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        className={`p-1.5 rounded hover:bg-white/10 transition-colors ${editor.isActive('link') ? 'text-terracotta bg-white/5' : 'text-white/70'}`}
      >
        <LinkIcon className="w-4 h-4" />
      </button>
    </BubbleMenu>
  );
};
