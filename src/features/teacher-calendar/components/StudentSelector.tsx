import { useState, useEffect, useMemo } from 'react';
import { Search, X, User, AlertCircle, Loader2, Check } from 'lucide-react';
import { teacherCalendarService } from '../services/teacher-calendar.service';
import type { StudentOption } from '../types/teacher-calendar.types';

interface StudentSelectorProps {
  selectedStudentIds: string[];
  onChange: (ids: string[]) => void;
  // Cho phép truyền sẵn danh sách object học sinh đã biết (từ event detail)
  knownStudents?: StudentOption[];
}

export function StudentSelector({
  selectedStudentIds,
  onChange,
  knownStudents = [],
}: StudentSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<StudentOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);
  const [apiErrorNote, setApiErrorNote] = useState<string | null>(null);

  // Lưu trữ map id -> StudentOption để hiển thị chip chi tiết
  const studentMap = useMemo(() => {
    const map = new Map<string, StudentOption>();
    for (const s of knownStudents) {
      map.set(s.id, s);
    }
    for (const s of searchResults) {
      map.set(s.id, s);
    }
    return map;
  }, [knownStudents, searchResults]);

  // Debounced search
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      setHasQueried(true);
      const res = await teacherCalendarService.searchStudents(searchTerm);
      if (!active) return;
      setIsLoading(false);

      if (res.isAvailable) {
        setSearchResults(res.students);
        setApiErrorNote(null);
      } else {
        setSearchResults([]);
        setApiErrorNote(res.errorNote || 'Không thể tải danh sách học sinh.');
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchTerm]);

  const toggleSelectStudent = (student: StudentOption) => {
    if (selectedStudentIds.includes(student.id)) {
      onChange(selectedStudentIds.filter((id) => id !== student.id));
    } else {
      onChange([...selectedStudentIds, student.id]);
    }
  };

  const removeStudent = (studentId: string) => {
    onChange(selectedStudentIds.filter((id) => id !== studentId));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        Học sinh tham gia ({selectedStudentIds.length})
      </label>

      {/* Selected Chips */}
      {selectedStudentIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
          {selectedStudentIds.map((id) => {
            const student = studentMap.get(id);
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 shadow-2xs font-medium"
              >
                <User className="w-3 h-3 text-slate-400" />
                <span>{student ? student.fullName : `Học sinh #${id.slice(0, 6)}`}</span>
                <button
                  type="button"
                  onClick={() => removeStudent(id)}
                  className="text-slate-400 hover:text-rose-600 focus:outline-none cursor-pointer"
                  aria-label={`Bỏ chọn học sinh ${student?.fullName || id}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm học sinh theo họ tên, email hoặc số điện thoại..."
          className="w-full pl-9 pr-9 py-2 text-sm rounded-lg border border-slate-300 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-amber-600">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        )}
      </div>

      {/* Notice if Backend API has missing endpoint/permission */}
      {apiErrorNote && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">
            <p className="font-semibold">Lưu ý về nguồn dữ liệu học sinh:</p>
            <p>{apiErrorNote}</p>
          </div>
        </div>
      )}

      {/* Search Results Dropdown List */}
      {!apiErrorNote && (
        <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white divide-y divide-slate-100 shadow-xs">
          {isLoading ? (
            <div className="p-3 text-center text-xs text-slate-500">
              Đang tìm kiếm danh sách học sinh...
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-400">
              {hasQueried && searchTerm
                ? 'Không tìm thấy học sinh nào phù hợp.'
                : 'Nhập từ khóa để tìm kiếm học sinh trong hệ thống.'}
            </div>
          ) : (
            searchResults.map((student) => {
              const isSelected = selectedStudentIds.includes(student.id);
              return (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => toggleSelectStudent(student)}
                  className={`w-full flex items-center justify-between p-2.5 text-left text-xs hover:bg-slate-50 transition-colors cursor-pointer ${
                    isSelected ? 'bg-amber-50/50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold shrink-0">
                      {student.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {student.fullName}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {student.email || student.phone || 'Chưa có liên hệ'}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 ml-2">
                    {isSelected ? (
                      <span className="flex items-center justify-center w-5 h-5 rounded-md bg-amber-600 text-white">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="flex items-center justify-center w-5 h-5 rounded-md border border-slate-300 text-slate-400">
                        +
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
