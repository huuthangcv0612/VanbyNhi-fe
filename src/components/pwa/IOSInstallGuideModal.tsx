import { Share, PlusSquare, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

export interface IOSInstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IOSInstallGuideModal({ isOpen, onClose }: IOSInstallGuideModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cài đặt VanbyNhi trên iOS / iPadOS"
      description="Thêm ứng dụng vào Màn hình chính của iPhone/iPad chỉ trong vài giây"
      maxWidth="md"
      footer={
        <div className="flex justify-end w-full">
          <Button variant="primary" size="md" onClick={onClose}>
            Đã hiểu
          </Button>
        </div>
      }
    >
      <div className="space-y-4 py-2 text-slate-700">
        <div className="flex items-start gap-3.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-700 text-white shadow-xs">
            <Share className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              Bước 1: Mở menu Chia sẻ
            </h4>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Trên trình duyệt Safari, nhấn vào nút <span className="font-semibold text-amber-900">Chia sẻ (Share)</span> ở thanh công cụ dưới cùng (iPhone) hoặc góc trên (iPad).
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-white shadow-xs">
            <PlusSquare className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              Bước 2: Chọn "Thêm vào MH chính"
            </h4>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Cuộn danh sách tác vụ xuống và chọn dòng <span className="font-semibold text-slate-900">"Thêm vào Màn hình chính" (Add to Home Screen)</span>.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              Bước 3: Xác nhận Thêm
            </h4>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Nhấn nút <span className="font-semibold text-slate-900">Thêm (Add)</span> ở góc trên bên phải màn hình. Biểu tượng VanbyNhi sẽ xuất hiện trên màn hình thiết bị của bạn.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
