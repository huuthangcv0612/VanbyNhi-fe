/**
/**
 * Tiện ích xử lý ngày giờ và múi giờ Asia/Ho_Chi_Minh (+07:00)
 */

export const VN_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Lấy chuỗi định dạng YYYY-MM-DD theo giờ Việt Nam
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
 * Kiểm tra 2 ngày có cùng ngày/tháng/năm hay không (theo VN_TIMEZONE)
 */
export function isSameDayVN(d1: Date, d2: Date): boolean {
  return formatDateKey(d1) === formatDateKey(d2);
}

/**
 * Kiểm tra một ngày có phải là Hôm nay hay không (theo VN_TIMEZONE)
 */
export function isTodayVN(date: Date): boolean {
  return isSameDayVN(date, new Date());
}

/**
 * Lấy ngày đầu tuần (Thứ Hai) lúc 00:00:00
 */
export function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday...
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
 * Sinh lưới tháng 7 cột (bắt đầu từ Thứ Hai) bao gồm ngày đệm của tháng trước và tháng sau
 */
export function getMonthGrid(year: number, month: number): Date[] {
  // Ngày 1 của tháng
  const firstOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
  // Ngày cuối của tháng
  const lastOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

  // Thứ Hai của tuần chứa ngày 1
  const gridStart = getStartOfWeek(firstOfMonth);
  // Chủ Nhật của tuần chứa ngày cuối tháng
  const gridEnd = getEndOfWeek(lastOfMonth);

  const days: Date[] = [];
  const current = new Date(gridStart);
  while (current <= gridEnd) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  // Đảm bảo tối thiểu đủ 35 hoặc 42 ô để lưới đều đẹp
  while (days.length % 7 !== 0 || days.length < 35) {
    const nextDay = new Date(days[days.length - 1]);
    nextDay.setDate(nextDay.getDate() + 1);
    days.push(nextDay);
  }

  return days;
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
 * Định dạng ngày thứ: Thứ Hai, 12/10/2026
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
 * Khoảng ngày trong tuần: 12 thg 10 – 18 thg 10, 2026
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
 * Chuyển ngày (YYYY-MM-DD) và giờ (HH:mm) sang chuỗi ISO 8601 có múi giờ Việt Nam (+07:00)
 */
export function toVietnamIsoString(dateStr: string, timeStr: string): string {
  const cleanDate = dateStr.trim();
  const cleanTime = timeStr.trim();
  const timeWithSec = cleanTime.length === 5 ? `${cleanTime}:00` : cleanTime;
  return `${cleanDate}T${timeWithSec}+07:00`;
}

/**
 * Tách chuỗi ISO 8601 thành { date: YYYY-MM-DD, time: HH:mm } theo giờ Việt Nam
 */
export function parseIsoToVnParts(isoString: string): { date: string; time: string } {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) {
    return { date: '', time: '' };
  }

  const date = formatDateKey(d);
  const time = formatTimeVN(d);
  return { date, time };
}

/**
 * Kiểm tra mã màu HEX hợp lệ (#RGB hoặc #RRGGBB)
 */
export function isValidHexColor(hex: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex.trim());
}

/**
 * Tên thứ viết tắt tiếng Việt
 */
export const WEEKDAY_NAMES_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/**
 * Tên thứ đầy đủ tiếng Việt bắt đầu từ Thứ Hai
 */
export const WEEKDAY_NAMES_FULL = [
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
  'Chủ Nhật',
];
