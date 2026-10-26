import { useState } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Table as TableIcon,
  Plus,
  Minus,
  Trash2,
  Image as ImageIcon,
  Link as LinkIcon,
  Unlink,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  Minus as DividerIcon,
} from 'lucide-react';

export interface EditorToolbarProps {
  editor: Editor | null;
  disabled?: boolean;
}

export function EditorToolbar({ editor, disabled }: EditorToolbarProps) {
  const [showTableMenu, setShowTableMenu] = useState(false);

  if (!editor) return null;

  const handleAddLink = () => {
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Nhập địa chỉ liên kết (URL):', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const handleAddImage = () => {
    const url = window.prompt('Nhập URL hình ảnh minh họa:', 'https://');
    if (url && url.trim() !== '') {
      editor.chain().focus().setImage({ src: url.trim() }).run();
    }
  };

  const buttonClass = (isActive: boolean) =>
    `p-1.5 sm:p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center min-w-[32px] sm:min-w-[36px] min-h-[32px] sm:min-h-[36px] ${
      isActive
        ? 'bg-amber-100 text-amber-900 font-bold shadow-2xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <div className="flex items-center gap-1 p-1.5 sm:p-2 bg-white/95 backdrop-blur-sm border-b border-slate-200 overflow-x-auto scrollbar-none sticky top-0 z-20">
      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5 pr-1 border-r border-slate-200 shrink-0">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={disabled || !editor.can().undo()}
          className={buttonClass(false)}
          title="Hoàn tác (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={disabled || !editor.can().redo()}
          className={buttonClass(false)}
          title="Làm lại (Ctrl+Y / Cmd+Shift+Z)"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>

      {/* Headings */}
      <div className="flex items-center gap-0.5 px-1 border-r border-slate-200 shrink-0">
        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          disabled={disabled}
          className={buttonClass(editor.isActive('paragraph'))}
          title="Đoạn văn bản thường"
        >
          <Pilcrow className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          disabled={disabled}
          className={buttonClass(editor.isActive('heading', { level: 1 }))}
          title="Tiêu đề chính (H1)"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={disabled}
          className={buttonClass(editor.isActive('heading', { level: 2 }))}
          title="Tiêu đề mục lớn (H2)"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          disabled={disabled}
          className={buttonClass(editor.isActive('heading', { level: 3 }))}
          title="Tiêu đề mục nhỏ (H3)"
        >
          <Heading3 className="w-4 h-4" />
        </button>
      </div>

      {/* Inline Marks: Bold, Italic, Underline, Strike */}
      <div className="flex items-center gap-0.5 px-1 border-r border-slate-200 shrink-0">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
          className={buttonClass(editor.isActive('bold'))}
          title="In đậm (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
          className={buttonClass(editor.isActive('italic'))}
          title="In nghiêng (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={disabled}
          className={buttonClass(editor.isActive('underline'))}
          title="Gạch chân (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={disabled}
          className={buttonClass(editor.isActive('strike'))}
          title="Gạch ngang"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
      </div>

      {/* Alignment */}
      <div className="flex items-center gap-0.5 px-1 border-r border-slate-200 shrink-0">
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          disabled={disabled}
          className={buttonClass(editor.isActive({ textAlign: 'left' }))}
          title="Căn lề trái"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          disabled={disabled}
          className={buttonClass(editor.isActive({ textAlign: 'center' }))}
          title="Căn lề giữa"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          disabled={disabled}
          className={buttonClass(editor.isActive({ textAlign: 'right' }))}
          title="Căn lề phải"
        >
          <AlignRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          disabled={disabled}
          className={buttonClass(editor.isActive({ textAlign: 'justify' }))}
          title="Căn đều hai bên"
        >
          <AlignJustify className="w-4 h-4" />
        </button>
      </div>

      {/* Lists & Quotes */}
      <div className="flex items-center gap-0.5 px-1 border-r border-slate-200 shrink-0">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
          className={buttonClass(editor.isActive('bulletList'))}
          title="Danh sách dấu chấm"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
          className={buttonClass(editor.isActive('orderedList'))}
          title="Danh sách số thứ tự"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          disabled={disabled}
          className={buttonClass(editor.isActive('blockquote'))}
          title="Đoạn trích dẫn văn học"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          disabled={disabled}
          className={buttonClass(false)}
          title="Đường phân cách ngang"
        >
          <DividerIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Tables, Links, Images */}
      <div className="flex items-center gap-0.5 px-1 shrink-0 relative">
        <button
          type="button"
          onClick={handleAddLink}
          disabled={disabled}
          className={buttonClass(editor.isActive('link'))}
          title="Chèn / sửa liên kết"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        {editor.isActive('link') && (
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            disabled={disabled}
            className={buttonClass(false)}
            title="Gỡ liên kết"
          >
            <Unlink className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={handleAddImage}
          disabled={disabled}
          className={buttonClass(false)}
          title="Chèn ảnh minh họa"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        {/* Table Controls */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTableMenu(!showTableMenu)}
            disabled={disabled}
            className={buttonClass(editor.isActive('table'))}
            title="Quản lý bảng biểu"
          >
            <TableIcon className="w-4 h-4" />
          </button>

          {showTableMenu && (
            <div className="absolute right-0 top-full mt-1.5 p-2 bg-white rounded-xl shadow-xl border border-slate-200 z-30 min-w-[200px] space-y-1">
              {!editor.isActive('table') ? (
                <button
                  type="button"
                  onClick={() => {
                    editor
                      .chain()
                      .focus()
                      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                      .run();
                    setShowTableMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-900 rounded-lg font-medium flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo bảng mới (3x3)</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().addRowAfter().run();
                      setShowTableMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm hàng dưới
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().addColumnAfter().run();
                      setShowTableMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm cột bên phải
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().deleteRow().run();
                      setShowTableMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" /> Xóa hàng hiện tại
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().deleteColumn().run();
                      setShowTableMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" /> Xóa cột hiện tại
                  </button>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().deleteTable().run();
                      setShowTableMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xóa toàn bộ bảng
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
