import {
  VN_TIMEZONE,
  formatDateKey,
  formatFullDateVN,
  formatTimeVN,
  toVietnamIsoString,
} from './date-utils';

export interface DateTimeParts {
  year: number;
  month: number; // 1 - 12
  day: number; // 1 - 31
  hour: number; // 0 - 23
  minute: number; // 0 - 59
  second: number; // 0 - 59
  millisecond: number; // 0 - 999
}

export interface ScheduleOccurrencePreview {
  index: number; // 0-based
  occurrenceNumber: number; // 1-based (Buổi 1, 2, ...)
  startAt: Date;
  endAt: Date;
  dateKey: string; // YYYY-MM-DD
  dateFormatted: string; // "Thứ Ba, 27/10/2026"
  timeRange: string; // "15:00 – 16:30"
  startIso: string;
  endIso: string;
}

/**
 * Kiểm tra xem một năm có phải là năm nhuận theo lịch Gregory hay không.
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Lấy số ngày tối đa trong một tháng cụ thể của một năm cụ thể.
 * @param year Năm (ví dụ: 2026)
 * @param month Tháng (1 đến 12)
 */
export function getDaysInMonth(year: number, month: number): number {
  if (month < 1 || month > 12) {
    throw new Error(`Tháng không hợp lệ: ${month}`);
  }

  switch (month) {
    case 1:
    case 3:
    case 5:
    case 7:
    case 8:
    case 10:
    case 12:
      return 31;
    case 4:
    case 6:
    case 9:
    case 11:
      return 30;
    case 2:
      return isLeapYear(year) ? 29 : 28;
    default:
      return 30;
  }
}

/**
 * Trích xuất các thành phần ngày/tháng/năm/giờ/phút/giây/mili-giây theo múi giờ IANA.
 */
export function getDateTimeParts(
  date: Date,
  timeZone: string = VN_TIMEZONE,
): DateTimeParts {
  if (isNaN(date.getTime())) {
    throw new Error('Thời gian không hợp lệ');
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    fractionalSecondDigits: 3,
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(date);
  const map: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      map[part.type] = parseInt(part.value, 10);
    }
  }

  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: map.hour === 24 ? 0 : (map.hour ?? 0),
    minute: map.minute ?? 0,
    second: map.second ?? 0,
    millisecond: map.fractionalSecond ?? date.getMilliseconds(),
  };
}

/**
 * Tạo một Date object từ các thành phần ngày giờ trong một múi giờ IANA cụ thể.
 */
export function createDateFromParts(
  parts: DateTimeParts,
  timeZone: string = VN_TIMEZONE,
): Date {
  const utcGuess = new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
      parts.millisecond,
    ),
  );

  const formatted = getDateTimeParts(utcGuess, timeZone);
  const formattedAsUtc = new Date(
    Date.UTC(
      formatted.year,
      formatted.month - 1,
      formatted.day,
      formatted.hour,
      formatted.minute,
      formatted.second,
      formatted.millisecond,
    ),
  );

  const diff = utcGuess.getTime() - formattedAsUtc.getTime();
  let candidate = new Date(utcGuess.getTime() + diff);

  const verify = getDateTimeParts(candidate, timeZone);
  const verifyAsUtc = new Date(
    Date.UTC(
      verify.year,
      verify.month - 1,
      verify.day,
      verify.hour,
      verify.minute,
      verify.second,
      verify.millisecond,
    ),
  );

  if (verifyAsUtc.getTime() !== utcGuess.getTime()) {
    const diff2 = utcGuess.getTime() - verifyAsUtc.getTime();
    candidate = new Date(candidate.getTime() + diff2);
  }

  return candidate;
}

/**
 * Tính mốc kết thúc bằng cách cộng 1 tháng lịch vào ngày bắt đầu.
 * Quy tắc cộng tháng an toàn tương thích 100% với backend:
 * - Nếu tháng 12 thì chuyển sang tháng 1 năm sau.
 * - Giữ ngày trong tháng đích ở mức nhỏ hơn giữa ngày ban đầu và ngày cuối cùng của tháng đích (min(day, maxDaysInTargetMonth)).
 * - Giờ, phút, giây, mili-giây và múi giờ được giữ nguyên vẹn.
 */
export function calculateMonthEndCutoff(
  startAt: Date,
  timeZone: string = VN_TIMEZONE,
): Date {
  const parts = getDateTimeParts(startAt, timeZone);
  const targetYear = parts.month === 12 ? parts.year + 1 : parts.year;
  const targetMonth = parts.month === 12 ? 1 : parts.month + 1;
  const maxDaysInTargetMonth = getDaysInMonth(targetYear, targetMonth);
  const targetDay = Math.min(parts.day, maxDaysInTargetMonth);

  const cutoffParts: DateTimeParts = {
    year: targetYear,
    month: targetMonth,
    day: targetDay,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
    millisecond: parts.millisecond,
  };

  return createDateFromParts(cutoffParts, timeZone);
}

/**
 * Tính toàn bộ danh sách các buổi học lặp lại hàng tuần trong một tháng kể từ ngày bắt đầu.
 * - Bao gồm ngày bắt đầu, loại trừ mốc kết thúc (occurrenceStart < cutoffDate).
 * - Các buổi cách nhau đúng 7 ngày lịch.
 * - Giữ nguyên thứ trong tuần, giờ bắt đầu và giờ kết thúc trong múi giờ đã cho.
 */
export function generateWeeklyMonthlyOccurrences(
  startAt: Date,
  endAt: Date,
  timeZone: string = VN_TIMEZONE,
): ScheduleOccurrencePreview[] {
  if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) {
    throw new Error('Thời gian bắt đầu hoặc kết thúc không hợp lệ');
  }

  if (startAt >= endAt) {
    throw new Error('Thời gian bắt đầu (startAt) phải trước thời gian kết thúc (endAt)');
  }

  const cutoffDate = calculateMonthEndCutoff(startAt, timeZone);
  const startParts = getDateTimeParts(startAt, timeZone);
  const endParts = getDateTimeParts(endAt, timeZone);

  const occurrences: ScheduleOccurrencePreview[] = [];
  let index = 0;

  while (true) {
    const daysToAdd = index * 7;
    const nextStartUtc = new Date(
      Date.UTC(startParts.year, startParts.month - 1, startParts.day + daysToAdd),
    );
    const nextEndUtc = new Date(
      Date.UTC(endParts.year, endParts.month - 1, endParts.day + daysToAdd),
    );

    const occStartParts: DateTimeParts = {
      year: nextStartUtc.getUTCFullYear(),
      month: nextStartUtc.getUTCMonth() + 1,
      day: nextStartUtc.getUTCDate(),
      hour: startParts.hour,
      minute: startParts.minute,
      second: startParts.second,
      millisecond: startParts.millisecond,
    };

    const occEndParts: DateTimeParts = {
      year: nextEndUtc.getUTCFullYear(),
      month: nextEndUtc.getUTCMonth() + 1,
      day: nextEndUtc.getUTCDate(),
      hour: endParts.hour,
      minute: endParts.minute,
      second: endParts.second,
      millisecond: endParts.millisecond,
    };

    const occStart = createDateFromParts(occStartParts, timeZone);
    const occEnd = createDateFromParts(occEndParts, timeZone);

    // Bao gồm ngày bắt đầu, loại trừ mốc kết thúc (strict <)
    if (occStart.getTime() >= cutoffDate.getTime()) {
      break;
    }

    const startTimeFormatted = formatTimeVN(occStart);
    const endTimeFormatted = formatTimeVN(occEnd);

    occurrences.push({
      index,
      occurrenceNumber: index + 1,
      startAt: occStart,
      endAt: occEnd,
      dateKey: formatDateKey(occStart),
      dateFormatted: formatFullDateVN(occStart),
      timeRange: `${startTimeFormatted} – ${endTimeFormatted}`,
      startIso: occStart.toISOString(),
      endIso: occEnd.toISOString(),
    });

    index++;
  }

  return occurrences;
}

/**
 * Helper cho form giao diện: sinh danh sách xem trước từ chuỗi date (YYYY-MM-DD),
 * startTime (HH:mm) và endTime (HH:mm). Trả về mảng rỗng nếu dữ liệu chưa hợp lệ.
 */
export function getWeeklyRecurrencePreview(
  dateStr: string,
  startTimeStr: string,
  endTimeStr: string,
): {
  isValid: boolean;
  errorMessage?: string;
  occurrences: ScheduleOccurrencePreview[];
} {
  const cleanDate = (dateStr || '').trim();
  const cleanStart = (startTimeStr || '').trim();
  const cleanEnd = (endTimeStr || '').trim();

  if (!cleanDate) {
    return { isValid: false, errorMessage: 'Vui lòng chọn ngày học bắt đầu.', occurrences: [] };
  }

  if (!cleanStart) {
    return { isValid: false, errorMessage: 'Vui lòng nhập giờ bắt đầu.', occurrences: [] };
  }

  if (!cleanEnd) {
    return { isValid: false, errorMessage: 'Vui lòng nhập giờ kết thúc.', occurrences: [] };
  }

  if (cleanEnd <= cleanStart) {
    return {
      isValid: false,
      errorMessage: 'Giờ kết thúc phải sau giờ bắt đầu.',
      occurrences: [],
    };
  }

  try {
    const startIso = toVietnamIsoString(cleanDate, cleanStart);
    const endIso = toVietnamIsoString(cleanDate, cleanEnd);
    const startDate = new Date(startIso);
    const endDate = new Date(endIso);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return { isValid: false, errorMessage: 'Thời gian không hợp lệ.', occurrences: [] };
    }

    const occurrences = generateWeeklyMonthlyOccurrences(startDate, endDate);
    return {
      isValid: true,
      occurrences,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Không thể tính toán chuỗi lịch';
    return { isValid: false, errorMessage: msg, occurrences: [] };
  }
}
