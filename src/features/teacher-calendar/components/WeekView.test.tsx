import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WeekView } from './WeekView';
import type { CalendarEvent } from '../types/teacher-calendar.types';

describe('WeekView - 24 hours display (00:00 to 24:00)', () => {
  const mockCurrentDate = new Date('2026-10-27T10:00:00+07:00'); // Tuesday
  const onSelectEvent = vi.fn();
  const onCreateEventOnDateTime = vi.fn();

  it('renders all 24 hour labels from 00:00 to 23:00 on the left axis', () => {
    render(
      <WeekView
        currentDate={mockCurrentDate}
        events={[]}
        onSelectEvent={onSelectEvent}
        onCreateEventOnDateTime={onCreateEventOnDateTime}
      />,
    );

    // Verify all 24 hours are present
    for (let h = 0; h < 24; h++) {
      const label = `${h.toString().padStart(2, '0')}:00`;
      expect(screen.getAllByText(label).length).toBeGreaterThanOrEqual(1);
    }
  });

  it('renders 7 weekday headers with correct dates', () => {
    render(
      <WeekView
        currentDate={mockCurrentDate}
        events={[]}
        onSelectEvent={onSelectEvent}
        onCreateEventOnDateTime={onCreateEventOnDateTime}
      />,
    );

    expect(screen.getByText('Thứ Hai')).toBeInTheDocument();
    expect(screen.getByText('Thứ Ba')).toBeInTheDocument();
    expect(screen.getByText('Chủ Nhật')).toBeInTheDocument();
  });

  it('triggers onCreateEventOnDateTime when an hour slot is clicked', async () => {
    const user = userEvent.setup();
    render(
      <WeekView
        currentDate={mockCurrentDate}
        events={[]}
        onSelectEvent={onSelectEvent}
        onCreateEventOnDateTime={onCreateEventOnDateTime}
      />,
    );

    // Click slot for 00:00
    const slot0 = screen.getAllByTitle('Bấm để lên lịch vào 0:00')[0];
    await user.click(slot0);
    expect(onCreateEventOnDateTime).toHaveBeenCalledWith(expect.any(Date), 0);

    // Click slot for 23:00
    const slot23 = screen.getAllByTitle('Bấm để lên lịch vào 23:00')[0];
    await user.click(slot23);
    expect(onCreateEventOnDateTime).toHaveBeenCalledWith(expect.any(Date), 23);
  });

  it('renders early morning, afternoon and late evening events at correct positions', async () => {
    const user = userEvent.setup();
    const events: CalendarEvent[] = [
      {
        id: 'ev-early',
        title: 'Ca sáng sớm 00:00',
        startAt: '2026-10-27T00:00:00+07:00',
        endAt: '2026-10-27T01:30:00+07:00',
      },
      {
        id: 'ev-noon',
        title: 'Ca chiều 14:00',
        startAt: '2026-10-27T14:00:00+07:00',
        endAt: '2026-10-27T16:00:00+07:00',
      },
      {
        id: 'ev-night',
        title: 'Ca đêm 22:00',
        startAt: '2026-10-27T22:00:00+07:00',
        endAt: '2026-10-28T00:00:00+07:00',
      },
    ];

    render(
      <WeekView
        currentDate={mockCurrentDate}
        events={events}
        onSelectEvent={onSelectEvent}
        onCreateEventOnDateTime={onCreateEventOnDateTime}
      />,
    );

    expect(screen.getByText('Ca sáng sớm 00:00')).toBeInTheDocument();
    expect(screen.getByText('Ca chiều 14:00')).toBeInTheDocument();
    expect(screen.getByText('Ca đêm 22:00')).toBeInTheDocument();

    await user.click(screen.getByText('Ca sáng sớm 00:00'));
    expect(onSelectEvent).toHaveBeenCalledWith(events[0]);
  });
});
