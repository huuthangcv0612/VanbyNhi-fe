
export interface CalendarLabel {
  id: string;
  name: string;
  color: string; // Mã màu HEX (ví dụ: #4F46E5)
  description?: string | null;
  eventCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLabelPayload {
  name: string;
  color: string;
  description?: string;
}

export interface UpdateLabelPayload {
  name?: string;
  color?: string;
  description?: string;
}

export interface CalendarParticipant {
  id?: string;
  studentId: string;
  student?: {
    id: string;
    fullName: string;
    email?: string | null;
    phone?: string;
    avatarUrl?: string | null;
  } | null;
  createdAt?: string;
}

export interface ConflictingEvent {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startAt: string; // ISO 8601
  endAt: string; // ISO 8601
  address?: string | null;
  location?: string | null;
  meetUrl?: string | null;
  googleMeetUrl?: string | null;
  labelId?: string | null;
  label?: CalendarLabel | null;
  reminderMinutes?: number | null;
  remindBeforeMinutes?: number | null; // Tương thích ngược
  note?: string | null;
  notes?: string | null;
  description?: string | null;
  hasConflict?: boolean;
  conflicts?: ConflictingEvent[];
  participants?: CalendarParticipant[];
  studentCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface QueryCalendarEventsParams {
  from: string; // ISO 8601
  to: string; // ISO 8601
  labelId?: string;
}

export interface CreateEventPayload {
  title: string;
  startAt: string; // ISO 8601
  endAt: string; // ISO 8601
  address?: string;
  meetUrl?: string;
  labelId?: string;
  reminderMinutes?: number;
  note?: string;
  studentIds?: string[];
}

export interface UpdateEventPayload {
  title?: string;
  startAt?: string;
  endAt?: string;
  address?: string;
  meetUrl?: string;
  labelId?: string | null;
  reminderMinutes?: number | null;
  note?: string | null;
}

export interface AddParticipantPayload {
  studentId: string;
}

export type CalendarViewMode = 'month' | 'week';

export interface CalendarDayCell {
  date: Date;
  dateString: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

export interface StudentOption {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  avatarUrl?: string | null;
}
