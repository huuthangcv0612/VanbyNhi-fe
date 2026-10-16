import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Calendar,
  Clock,
  Search,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';
import { teacherClassesService } from '@/features/classes/services/classes.service';
import type { ClassMemberItem, TeacherClassSessionItem } from '@/features/classes/types/class.types';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { formatDate, formatTime, getSessionStatusMeta } from '@/utils/formatters';
import { getApiErrorMessage } from '@/lib/api-client';

export interface TeacherClassMembersAndHistoryWorkspaceProps {
  classId: string;
  currentSessionId: string;
}

export function TeacherClassMembersAndHistoryWorkspace({
  classId,
  currentSessionId,
}: TeacherClassMembersAndHistoryWorkspaceProps) {
  const [subTab, setSubTab] = useState<'members' | 'sessions'>('members');
  const [searchMember, setSearchMember] = useState('');
  const [searchSession, setSearchSession] = useState('');

  // 1. Tải danh sách học sinh lớp học
  const {
    data: membersData,
    isLoading: isLoadingMembers,
    isError: isMembersError,
    error: membersError,
    refetch: refetchMembers,
  } = useQuery({
    queryKey: ['teacher-class-members', classId],
    queryFn: () => teacherClassesService.getClassMembers(classId, { limit: 100 }),
    enabled: Boolean(classId),
  });

  // 2. Tải danh sách các buổi học của lớp
  const {
    data: sessionsData,
    isLoading: isLoadingSessions,
    isError: isSessionsError,
    error: sessionsError,
    refetch: refetchSessions,
  } = useQuery({
    queryKey: ['teacher-class-sessions', classId],
    queryFn: () => teacherClassesService.getClassSessions(classId, { limit: 100 }),
    enabled: Boolean(classId),
  });

  const members = membersData?.items || [];
  const sessions = sessionsData?.items || [];

  const filteredMembers = members.filter((m: ClassMemberItem) => {
    if (!searchMember) return true;
    const term = searchMember.toLowerCase();
    return (
      m.student.fullName.toLowerCase().includes(term) ||
      (m.student.phone && m.student.phone.includes(term)) ||
      (m.student.email && m.student.email.toLowerCase().includes(term))
    );
  });

  const filteredSessions = sessions.filter((s: TeacherClassSessionItem) => {
    if (!searchSession) return true;
    const term = searchSession.toLowerCase();
    return (
      s.title.toLowerCase().includes(term) ||
      (s.description && s.description.toLowerCase().includes(term))
    );
  });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50/70 p-1.5 gap-1.5">
        <button
          type="button"
          onClick={() => setSubTab('members')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            subTab === 'members'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4 text-amber-700" />
          <span>Danh sách học sinh lớp ({members.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('sessions')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            subTab === 'sessions'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Calendar className="w-4 h-4 text-amber-700" />
          <span>Lịch sử các buổi học ({sessions.length})</span>
        </button>
      </div>

      {/* Tab 1: Danh sách học sinh */}
      {subTab === 'members' && (
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Input
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
                placeholder="Tìm học sinh theo tên, SĐT..."
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                className="text-xs"
              />
            </div>
            <p className="text-xs text-slate-500">
              Tổng số thành viên: <strong>{filteredMembers.length}</strong> học sinh
            </p>
          </div>

          {isLoadingMembers ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : isMembersError ? (
            <ErrorState
              title="Không thể tải danh sách học sinh"
              message={getApiErrorMessage(membersError)}
              onRetry={() => refetchMembers()}
            />
          ) : filteredMembers.length === 0 ? (
            <EmptyState
              title="Không tìm thấy học sinh nào"
              description="Không có dữ liệu học sinh khớp với tìm kiếm của bạn."
            />
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {filteredMembers.map((m: ClassMemberItem, idx: number) => {
                const s = m.student;
                return (
                  <div
                    key={m.id}
                    className="p-3.5 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs text-slate-400 font-mono w-6 text-center shrink-0">
                        {idx + 1}
                      </span>
                      {s.avatarUrl ? (
                        <img
                          src={s.avatarUrl}
                          alt={s.fullName}
                          className="h-9 w-9 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                          {s.fullName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-slate-900 truncate">
                          {s.fullName}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono truncate">
                          {s.phone && <span>{s.phone}</span>}
                          {s.phone && s.email && <span>•</span>}
                          {s.email && <span>{s.email}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                        {m.status === 'ACTIVE' ? 'Đang học' : m.status}
                      </Badge>
                      <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                        Tham gia: {formatDate(m.joinedAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Lịch sử các buổi học */}
      {subTab === 'sessions' && (
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Input
                value={searchSession}
                onChange={(e) => setSearchSession(e.target.value)}
                placeholder="Tìm buổi học theo tiêu đề..."
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                className="text-xs"
              />
            </div>
            <p className="text-xs text-slate-500">
              Tổng số buổi học: <strong>{filteredSessions.length}</strong>
            </p>
          </div>

          {isLoadingSessions ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : isSessionsError ? (
            <ErrorState
              title="Không thể tải lịch sử buổi học"
              message={getApiErrorMessage(sessionsError)}
              onRetry={() => refetchSessions()}
            />
          ) : filteredSessions.length === 0 ? (
            <EmptyState
              title="Không tìm thấy buổi học nào"
              description="Lớp học chưa có buổi học nào khác."
            />
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {filteredSessions.map((sess: TeacherClassSessionItem) => {
                const isCurrent = sess.id === currentSessionId;
                const meta = getSessionStatusMeta(sess.status);

                return (
                  <div
                    key={sess.id}
                    className={`p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isCurrent
                        ? 'bg-amber-50/70 border-l-4 border-amber-800'
                        : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-xs text-slate-900 truncate">
                          {sess.title}
                        </h4>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                            Buổi hiện tại
                          </span>
                        )}
                        <Badge className={`${meta.badgeClass} text-[10px]`}>
                          {meta.label}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-amber-700" />
                          {formatDate(sess.startTime)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-700" />
                          {formatTime(sess.startTime)} - {formatTime(sess.endTime)}
                        </span>
                        {sess.lessonRecord && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-emerald-700">
                              <CheckCircle className="w-3 h-3" />
                              Đã có nhật ký
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {!isCurrent && (
                      <Link
                        to={`/teacher/sessions/${sess.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-900 shrink-0 self-end sm:self-center"
                      >
                        <span>Mở buổi học này</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
