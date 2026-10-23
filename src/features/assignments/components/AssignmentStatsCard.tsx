import { Users, CheckCircle2, Clock, AlertCircle, FileCheck, Award, FileEdit } from 'lucide-react';
import type { AssignmentStatsResponse } from '../types/assignment.types';
import { Card } from '@/components/ui/card';

interface AssignmentStatsCardProps {
  stats?: AssignmentStatsResponse;
  isLoading?: boolean;
}

export function AssignmentStatsCard({ stats, isLoading }: AssignmentStatsCardProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i} className="p-3.5 animate-pulse bg-slate-100/60 border-slate-200">
            <div className="h-3 w-16 bg-slate-200 rounded mb-2" />
            <div className="h-6 w-10 bg-slate-300 rounded" />
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statItems = [
    {
      label: 'Học sinh đủ ĐK',
      value: stats.totalEligible,
      icon: <Users className="w-4 h-4 text-slate-500" />,
      color: 'text-slate-800',
      bgColor: 'bg-slate-50',
    },
    {
      label: 'Đã nộp bài',
      value: stats.submittedCount,
      icon: <CheckCircle2 className="w-4 h-4 text-blue-500" />,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50/60',
    },
    {
      label: 'Chưa nộp bài',
      value: stats.notSubmittedCount,
      icon: <AlertCircle className="w-4 h-4 text-amber-500" />,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50/60',
    },
    {
      label: 'Nộp muộn',
      value: stats.lateCount,
      icon: <Clock className="w-4 h-4 text-rose-500" />,
      color: 'text-rose-700',
      bgColor: 'bg-rose-50/60',
    },
    {
      label: 'Chờ chấm',
      value: stats.pendingReviewCount,
      icon: <FileCheck className="w-4 h-4 text-orange-500" />,
      color: 'text-orange-700',
      bgColor: 'bg-orange-50/60',
    },
    {
      label: 'Chấm nháp',
      value: stats.draftReviewCount,
      icon: <FileEdit className="w-4 h-4 text-indigo-500" />,
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-50/60',
    },
    {
      label: 'Đã trả bài',
      value: stats.returnedCount,
      icon: <Award className="w-4 h-4 text-emerald-500" />,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50/60',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {statItems.map((item) => (
          <Card
            key={item.label}
            className={`p-3.5 border border-slate-200/90 shadow-2xs transition-transform hover:-translate-y-0.5 ${item.bgColor}`}
          >
            <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1">
              <span className="truncate">{item.label}</span>
              {item.icon}
            </div>
            <div className={`text-xl font-bold font-serif ${item.color}`}>
              {item.value}
            </div>
          </Card>
        ))}
      </div>

      {stats.averageScore !== null && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-200/70 rounded-xl text-xs text-amber-900">
          <span className="font-medium">
            Điểm trung bình các bài đã chấm ({stats.returnedCount} bài đã trả):
          </span>
          <span className="font-bold text-sm text-amber-950 font-serif">
            {stats.averageScore.toFixed(2)} / {stats.maxScore} điểm
          </span>
        </div>
      )}
    </div>
  );
}
