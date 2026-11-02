import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { EditorToolbar } from './EditorToolbar';

export interface DocumentEditorRef {
  getJSON: () => Record<string, any>;
  setJSON: (content: Record<string, any>) => void;
  getText: () => string;
}

export interface DocumentEditorProps {
  initialContent?: Record<string, any> | null;
  onUpdate?: (content: Record<string, any>) => void;
  editable?: boolean;
  className?: string;
}

const DEFAULT_DOC_CONTENT = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
    },
  ],
};

export const DocumentEditor = forwardRef<DocumentEditorRef, DocumentEditorProps>(
  function DocumentEditor(
    { initialContent, onUpdate, editable = true, className = '' },
    ref,
  ) {
    const isUserEditedRef = useRef(false);
    const isInternalUpdatingRef = useRef(false);

    const editor = useEditor({
      immediatelyRender: false,
      editable,
      content: initialContent || DEFAULT_DOC_CONTENT,
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
          link: false,
          underline: false,
        }),
        Underline,
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Link.configure({
          openOnClick: false,
          autolink: true,
          defaultProtocol: 'https',
          HTMLAttributes: {
            target: '_blank',
            rel: 'noopener noreferrer',
          },
        }),
        Image.configure({
          inline: true,
          allowBase64: true,
        }),
        Table.configure({
          resizable: true,
        }),
        TableRow,
        TableHeader,
        TableCell,
      ],
      onUpdate: ({ editor: currentEditor }) => {
        // Ngăn onUpdate / autosave trong lúc nạp nội dung từ server hoặc setJSON
        if (isInternalUpdatingRef.current) return;
        isUserEditedRef.current = true;
        if (onUpdate) {
          const json = currentEditor.getJSON();
          onUpdate(json);
        }
      },
    });

    // Đồng bộ an toàn nếu initialContent được truyền/cập nhật sau khi mount
    // nhưng CHỈ KHI người dùng chưa bắt đầu chỉnh sửa nhằm bảo vệ nội dung đang nhập
    useEffect(() => {
      if (editor && initialContent && !editor.isDestroyed) {
        if (isUserEditedRef.current) return;
        const currentJson = editor.getJSON();
        if (JSON.stringify(currentJson) !== JSON.stringify(initialContent)) {
          isInternalUpdatingRef.current = true;
          editor.commands.setContent(initialContent, { emitUpdate: false });
          setTimeout(() => {
            isInternalUpdatingRef.current = false;
          }, 0);
        }
      }
    }, [editor, initialContent]);

    // Expose methods via ref for parent control (e.g. restore from version or local draft)
    useImperativeHandle(
      ref,
      () => ({
        getJSON: () => editor?.getJSON() || DEFAULT_DOC_CONTENT,
        setJSON: (newContent: Record<string, any>) => {
          if (editor) {
            isInternalUpdatingRef.current = true;
            editor.commands.setContent(newContent, { emitUpdate: false });
            setTimeout(() => {
              isInternalUpdatingRef.current = false;
            }, 0);
          }
        },
        getText: () => editor?.getText() || '',
      }),
      [editor],
    );

    // Synchronize editable state if prop changes
    useEffect(() => {
      if (editor && editor.isEditable !== editable) {
        editor.setEditable(editable);
      }
    }, [editor, editable]);

    return (
      <div className={`flex flex-col flex-1 w-full bg-slate-100/70 min-h-screen ${className}`}>
        {/* Sticky Toolbar */}
        {editable && <EditorToolbar editor={editor} disabled={!editable} />}

        {/* Paper Canvas (A4 style page on desktop) */}
        <div className="flex-1 w-full py-3 sm:py-8 px-1.5 sm:px-4 flex justify-center">
          <div className="w-full max-w-4xl min-h-[960px] bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/80 p-3.5 sm:p-10 md:p-16 transition-shadow focus-within:shadow-md">
            <EditorContent editor={editor} className="prose-content min-h-[750px] max-w-full overflow-x-auto" />
          </div>
        </div>
      </div>
    );
  },
);
