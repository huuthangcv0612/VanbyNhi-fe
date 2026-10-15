import { Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  Clock,
  Sparkles,
  Copy,
  Check,
  Edit2,
  Lock,
  Unlock,
  ArrowRight,
  Hash,
} from 'lucide-react';
import type { ClassItem } from '../types/class.types';
import { Badge } from '@/components/ui/badge';
import {
  getClassStatusMeta,
  formatCurrency,
  formatDateTime,
  formatTime,
} from '@/utils/formatters';

export interface TeacherClassCardProps {
  classItem: ClassItem;
  onEdit: (classItem: ClassItem) => void;
  onToggleStatus: (classItem: ClassItem) => void;
  onCopyCode: (code: string) => void;
  isCopied: boolean;
}

export function TeacherClassCard({
  classItem,
  onEdit,
  onToggleStatus,
  onCopyCode,
  isCopied,
}: TeacherClassCardProps) {
  const statusMeta = getClassStatusMeta(classItem.status);
  const nextSession = classItem.nextSession;
  const isLive = nextSession?.status === 'IN_PROGRESS';
  const isClosed = classItem.status === 'CLOSED';

  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
        isLive
          ? 'border-amber-300 ring-1 ring-amber-200'
          : 'border-slate-200/90 hover:border-amber-200'
      }`}
    >
      <div className="space-y-4">
        {/* Header row: Status badge + Quick actions */}
        <div className="flex items-center justify-between gap-2">
          <Badge className={statusMeta.badgeClass} size="sm">
            {statusMeta.label}
          </Badge>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(classItem)}
              title="Chỉnh sửa thông tin lớp"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onToggleStatus(classItem)}
              title={isClosed ? 'Mở lại lớp học' : 'Đóng lớp học'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {isClosed ? (
                <Unlock className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-amber-600" />
              )}
            </button>
          </div>
        </div>

        {/* Class name & Description */}
        <div className="space-y-1">
          <Link
            to={`/teacher/classes/${classItem.id}`}
            className="font-bold text-base text-slate-900 font-serif leading-snug line-clamp-1 hover:text-amber-800 transition-colors block"
            title={classItem.name}
          >
            {classItem.name}
          </Link>
          {classItem.description && (
            <p
              className="text-xs text-slate-500 line-clamp-2 leading-relaxed"
              title={classItem.description}
            >
              {classItem.description}
            </p>
          )}
        </div>

        {/* Code row: classCode vs joinCode (clearly distinguished) */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
          <div className="flex items-center gap-1 text-slate-500 min-w-0" title={`Mã lớp: ${classItem.classCode || classItem.id}`}>
            <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[11px] text-slate-400">Mã lớp:</span>
            <span className="font-mono text-xs font-semibold text-slate-700 truncate max-w-[90px]">
              {classItem.classCode || classItem.id.slice(0, 8)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-amber-50/90 hover:bg-amber-100/80 transition-colors px-2 py-0.5 rounded-lg border border-amber-200/80 shrink-0">
            <span className="text-[11px] text-amber-800 font-medium">Mã vào:</span>
            <span className="font-mono text-xs font-bold text-amber-950 tracking-wider">
              {classItem.joinCode}
            </span>
            <button
              type="button"
              onClick={() => onCopyCode(classItem.joinCode)}
              title="Sao chép mã tham gia"
              className="text-amber-700 hover:text-amber-950 cursor-pointer p-0.5 rounded transition-colors"
            >
              {isCopied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Quick stats: Students count, Sessions count, Tuition */}
        <div className="divide-y divide-slate-100 text-xs text-slate-600">
          <div className="py-1.5 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              Học sinh:
            </span>
            <span className="font-medium text-slate-800">
              <strong className="text-slate-900 font-bold">{classItem.activeStudentCount ?? 0}</strong>
              <span className="text-slate-400 font-normal">
                {' '}/ {classItem.maxStudents !== null && classItem.maxStudents !== undefined
                  ? `${classItem.maxStudents} chỗ`
                  : 'Không giới hạn'}
              </span>
            </span>
          </div>

          <div className="py-1.5 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Tổng số buổi:
            </span>
            <span className="font-medium text-slate-800">
              {classItem._count?.sessions ?? 0} buổi học
            </span>
          </div>

          <div className="py-1.5 flex items-center justify-between">
            <span className="text-slate-400">Học phí:</span>
            <span className="font-semibold text-amber-900">
              {formatCurrency(classItem.monthlyTuition)} / tháng
            </span>
          </div>
        </div>

        {/* Next session section: strict business rule */}
        {nextSession ? (
          <div
            className={`rounded-xl border p-3 space-y-1.5 transition-colors ${
              isLive
                ? 'border-amber-200 bg-amber-50/50'
                : 'border-slate-200/80 bg-slate-50/60'
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                Buổi học tiếp theo
              </span>

              {isLive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                  ĐANG DIỄN RA
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                  Sắp diễn ra
                </span>
              )}
            </div>

            <p className="text-xs font-bold text-slate-900 truncate" title={nextSession.title}>
              {nextSession.title}
            </p>

            <p className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
              <span>
                {formatDateTime(nextSession.startTime)} - {formatTime(nextSession.endTime)}
              </span>
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-center text-xs text-slate-400 italic">
            Chưa có buổi học sắp tới
          </div>
        )}
      </div>

      {/* Card Action footer */}
      <div className="pt-4 mt-4 border-t border-slate-100">
        <Link
          to={`/teacher/classes/${classItem.id}`}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-700 text-white text-xs font-semibold hover:bg-amber-800 transition-colors shadow-xs cursor-pointer"
        >
          <span>Vào quản lý lớp</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
