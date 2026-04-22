import { FloatingMenu, Editor } from '@tiptap/react';
import { Plus } from 'lucide-react';

export const SlashFloatingMenu = ({ editor }: { editor: Editor }) => {
  return (
    <FloatingMenu 
      editor={editor} 
      tippyOptions={{ duration: 100 }}
      className="flex items-center"
    >
      <button
        onClick={() => {
          // Trigger the slash command menu by inserting a /
          editor.chain().focus().insertContent('/').run();
        }}
        className="flex items-center justify-center w-6 h-6 rounded-full bg-white border border-border-cream text-olive-gray hover:text-terracotta hover:border-terracotta transition-all shadow-sm"
        title="Type '/' for commands"
      >
        <Plus className="w-4 h-4" />
      </button>
    </FloatingMenu>
  );
};
