import { BookOpen, Calendar, ClipboardCheck, FileText, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/feedback/EmptyState';

export function TeacherDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bàn làm việc Giáo viên — ${user?.fullName || 'Thầy/Cô'}`}
        description="Quản lý lớp phụ trách, giáo án, buổi học và chấm bài tập văn học"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Chức năng giảng dạy</CardTitle>
            <CardDescription>Các khu vực công tác hàng ngày của giáo viên</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              to="/teacher/classes"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-colors text-slate-800 text-sm font-medium"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-blue-700" />
                <span>Danh sách lớp học phụ trách</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              to="/teacher/sessions"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-colors text-slate-800 text-sm font-medium"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-amber-700" />
                <span>Lịch giảng dạy & Nhật ký bài giảng</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              to="/teacher/attendance"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-colors text-slate-800 text-sm font-medium"
            >
              <div className="flex items-center gap-3">
                <ClipboardCheck className="w-4 h-4 text-emerald-700" />
                <span>Điểm danh học sinh các buổi học</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              to="/teacher/assignments"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-colors text-slate-800 text-sm font-medium"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-purple-700" />
                <span>Chấm bài tập & Nhận xét học sinh</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lịch dạy sắp tới</CardTitle>
            <CardDescription>Thông tin các buổi học văn kế tiếp</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={<Calendar className="w-6 h-6 text-slate-400" />}
              title="Chưa có buổi học nào hôm nay"
              description="Lịch giảng dạy chi tiết sẽ được hiển thị khi lớp học được kích hoạt lịch học chính thức."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
