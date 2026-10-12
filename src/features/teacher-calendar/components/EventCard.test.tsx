import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventCard } from './EventCard';
import type { CalendarEvent } from '../types/teacher-calendar.types';

describe('EventCard', () => {
  const sampleEvent: CalendarEvent = {
    id: 'ev-1',
    title: 'Phân tích thơ Sóng - Xuân Quỳnh',
    startAt: '2026-10-12T08:30:00+07:00',
    endAt: '2026-10-12T10:30:00+07:00',
    meetUrl: 'https://meet.google.com/abc-xyz',
    label: {
      id: 'lbl-1',
      name: 'Lớp 12A',
      color: '#4F46E5',
    },
  };

  it('renders title and start time in month variant', () => {
    render(<EventCard event={sampleEvent} variant="month" />);

    expect(screen.getByText('08:30')).toBeInTheDocument();
    expect(screen.getByText('Phân tích thơ Sóng - Xuân Quỳnh')).toBeInTheDocument();
  });

  it('calls onClick callback when card is clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<EventCard event={sampleEvent} variant="month" onClick={handleClick} />);

    await user.click(screen.getByText('Phân tích thơ Sóng - Xuân Quỳnh'));
    expect(handleClick).toHaveBeenCalledWith(sampleEvent);
  });

  it('renders time interval in week variant', () => {
    render(<EventCard event={sampleEvent} variant="week" />);

    expect(screen.getByText(/08:30 – 10:30/)).toBeInTheDocument();
    expect(screen.getByText('Lớp 12A')).toBeInTheDocument();
  });

  it('renders neutral style when event has no label', () => {
    const eventWithoutLabel: CalendarEvent = {
      ...sampleEvent,
      label: null,
      labelId: null,
    };

    const { container } = render(<EventCard event={eventWithoutLabel} variant="month" />);
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
  });
});
