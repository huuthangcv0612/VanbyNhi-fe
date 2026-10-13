import { BookOpen, Calendar, FileText, CreditCard, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/feedback/EmptyState';

export function StudentDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Góc học tập — ${user?.fullName || 'Học sinh'}`}
        description="Theo dõi lớp học, lịch học trực tuyến, bài tập và học phí môn Văn"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Không gian học sinh</CardTitle>
            <CardDescription>Các khu vực học tập và rèn luyện kỹ năng viết</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              to="/student/classes"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-colors text-slate-800 text-sm font-medium"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-emerald-700" />
                <span>Lớp học văn đang tham gia</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              to="/student/schedules"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-colors text-slate-800 text-sm font-medium"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-blue-700" />
                <span>Lịch học & phòng học trực tuyến (Meet)</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              to="/student/assignments"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-colors text-slate-800 text-sm font-medium"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-amber-700" />
                <span>Bài tập cần nộp & Kết quả chấm bài</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              to="/student/tuition"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-colors text-slate-800 text-sm font-medium"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-purple-700" />
                <span>Thông tin học phí và biên lai</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bài tập cần hoàn thành</CardTitle>
            <CardDescription>Danh sách bài văn và chuyên đề cần nộp</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={<FileText className="w-6 h-6 text-slate-400" />}
              title="Không có bài tập sắp tới hạn"
              description="Hiện tại bạn đã nộp đầy đủ bài tập được giao hoặc lớp chưa có đề bài mới."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
