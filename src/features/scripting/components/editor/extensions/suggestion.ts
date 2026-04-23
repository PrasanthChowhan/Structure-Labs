import { ReactRenderer } from '@tiptap/react';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import { CommandList } from './CommandList';
import { useScriptStore } from '../../../store/useScriptStore';

export interface SlashCommandItem {
  title: string;
  description: string;
  icon: string;
  command: (args: { editor: any; range: any; props: any }) => void;
}

export const suggestion = {
  items: ({ query, blockId }: { query: string; blockId?: string }): SlashCommandItem[] => {
    const items: SlashCommandItem[] = [
      {
        title: 'Version',
        description: 'Add versioning capability to this section',
        icon: 'V',
        command: ({ editor, range, props }: any) => {
          const state = useScriptStore.getState();
          const bId = props.blockId;
          
          editor.chain().focus().deleteRange(range).run();
          state.setBlockVersioning(bId, true);
        },
      },
      {
        title: 'Divider',
        description: 'Horizontal separator line',
        icon: '—',
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).setHorizontalRule().run();
        },
      },
      {
        title: 'Heading 1',
        description: 'Main section heading',
        icon: 'H1',
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
        },
      },
      {
        title: 'Heading 2',
        description: 'Sub-section heading',
        icon: 'H2',
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
        },
      },
      {
        title: 'Heading 3',
        description: 'Small heading',
        icon: 'H3',
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
        },
      },
      {
        title: 'Bullet List',
        description: 'Unordered list of items',
        icon: '•',
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).toggleBulletList().run();
        },
      },
      {
        title: 'Numbered List',
        description: 'Ordered list of items',
        icon: '1.',
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).toggleOrderedList().run();
        },
      },
      {
        title: 'Callout',
        description: 'Highlighted note or guidance',
        icon: '💡',
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).toggleBlockquote().run();
        },
      },
      {
        title: 'Table',
        description: '3×3 table grid',
        icon: '⊞',
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        },
      },
    ];

    return items
      .filter(item => item.title.toLowerCase().includes(query.toLowerCase()))
      .map(item => ({ ...item, blockId })) // Ensure blockId is attached to each item so it's available in the command props
      .slice(0, 12);
  },

  render: () => {
    let component: ReactRenderer | null = null;
    let popup: TippyInstance[] | null = null;

    const onMouseDown = (event: MouseEvent) => {
      if (popup && popup[0]) {
        const target = event.target as HTMLElement;
        const tippyRoot = popup[0].popper;
        if (!tippyRoot.contains(target)) {
          popup[0].hide();
        }
      }
    };

    return {
      onStart: (props: any) => {
        component = new ReactRenderer(CommandList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) {
          return;
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
          maxWidth: 320,
        });

        document.addEventListener('mousedown', onMouseDown);
      },

      onUpdate(props: any) {
        component?.updateProps(props);

        if (!props.clientRect) {
          return;
        }

        popup?.[0]?.setProps({
          getReferenceClientRect: props.clientRect,
        });
      },

      onKeyDown(props: any) {
        if (props.event.key === 'Escape') {
          popup?.[0]?.hide();
          return true;
        }
        return (component?.ref as any)?.onKeyDown(props);
      },

      onExit() {
        document.removeEventListener('mousedown', onMouseDown);
        popup?.[0]?.destroy();
        component?.destroy();
      },
    };
  },
};
