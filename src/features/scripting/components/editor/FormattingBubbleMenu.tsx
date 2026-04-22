import { BubbleMenu } from '@tiptap/react/menus';
import { Editor } from '@tiptap/react';
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Link as LinkIcon,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Unlink,
} from 'lucide-react';

const ToolButton = ({ 
  onClick, 
  isActive, 
  children, 
  title 
}: { 
  onClick: () => void; 
  isActive: boolean; 
  children: React.ReactNode;
  title: string;
}) => (
  <button
    onClick={onClick}
    title={title}
    className={`p-1.5 rounded transition-colors ${
      isActive 
        ? 'text-terracotta bg-white/10' 
        : 'text-white/70 hover:text-white hover:bg-white/10'
    }`}
  >
    {children}
  </button>
);

const Separator = () => <div className="w-px h-4 bg-white/10 mx-0.5" />;

export const FormattingBubbleMenu = ({ editor }: { editor: Editor }) => {
  return (
    <BubbleMenu 
      editor={editor} 
      className="flex items-center gap-0.5 bg-near-black border border-white/10 rounded-generous shadow-xl p-1 overflow-hidden"
    >
      {/* Text formatting */}
      <ToolButton 
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-4 h-4" />
      </ToolButton>
      <ToolButton 
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </ToolButton>
      <ToolButton 
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4" />
      </ToolButton>
      <ToolButton 
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        title="Inline Code"
      >
        <Code className="w-4 h-4" />
      </ToolButton>

      <Separator />

      {/* Block type */}
      <ToolButton 
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        <Heading1 className="w-4 h-4" />
      </ToolButton>
      <ToolButton 
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="w-4 h-4" />
      </ToolButton>
      <ToolButton 
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        <Heading3 className="w-4 h-4" />
      </ToolButton>

      <Separator />

      {/* Lists and blocks */}
      <ToolButton 
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </ToolButton>
      <ToolButton 
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </ToolButton>
      <ToolButton 
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Callout/Quote"
      >
        <Quote className="w-4 h-4" />
      </ToolButton>

      <Separator />

      {/* Link */}
      {editor.isActive('link') ? (
        <ToolButton 
          onClick={() => editor.chain().focus().unsetLink().run()}
          isActive={true}
          title="Remove Link"
        >
          <Unlink className="w-4 h-4" />
        </ToolButton>
      ) : (
        <ToolButton 
          onClick={() => {
            const url = window.prompt('URL:');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          isActive={false}
          title="Add Link"
        >
          <LinkIcon className="w-4 h-4" />
        </ToolButton>
      )}
    </BubbleMenu>
  );
};
