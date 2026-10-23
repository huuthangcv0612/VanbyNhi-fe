import { useState, useMemo } from 'react';
import { Search, User, Clock, History, Edit3 } from 'lucide-react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { AssignmentStatusBadge } from './AssignmentStatusBadge';
import { formatDateTime } from '@/utils/formatters';
import type { EligibleStudentItem } from '../types/assignment.types';

export interface EligibleStudentsTableProps {
  students: EligibleStudentItem[];
  maxScore?: number;
  onGradeStudent: (submissionId: string) => void;
  onViewHistory: (studentId: string, studentName: string) => void;
}

export function EligibleStudentsTable({
  students,
  maxScore = 10,
  onGradeStudent,
  onViewHistory,
}: EligibleStudentsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // 1. Search term
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const matchName = s.fullName.toLowerCase().includes(term);
        const matchPhone = s.phone.includes(term);
        if (!matchName && !matchPhone) return false;
      }

      // 2. Status filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'NOT_SUBMITTED' && s.status !== 'NOT_SUBMITTED') return false;
        if (statusFilter === 'SUBMITTED' && s.status !== 'SUBMITTED') return false;
        if (statusFilter === 'LATE' && (!s.isLate || s.status === 'NOT_SUBMITTED')) return false;
        if (statusFilter === 'GRADED' && s.status !== 'GRADED') return false;
        if (statusFilter === 'RETURNED' && s.status !== 'RETURNED') return false;
      }

      return true;
    });
  }, [students, searchTerm, statusFilter]);

  return (
    <div className="space-y-3.5">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên học sinh hoặc SĐT..."
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'ALL', label: 'Tất cả' },
            { key: 'NOT_SUBMITTED', label: 'Chưa nộp' },
            { key: 'SUBMITTED', label: 'Chờ chấm' },
            { key: 'LATE', label: 'Nộp muộn' },
            { key: 'GRADED', label: 'Chấm nháp' },
            { key: 'RETURNED', label: 'Đã trả bài' },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatusFilter(f.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                statusFilter === f.key
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">STT</TableHead>
              <TableHead>Học sinh</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Lần nộp</TableHead>
              <TableHead>Thời gian nộp</TableHead>
              <TableHead>Điểm số</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12">
                  <EmptyState
                    icon={<User className="w-6 h-6 text-slate-400" />}
                    title="Không có học sinh nào phù hợp"
                    description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm."
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student, idx) => (
                <TableRow key={student.studentId} className="hover:bg-slate-50/80">
                  <TableCell className="text-center text-xs text-slate-400 font-medium">
                    {idx + 1}
                  </TableCell>

                  {/* Thông tin học sinh */}
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800 text-xs font-bold font-serif shrink-0">
                        {student.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {student.fullName}
                        </p>
                        <p className="text-[11px] text-slate-500">{student.phone}</p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Trạng thái bài làm */}
                  <TableCell>
                    <AssignmentStatusBadge
                      status={student.status}
                      isLate={student.isLate}
                    />
                  </TableCell>

                  {/* Lần nộp */}
                  <TableCell className="text-xs text-slate-700">
                    {student.submissionCount > 0 ? (
                      <span className="font-medium">
                        Lần {student.attemptNumber || student.submissionCount}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </TableCell>

                  {/* Thời gian nộp */}
                  <TableCell className="text-xs text-slate-600">
                    {student.submittedAt ? (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatDateTime(student.submittedAt)}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </TableCell>

                  {/* Điểm số */}
                  <TableCell>
                    {student.score !== null ? (
                      <div className="flex items-center gap-1.5 font-bold font-serif text-sm">
                        <span className={student.reviewStatus === 'RETURNED' ? 'text-emerald-700' : 'text-indigo-700'}>
                          {student.score}
                        </span>
                        <span className="text-xs text-slate-400 font-normal">/ {maxScore}</span>
                        {student.reviewStatus === 'DRAFT' && (
                          <Badge size="sm" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] py-0 px-1">
                            Nháp
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Chưa chấm</span>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {student.submissionCount > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewHistory(student.studentId, student.fullName)}
                          className="text-xs h-8 px-2 text-slate-600 hover:text-slate-900 cursor-pointer"
                          title="Xem lịch sử các lần nộp"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span className="hidden md:inline ml-1">Lịch sử ({student.submissionCount})</span>
                        </Button>
                      )}

                      {student.latestSubmissionId ? (
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => onGradeStudent(student.latestSubmissionId!)}
                          className="text-xs h-8 px-2.5 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 mr-1" />
                          <span>
                            {student.status === 'RETURNED'
                              ? 'Xem / Chấm lại'
                              : student.status === 'GRADED'
                                ? 'Sửa bản nháp'
                                : 'Chấm bài'}
                          </span>
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400 italic px-2">Chưa có bài</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
