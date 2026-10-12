import { useState, type FormEvent } from 'react';
import { Tag, Plus, Edit2, Trash2, Check, AlertCircle, Palette } from 'lucide-react';
import type { CalendarLabel } from '../types/teacher-calendar.types';
import {
  useTeacherLabels,
  useCreateLabel,
  useUpdateLabel,
  useDeleteLabel,
} from '../hooks/useTeacherLabels';
import { isValidHexColor } from '../utils/date-utils';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LabelManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Bảng gợi ý màu sắc tinh tế cho giáo viên lựa chọn nhanh
const PRESET_COLORS = [
  '#4F46E5', // Indigo
  '#2563EB', // Blue
  '#0D9488', // Teal
  '#059669', // Emerald
  '#D97706', // Amber
  '#EA580C', // Orange
  '#DC2626', // Red
  '#9333EA', // Purple
  '#DB2777', // Pink
  '#475569', // Slate
];

export function LabelManagerModal({ isOpen, onClose }: LabelManagerModalProps) {
  const { data: labels = [], isLoading } = useTeacherLabels();
  const createLabelMutation = useCreateLabel();
  const updateLabelMutation = useUpdateLabel();
  const deleteLabelMutation = useDeleteLabel();

  // State form
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#4F46E5');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // State xác nhận xóa
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const resetForm = () => {
    setEditingLabelId(null);
    setName('');
    setColor('#4F46E5');
    setDescription('');
    setErrorMsg(null);
  };

  const handleStartEdit = (label: CalendarLabel) => {
    setEditingLabelId(label.id);
    setName(label.name);
    setColor(label.color);
    setDescription(label.description || '');
    setErrorMsg(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập tên nhãn.');
      return;
    }
    if (!isValidHexColor(color)) {
      setErrorMsg('Mã màu HEX không hợp lệ (ví dụ: #4F46E5).');
      return;
    }

    try {
      if (editingLabelId) {
        await updateLabelMutation.mutateAsync({
          id: editingLabelId,
          payload: {
            name: name.trim(),
            color: color.trim(),
            description: description.trim() || undefined,
          },
        });
      } else {
        await createLabelMutation.mutateAsync({
          name: name.trim(),
          color: color.trim(),
          description: description.trim() || undefined,
        });
      }
      resetForm();
    } catch {
      // Error handled by mutation
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLabelMutation.mutateAsync(id);
      setDeleteConfirmId(null);
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        setDeleteConfirmId(null);
        onClose();
      }}
      title="Quản lý Nhãn màu cá nhân"
      description="Giáo viên tự quản lý các nhãn màu để phân loại các ca dạy học của riêng mình."
      maxWidth="lg"
      footer={
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            resetForm();
            setDeleteConfirmId(null);
            onClose();
          }}
        >
          Đóng
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Form thêm / sửa nhãn */}
        <form
          onSubmit={handleSubmit}
          className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-amber-700" />
              <span>{editingLabelId ? 'Chỉnh sửa nhãn' : 'Tạo nhãn mới'}</span>
            </h4>
            {editingLabelId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                Hủy sửa
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Tên nhãn"
              placeholder="VD: Lớp 12 Chuyên Văn, Luyện đề..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mã màu HEX
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={isValidHexColor(color) ? color : '#4F46E5'}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-9 h-9 p-0.5 rounded-lg border border-slate-300 cursor-pointer bg-white shrink-0"
                  title="Chọn màu"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#4F46E5"
                  className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Color Presets */}
          <div>
            <p className="text-xs font-medium text-slate-600 mb-1.5">Gợi ý màu:</p>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className="w-6 h-6 rounded-md border border-white/50 shadow-2xs hover:scale-110 transition-transform cursor-pointer flex items-center justify-center"
                  title={c}
                >
                  {color.toLowerCase() === c.toLowerCase() && (
                    <Check className="w-3.5 h-3.5 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Mô tả tùy chọn"
            placeholder="Ghi chú ngắn về nhãn này..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {errorMsg && (
            <p className="text-xs text-rose-600 font-medium">{errorMsg}</p>
          )}

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={createLabelMutation.isPending || updateLabelMutation.isPending}
              leftIcon={
                editingLabelId ? <Edit2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />
              }
            >
              {editingLabelId ? 'Cập nhật nhãn' : 'Lưu nhãn mới'}
            </Button>
          </div>
        </form>

        {/* Danh sách nhãn hiện có */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center justify-between">
            <span>Danh sách nhãn của bạn ({labels.length})</span>
          </h4>

          {isLoading ? (
            <p className="text-xs text-slate-500 py-4 text-center">Đang tải danh sách nhãn...</p>
          ) : labels.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Tag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Chưa có nhãn màu nào</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Hệ thống không tự gán nhãn mặc định. Bạn có thể tạo nhãn riêng ở phía trên để dễ dàng nhận biết ca dạy trên lịch.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white overflow-hidden">
              {labels.map((lbl) => {
                const isConfirmingDelete = deleteConfirmId === lbl.id;

                return (
                  <div
                    key={lbl.id}
                    className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-4 h-4 rounded-full shrink-0 border border-black/10"
                        style={{ backgroundColor: lbl.color }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {lbl.name}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {lbl.color}
                          </span>
                        </div>
                        {lbl.description && (
                          <p className="text-xs text-slate-500 truncate">
                            {lbl.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 justify-end">
                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-2 bg-rose-50 p-1.5 rounded-lg border border-rose-200 text-xs">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span className="text-rose-800 text-[11px]">Xác nhận xóa?</span>
                          <button
                            type="button"
                            onClick={() => handleDelete(lbl.id)}
                            disabled={deleteLabelMutation.isPending}
                            className="font-bold text-rose-700 hover:underline cursor-pointer"
                          >
                            Xóa
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-slate-600 hover:underline cursor-pointer"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(lbl)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                            title="Sửa nhãn"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(lbl.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Xóa nhãn"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
