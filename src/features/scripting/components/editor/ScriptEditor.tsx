import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Typography from '@tiptap/extension-typography';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import GlobalDragHandle from 'tiptap-extension-global-drag-handle';
import AutoJoiner from 'tiptap-extension-auto-joiner';
import { SlashCommand } from './extensions/SlashCommand';
import { suggestion } from './extensions/suggestion';
import { FormattingBubbleMenu } from './FormattingBubbleMenu';
import { useEffect, useRef, useCallback } from 'react';
import { useScriptStore } from '../../store/useScriptStore';

export const ScriptEditor = () => {
  const { 
    activeVersionId, 
    versions, 
    ensureDefaultVersion,
    syncEditorContent,
    getEditorContent,
  } = useScriptStore();

  const isSettingContent = useRef(false);
  const lastVersionId = useRef<string>('');

  // Ensure we always have a version
  useEffect(() => {
    ensureDefaultVersion();
  }, [ensureDefaultVersion]);

  const activeVersion = versions[activeVersionId];

  const handleUpdate = useCallback(({ editor }: any) => {
    if (isSettingContent.current) return;
    syncEditorContent(editor.getJSON());
  }, [syncEditorContent]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        // Disable extensions we're configuring separately
        dropcursor: { color: '#c96442', width: 2 },
        horizontalRule: {},
        blockquote: {},
        codeBlock: {},
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return 'Heading...';
          }
          return 'Write something, or press "/" for commands...';
        },
        includeChildren: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-terracotta underline cursor-pointer hover:text-terracotta/80',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-generous border border-border-cream max-w-full h-auto my-4 shadow-whisper',
        },
        allowBase64: true,
      }),
      Typography,
      TaskList.configure({
        HTMLAttributes: {
          class: 'task-list',
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'task-item',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'script-table',
        },
      }),
      TableRow,
      TableCell,
      TableHeader,
      GlobalDragHandle.configure({
        dragHandleWidth: 64,
        scrollTreshold: 100,
      }),
      AutoJoiner,
      SlashCommand.configure({
        suggestion,
      }),
    ],
    editorProps: {
      attributes: {
        class: 'prose-editor focus:outline-none',
      },
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find(item => item.type.startsWith('image'));

        if (imageItem) {
          const file = imageItem.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              const url = reader.result as string;
              view.dispatch(
                view.state.tr.replaceSelectionWith(
                  view.state.schema.nodes.image.create({ src: url })
                )
              );
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
      handleDrop: (view, event) => {
        const files = Array.from(event.dataTransfer?.files || []);
        const imageFile = files.find(file => file.type.startsWith('image'));

        if (imageFile) {
          event.preventDefault();
          const reader = new FileReader();
          reader.onload = () => {
            const url = reader.result as string;
            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
            if (coordinates) {
              view.dispatch(
                view.state.tr.insert(
                  coordinates.pos,
                  view.state.schema.nodes.image.create({ src: url })
                )
              );
            }
          };
          reader.readAsDataURL(imageFile);
          return true;
        }
        return false;
      },
    },
    content: '',
    onUpdate: handleUpdate,
  });

  // Sync store content → editor when version changes
  useEffect(() => {
    if (!editor || !activeVersion) return;
    if (lastVersionId.current === activeVersionId) return;

    lastVersionId.current = activeVersionId;
    isSettingContent.current = true;

    const content = getEditorContent();
    editor.commands.setContent(content);

    // Small delay to prevent the onUpdate from firing during setContent
    requestAnimationFrame(() => {
      isSettingContent.current = false;
    });
  }, [activeVersionId, activeVersion, editor, getEditorContent]);

  // Initial content load
  useEffect(() => {
    if (!editor || !activeVersion || lastVersionId.current) return;

    lastVersionId.current = activeVersionId;
    isSettingContent.current = true;

    const content = getEditorContent();
    editor.commands.setContent(content);

    requestAnimationFrame(() => {
      isSettingContent.current = false;
    });
  }, [editor, activeVersion, activeVersionId, getEditorContent]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center py-20 text-olive-gray text-sm">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="w-full relative px-12">
      <FormattingBubbleMenu editor={editor} />
      <div className="relative">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
