import { ClipboardCheck } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/feedback/EmptyState';

export function AttendancePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Điểm danh"
        description="Điểm danh chuyên cần học sinh theo từng buổi học văn học"
      />

      <Card>
        <CardHeader>
          <CardTitle>Điểm danh theo buổi học</CardTitle>
          <CardDescription>
            Chọn buổi học từ lịch học để thực hiện điểm danh hoặc xem thống kê chuyên cần
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<ClipboardCheck className="w-6 h-6 text-slate-400" />}
            title="Sẵn sàng cho mô-đun Điểm danh chi tiết"
            description="Tính năng điểm danh được liên kết trực tiếp với từng Buổi học (Class Session). Vui lòng vào trang Buổi học để mở danh sách điểm danh theo buổi."
          />
        </CardContent>
      </Card>
    </div>
  );
}
