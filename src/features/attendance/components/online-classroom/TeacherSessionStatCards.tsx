import { useQuery } from '@tanstack/react-query';
import {
  Users,
  UserCheck,
  ClockAlert,
  UserX,
  FileText,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import { attendanceService } from '@/features/attendance/services/attendance.service';
import { Skeleton } from '@/components/ui/skeleton';

export interface TeacherSessionStatCardsProps {
  sessionId: string;
  materialsCount?: number;
}

export function TeacherSessionStatCards({
  sessionId,
  materialsCount,
}: TeacherSessionStatCardsProps) {
  const { data: summary, isLoading, isError } = useQuery({
    queryKey: ['session-attendance-summary', sessionId],
    queryFn: () => attendanceService.getSessionSummary(sessionId),
    enabled: Boolean(sessionId),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-slate-200 rounded-xl p-3 space-y-2"
          >
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (isError || !summary) {
    return null;
  }

  // Dữ liệu chính xác từ Backend Summary API
  const totalStudents = summary.totalStudents ?? summary.totalActiveStudents ?? 0;
  const presentCount = summary.presentCount ?? summary.summary?.PRESENT ?? 0;
  const lateCount = summary.lateCount ?? summary.summary?.LATE ?? 0;
  const excusedAbsentCount =
    summary.excusedAbsentCount ?? summary.summary?.EXCUSED_ABSENT ?? 0;
  const unexcusedAbsentCount =
    summary.unexcusedAbsentCount ?? summary.summary?.UNEXCUSED_ABSENT ?? 0;
  const unmarkedCount = summary.unmarkedCount ?? summary.notMarkedCount ?? 0;

  const statItems = [
    {
      label: 'Sĩ số lớp',
      value: totalStudents,
      icon: Users,
      color: 'text-slate-900',
      bgColor: 'bg-slate-100 text-slate-700',
      borderColor: 'border-slate-200',
    },
    {
      label: 'Có mặt',
      value: presentCount,
      icon: UserCheck,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50 text-emerald-700',
      borderColor: 'border-emerald-200',
    },
    {
      label: 'Đi muộn',
      value: lateCount,
      icon: ClockAlert,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50 text-amber-700',
      borderColor: 'border-amber-200',
    },
    {
      label: 'Vắng có phép',
      value: excusedAbsentCount,
      icon: ShieldCheck,
      color: 'text-sky-700',
      bgColor: 'bg-sky-50 text-sky-700',
      borderColor: 'border-sky-200',
    },
    {
      label: 'Vắng không phép',
      value: unexcusedAbsentCount,
      icon: UserX,
      color: 'text-rose-700',
      bgColor: 'bg-rose-50 text-rose-700',
      borderColor: 'border-rose-200',
    },
    {
      label: 'Chưa điểm danh',
      value: unmarkedCount,
      icon: HelpCircle,
      color: 'text-slate-600',
      bgColor: 'bg-slate-100 text-slate-600',
      borderColor: 'border-slate-200',
    },
    {
      label: 'Tài liệu buổi học',
      value: materialsCount ?? 0,
      icon: FileText,
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-50 text-indigo-700',
      borderColor: 'border-indigo-200',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
      {statItems.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className={`bg-white border ${stat.borderColor} rounded-2xl p-3.5 shadow-2xs transition-all hover:shadow-xs`}
          >
            <div className="flex items-center justify-between gap-1 text-slate-500 pb-1">
              <span className="text-[11px] font-medium truncate" title={stat.label}>
                {stat.label}
              </span>
              <div className={`p-1 rounded-lg ${stat.bgColor} shrink-0`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="pt-1 flex items-baseline justify-between">
              <span className={`text-2xl font-bold font-mono tracking-tight ${stat.color}`}>
                {stat.value}
              </span>
              {totalStudents > 0 && stat.label !== 'Sĩ số lớp' && stat.label !== 'Tài liệu buổi học' && (
                <span className="text-[10px] text-slate-400 font-mono">
                  {Math.round((stat.value / totalStudents) * 100)}%
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
