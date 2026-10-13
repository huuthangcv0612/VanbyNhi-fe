import type {
  MeetingType,
  PositionedSchedule,
  ScheduleStatus,
  StudentSchedule,
} from '../types/student-schedule.types';

export const VN_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Lấy chuỗi ngày YYYY-MM-DD theo múi giờ Việt Nam (Asia/Ho_Chi_Minh)
 */
export function formatDateKey(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: VN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

/**
 * Kiểm tra 2 ngày có cùng ngày/tháng/năm theo giờ Việt Nam
 */
export function isSameDayVN(d1: Date, d2: Date): boolean {
  return formatDateKey(d1) === formatDateKey(d2);
}

/**
 * Kiểm tra ngày có phải là Hôm nay theo giờ Việt Nam
 */
export function isTodayVN(date: Date): boolean {
  return isSameDayVN(date, new Date());
}

/**
 * Lấy ngày đầu tuần (Thứ Hai) lúc 00:00:00
 */
export function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 là CN, 1 là T2...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Lấy ngày cuối tuần (Chủ Nhật) lúc 23:59:59.999
 */
export function getEndOfWeek(date: Date): Date {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Sinh danh sách 7 ngày trong tuần từ Thứ Hai đến Chủ Nhật
 */
export function getWeekDays(referenceDate: Date): Date[] {
  const start = getStartOfWeek(referenceDate);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(day);
  }
  return days;
}

/**
 * Sinh lưới tháng 7 cột bắt đầu từ Thứ Hai, gồm cả các ngày đệm từ tháng trước và tháng sau
 */
export function getMonthGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
  const lastOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const gridStart = getStartOfWeek(firstOfMonth);
  const gridEnd = getEndOfWeek(lastOfMonth);

  const days: Date[] = [];
  const current = new Date(gridStart);
  while (current <= gridEnd) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  while (days.length % 7 !== 0 || days.length < 35) {
    const nextDay = new Date(days[days.length - 1]);
    nextDay.setDate(nextDay.getDate() + 1);
    days.push(nextDay);
  }

  return days;
}

/**
 * Chuyển ngày thành chuỗi ISO 8601 đại diện cho điểm bắt đầu của ngày (00:00:00.000) theo múi giờ Việt Nam (+07:00)
 */
export function toVnIsoStartOfDay(date: Date): string {
  const dateKey = formatDateKey(date);
  return `${dateKey}T00:00:00.000+07:00`;
}

/**
 * Chuyển ngày thành chuỗi ISO 8601 đại diện cho điểm kết thúc của ngày (23:59:59.999) theo múi giờ Việt Nam (+07:00)
 */
export function toVnIsoEndOfDay(date: Date): string {
  const dateKey = formatDateKey(date);
  return `${dateKey}T23:59:59.999+07:00`;
}

/**
 * Tính khoảng thời gian truy vấn cho Tháng (toàn bộ lưới ngày hiển thị)
 */
export function getMonthQueryRange(currentDate: Date): { from: string; to: string } {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const grid = getMonthGrid(year, month);
  const gridStart = grid[0];
  const gridEnd = grid[grid.length - 1];

  return {
    from: toVnIsoStartOfDay(gridStart),
    to: toVnIsoEndOfDay(gridEnd),
  };
}

/**
 * Tính khoảng thời gian truy vấn cho Tuần (Thứ Hai 00:00:00 đến Chủ Nhật 23:59:59.999)
 */
export function getWeekQueryRange(currentDate: Date): { from: string; to: string } {
  const start = getStartOfWeek(currentDate);
  const end = getEndOfWeek(currentDate);

  return {
    from: toVnIsoStartOfDay(start),
    to: toVnIsoEndOfDay(end),
  };
}

/**
 * Tính khoảng thời gian truy vấn cho Ngày (00:00:00 đến 23:59:59.999)
 */
export function getDayQueryRange(currentDate: Date): { from: string; to: string } {
  return {
    from: toVnIsoStartOfDay(currentDate),
    to: toVnIsoEndOfDay(currentDate),
  };
}

/**
 * Định dạng giờ: HH:mm (theo Asia/Ho_Chi_Minh)
 */
export function formatTimeVN(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '--:--';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '--:--';

  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: VN_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

/**
 * Định dạng ngày: DD/MM/YYYY
 */
export function formatDateVN(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '-';

  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: VN_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Định dạng ngày thứ: Thứ Hai, 10/11/2026
 */
export function formatFullDateVN(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '-';

  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: VN_TIMEZONE,
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Tiêu đề tháng: Tháng 10, 2026
 */
export function formatMonthTitleVN(date: Date): string {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `Tháng ${month}, ${year}`;
}

/**
 * Tiêu đề ngày: Thứ Ba, ngày 10 tháng 11 năm 2026
 */
export function formatDayTitleVN(date: Date): string {
  const d = new Date(date);
  const weekdayName = new Intl.DateTimeFormat('vi-VN', {
    timeZone: VN_TIMEZONE,
    weekday: 'long',
  }).format(d);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return `${weekdayName}, ngày ${day} tháng ${month} năm ${year}`;
}

/**
 * Khoảng ngày trong tuần: 10 – 16 thg 11, 2026
 */
export function formatWeekRangeVN(referenceDate: Date): string {
  const start = getStartOfWeek(referenceDate);
  const end = getEndOfWeek(referenceDate);

  const startDay = start.getDate();
  const startMonth = start.getMonth() + 1;
  const startYear = start.getFullYear();

  const endDay = end.getDate();
  const endMonth = end.getMonth() + 1;
  const endYear = end.getFullYear();

  if (startYear === endYear) {
    if (startMonth === endMonth) {
      return `${startDay} – ${endDay} thg ${startMonth}, ${startYear}`;
    }
    return `${startDay} thg ${startMonth} – ${endDay} thg ${endMonth}, ${startYear}`;
  }

  return `${startDay} thg ${startMonth}, ${startYear} – ${endDay} thg ${endMonth}, ${endYear}`;
}

/**
 * Tính số phút từ 00:00 theo múi giờ Việt Nam
 */
export function getMinutesFromMidnightVN(dateInput: string | Date): number {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: VN_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);

  let hours = 0;
  let minutes = 0;
  for (const part of parts) {
    if (part.type === 'hour') hours = parseInt(part.value, 10);
    if (part.type === 'minute') minutes = parseInt(part.value, 10);
  }
  return hours * 60 + minutes;
}

/**
 * Kiểm tra xem lịch có nằm trong điều kiện giao nhau với khoảng thời gian (from, to) hay không
 * Điều kiện theo hợp đồng Backend: startAt <= to && endAt >= from
 */
export function isScheduleIntersecting(
  schedule: StudentSchedule,
  fromIso: string,
  toIso: string,
): boolean {
  const sStart = new Date(schedule.startAt).getTime();
  const sEnd = new Date(schedule.endAt).getTime();
  const rangeFrom = new Date(fromIso).getTime();
  const rangeTo = new Date(toIso).getTime();

  return sStart <= rangeTo && sEnd >= rangeFrom;
}

/**
 * Kiểm tra xem buổi học có thuộc trạng thái "Sắp diễn ra" hay không:
 * status === 'SCHEDULED' và thời gian kết thúc chưa trôi qua so với hiện tại
 */
export function isScheduleUpcoming(schedule: StudentSchedule, now = new Date()): boolean {
  if (schedule.status !== 'SCHEDULED') return false;
  return new Date(schedule.endAt).getTime() >= now.getTime();
}

/**
 * Kiểm tra xem thời gian buổi học đã trôi qua chưa
 */
export function hasScheduleEnded(schedule: StudentSchedule, now = new Date()): boolean {
  return new Date(schedule.endAt).getTime() < now.getTime();
}

/**
 * Kiểm tra URL hợp lệ để mở trình duyệt
 */
export function isValidHttpUrl(urlString?: string | null): boolean {
  if (!urlString) return false;
  try {
    const url = new URL(urlString.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Lấy metadata hiển thị trạng thái buổi học (tiếng Việt & màu sắc)
 */
export function getScheduleStatusMeta(status: ScheduleStatus, isUpcoming = false) {
  switch (status) {
    case 'SCHEDULED':
      if (isUpcoming) {
        return {
          label: 'Sắp diễn ra',
          badgeVariant: 'primary' as const,
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
          dotColor: 'bg-amber-500',
          textColor: 'text-amber-800',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
        };
      }
      return {
        label: 'Đã lên lịch',
        badgeVariant: 'info' as const,
        badgeClass: 'bg-sky-100 text-sky-800 border-sky-300',
        dotColor: 'bg-sky-500',
        textColor: 'text-sky-800',
        bgColor: 'bg-sky-50',
        borderColor: 'border-sky-200',
      };
    case 'COMPLETED':
      return {
        label: 'Đã hoàn thành',
        badgeVariant: 'success' as const,
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        dotColor: 'bg-emerald-500',
        textColor: 'text-emerald-800',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
      };
    case 'CANCELLED':
      return {
        label: 'Đã hủy',
        badgeVariant: 'danger' as const,
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
        dotColor: 'bg-rose-500',
        textColor: 'text-rose-800',
        bgColor: 'bg-rose-50/70',
        borderColor: 'border-rose-200',
      };
    default:
      return {
        label: status,
        badgeVariant: 'default' as const,
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
        dotColor: 'bg-slate-500',
        textColor: 'text-slate-700',
        bgColor: 'bg-slate-50',
        borderColor: 'border-slate-200',
      };
  }
}

/**
 * Lấy metadata hiển thị hình thức học
 */
export function getMeetingTypeMeta(type: MeetingType) {
  switch (type) {
    case 'ONLINE_MEET':
      return {
        label: 'Google Meet',
        badgeVariant: 'info' as const,
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      };
    case 'ONLINE_WEB':
      return {
        label: 'Phòng học trực tuyến',
        badgeVariant: 'primary' as const,
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      };
    case 'IN_PERSON':
      return {
        label: 'Học trực tiếp',
        badgeVariant: 'default' as const,
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      };
    default:
      return {
        label: type,
        badgeVariant: 'default' as const,
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      };
  }
}

export const CALENDAR_START_HOUR = 6; // 06:00
export const CALENDAR_END_HOUR = 22; // 22:00
export const HOUR_HEIGHT_PX = 64;

/**
 * Bố trí toạ độ hiển thị cho các buổi học trong ngày, xử lý các buổi trùng giờ không che lấp nhau
 */
export function layoutDaySchedules(
  schedules: StudentSchedule[],
  targetDate: Date,
  startHour = CALENDAR_START_HOUR,
  endHour = CALENDAR_END_HOUR,
  hourHeight = HOUR_HEIGHT_PX,
): PositionedSchedule[] {
  const targetDateKey = formatDateKey(targetDate);
  const minMinutes = startHour * 60;
  const maxMinutes = endHour * 60;

  // Lọc buổi học bắt đầu hoặc kết thúc trong ngày này
  const daySchedules = schedules.filter((s) => {
    const sStartKey = formatDateKey(new Date(s.startAt));
    return sStartKey === targetDateKey;
  });

  if (daySchedules.length === 0) return [];

  const items = daySchedules.map((schedule) => {
    const startMin = getMinutesFromMidnightVN(schedule.startAt);
    let endMin = getMinutesFromMidnightVN(schedule.endAt);

    if (endMin <= startMin) {
      endMin = startMin + 45;
    }

    const clampedStart = Math.max(minMinutes, Math.min(maxMinutes, startMin));
    const clampedEnd = Math.max(clampedStart + 20, Math.min(maxMinutes, endMin));

    return {
      schedule,
      startMin: clampedStart,
      endMin: clampedEnd,
    };
  });

  // Sắp xếp theo startMin tăng dần, rồi thời lượng giảm dần
  items.sort((a, b) => {
    if (a.startMin !== b.startMin) return a.startMin - b.startMin;
    return b.endMin - b.startMin - (a.endMin - a.startMin);
  });

  // Gom nhóm các sự kiện trùng lặp
  const clusters: Array<typeof items> = [];
  let currentCluster: typeof items = [];
  let clusterEnd = -1;

  for (const item of items) {
    if (currentCluster.length === 0) {
      currentCluster.push(item);
      clusterEnd = item.endMin;
    } else {
      if (item.startMin < clusterEnd) {
        currentCluster.push(item);
        clusterEnd = Math.max(clusterEnd, item.endMin);
      } else {
        clusters.push(currentCluster);
        currentCluster = [item];
        clusterEnd = item.endMin;
      }
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  const positionedList: PositionedSchedule[] = [];

  for (const cluster of clusters) {
    const columns: Array<Array<typeof cluster[0]>> = [];

    for (const item of cluster) {
      let placed = false;
      for (let colIdx = 0; colIdx < columns.length; colIdx++) {
        const lastInCol = columns[colIdx][columns[colIdx].length - 1];
        if (item.startMin >= lastInCol.endMin) {
          columns[colIdx].push(item);
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([item]);
      }
    }

    const totalColumns = columns.length;

    for (let colIdx = 0; colIdx < totalColumns; colIdx++) {
      for (const item of columns[colIdx]) {
        const topPx = ((item.startMin - minMinutes) / 60) * hourHeight;
        const durationMin = item.endMin - item.startMin;
        const heightPx = Math.max(28, (durationMin / 60) * hourHeight);

        const widthPercent = 100 / totalColumns;
        const leftPercent = colIdx * widthPercent;

        positionedList.push({
          schedule: item.schedule,
          topPx,
          heightPx,
          leftPercent,
          widthPercent,
          startMinutes: item.startMin,
          endMinutes: item.endMin,
        });
      }
    }
  }

  return positionedList;
}

export const WEEKDAY_NAMES_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export const WEEKDAY_NAMES_FULL = [
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
  'Chủ Nhật',
];
