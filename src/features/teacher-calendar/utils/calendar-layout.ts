import type { CalendarEvent } from '../types/teacher-calendar.types';
import { formatDateKey, VN_TIMEZONE } from './date-utils';

export interface PositionedWeekEvent {
  event: CalendarEvent;
  topPx: number;
  heightPx: number;
  leftPercent: number;
  widthPercent: number;
  startMinutes: number;
  endMinutes: number;
}

export const CALENDAR_START_HOUR = 0; // 00:00
export const CALENDAR_END_HOUR = 24; // 24:00 (00:00 ngày tiếp theo)
export const HOUR_HEIGHT_PX = 64; // Chiều cao mỗi giờ

/**
 * Tính số phút tính từ 00:00 theo múi giờ Việt Nam
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
 * Phân bổ cột và toạ độ hiển thị cho các sự kiện trong một ngày
 */
export function layoutDayEvents(
  events: CalendarEvent[],
  targetDate: Date,
  startHour = CALENDAR_START_HOUR,
  endHour = CALENDAR_END_HOUR,
  hourHeight = HOUR_HEIGHT_PX,
): PositionedWeekEvent[] {
  const targetDateKey = formatDateKey(targetDate);
  const minMinutes = startHour * 60;
  const maxMinutes = endHour * 60;

  // Lọc sự kiện diễn ra trong ngày này
  const dayEvents = events.filter((ev) => {
    const evStartKey = formatDateKey(new Date(ev.startAt));
    return evStartKey === targetDateKey;
  });

  if (dayEvents.length === 0) return [];

  // Chuẩn hoá thời gian bắt đầu và kết thúc
  const items = dayEvents.map((event) => {
    const startMin = getMinutesFromMidnightVN(event.startAt);
    let endMin = getMinutesFromMidnightVN(event.endAt);

    const startDateKey = formatDateKey(new Date(event.startAt));
    const endDateKey = formatDateKey(new Date(event.endAt));

    // Xử lý ca dạy kéo dài qua nửa đêm sang ngày hôm sau hoặc kết thúc vào 00:00 hôm sau
    if (endDateKey !== startDateKey) {
      endMin = maxMinutes;
    } else if (endMin <= startMin) {
      endMin = Math.min(maxMinutes, startMin + 45); // Mặc định 45 phút nếu end <= start
    }

    // Giới hạn trong khung giờ hiển thị
    const clampedStart = Math.max(minMinutes, Math.min(maxMinutes, startMin));
    const clampedEnd = Math.max(clampedStart + 20, Math.min(maxMinutes, endMin));

    return {
      event,
      startMin: clampedStart,
      endMin: clampedEnd,
    };
  });

  // Sắp xếp theo startMin tăng dần, rồi đến thời lượng dài hơn xếp trước
  items.sort((a, b) => {
    if (a.startMin !== b.startMin) return a.startMin - b.startMin;
    return b.endMin - b.startMin - (a.endMin - a.startMin);
  });

  // Gom nhóm các sự kiện trùng lặp (clusters)
  const clusters: Array<typeof items> = [];
  let currentCluster: typeof items = [];
  let clusterEnd = -1;

  for (const item of items) {
    if (currentCluster.length === 0) {
      currentCluster.push(item);
      clusterEnd = item.endMin;
    } else {
      // Nếu sự kiện này bắt đầu trước khi cluster hiện tại kết thúc => trùng
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

  // Phân cột cho từng cluster
  const positionedEvents: PositionedWeekEvent[] = [];

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
        const heightPx = Math.max(26, (durationMin / 60) * hourHeight);

        const widthPercent = 100 / totalColumns;
        const leftPercent = colIdx * widthPercent;

        positionedEvents.push({
          event: item.event,
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

  return positionedEvents;
}
