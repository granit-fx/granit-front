import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ActivityCalendar } from '../components/activity-calendar';
import { ActivitiesProvider } from '../providers/activities-provider';

import type { ActivityCalendarItemResponse } from '@granit/activities';
import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

const monday: ActivityCalendarItemResponse = {
  id: 'a1',
  start: '2026-05-04T10:00:00Z',
  end: null,
  title: 'Monday item',
  color: 'open',
  type: 'FollowUp',
  status: 'Open',
  entityType: 'Quote',
  entityId: 'q1',
  assignedToUserId: 'u1',
};

const overdueWed: ActivityCalendarItemResponse = {
  id: 'a2',
  start: '2026-05-06T08:00:00Z',
  end: null,
  title: 'Overdue Wed',
  color: 'overdue',
  type: 'FollowUp',
  status: 'Open',
  entityType: 'Quote',
  entityId: 'q2',
  assignedToUserId: 'u1',
};

function createWrapper(client: AxiosInstance) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <ActivitiesProvider config={{ client }}>{children}</ActivitiesProvider>
    );
  };
}

describe('<ActivityCalendar>', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('week view: builds a Mon→Sun window around the anchor', async () => {
    // 2026-05-06 is a Wednesday → week is 2026-05-04 → 2026-05-11 (exclusive)
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [monday, overdueWed] });

    render(
      <ActivityCalendar initialView="week" initialAnchor={new Date('2026-05-06T12:00:00Z')} />,
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(client.get).toHaveBeenCalled());
    expect(client.get).toHaveBeenCalledWith('/api/v1/activities/calendar', {
      params: { from: '2026-05-04T00:00:00.000Z', to: '2026-05-11T00:00:00.000Z' },
    });
  });

  it('day view: 24h window from the anchor day at UTC midnight', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [] });

    render(
      <ActivityCalendar initialView="day" initialAnchor={new Date('2026-05-06T12:00:00Z')} />,
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(client.get).toHaveBeenCalled());
    expect(client.get).toHaveBeenCalledWith('/api/v1/activities/calendar', {
      params: { from: '2026-05-06T00:00:00.000Z', to: '2026-05-07T00:00:00.000Z' },
    });
  });

  it('month view: 1st of month → 1st of next month', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [] });

    render(
      <ActivityCalendar initialView="month" initialAnchor={new Date('2026-05-06T12:00:00Z')} />,
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(client.get).toHaveBeenCalled());
    expect(client.get).toHaveBeenCalledWith('/api/v1/activities/calendar', {
      params: { from: '2026-05-01T00:00:00.000Z', to: '2026-06-01T00:00:00.000Z' },
    });
  });

  it('forwards optional filters as query params', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [] });

    render(
      <ActivityCalendar
        initialView="day"
        initialAnchor={new Date('2026-05-06T12:00:00Z')}
        filter={{ assignee: 'me', status: 'OpenOrOverdue', entityType: 'Quote' }}
      />,
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(client.get).toHaveBeenCalled());
    expect(client.get).toHaveBeenCalledWith('/api/v1/activities/calendar', {
      params: {
        from: '2026-05-06T00:00:00.000Z',
        to: '2026-05-07T00:00:00.000Z',
        assignee: 'me',
        status: 'OpenOrOverdue',
        entityType: 'Quote',
      },
    });
  });

  it('groups items by day; uses server-supplied color verbatim', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [monday, overdueWed] });

    const { container } = render(
      <ActivityCalendar initialView="week" initialAnchor={new Date('2026-05-06T12:00:00Z')} />,
      { wrapper: createWrapper(client) }
    );

    await waitFor(() =>
      expect(
        container.querySelectorAll('[data-granit-activity-calendar-item]').length
      ).toBeGreaterThan(0)
    );

    const items = container.querySelectorAll('[data-granit-activity-calendar-item]');
    expect(items[0]?.getAttribute('data-activity-color')).toBe('open');
    expect(items[1]?.getAttribute('data-activity-color')).toBe('overdue');

    // 7 days seeded even though only 2 carry items
    expect(container.querySelectorAll('[data-granit-activity-calendar-day]').length).toBe(7);
  });

  it('Next button shifts the week forward by 7 days', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [] });

    render(
      <ActivityCalendar initialView="week" initialAnchor={new Date('2026-05-06T12:00:00Z')} />,
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(client.get).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => {
      expect(client.get).toHaveBeenLastCalledWith('/api/v1/activities/calendar', {
        params: { from: '2026-05-11T00:00:00.000Z', to: '2026-05-18T00:00:00.000Z' },
      });
    });
  });

  it('view switcher refetches with the new window', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [] });

    render(
      <ActivityCalendar initialView="week" initialAnchor={new Date('2026-05-06T12:00:00Z')} />,
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(client.get).toHaveBeenCalled());
    const switcher = screen.getByRole('toolbar', { name: 'View' });
    fireEvent.click(within(switcher).getByRole('button', { name: 'Day' }));

    await waitFor(() => {
      expect(client.get).toHaveBeenLastCalledWith('/api/v1/activities/calendar', {
        params: { from: '2026-05-06T00:00:00.000Z', to: '2026-05-07T00:00:00.000Z' },
      });
    });
  });

  it('fires onItemClick with the clicked item', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [monday] });
    const onItemClick = vi.fn();

    render(
      <ActivityCalendar
        initialView="week"
        initialAnchor={new Date('2026-05-06T12:00:00Z')}
        onItemClick={onItemClick}
      />,
      { wrapper: createWrapper(client) }
    );

    const item = await screen.findByRole('button', { name: 'Monday item' });
    fireEvent.click(item);

    expect(onItemClick).toHaveBeenCalledTimes(1);
    expect(onItemClick).toHaveBeenCalledWith(monday);
  });

  it('renders error and empty states', async () => {
    const errClient = createMockClient();
    vi.mocked(errClient.get).mockRejectedValue(new Error('boom'));
    const { container } = render(
      <ActivityCalendar initialView="day" initialAnchor={new Date('2026-05-06T12:00:00Z')} />,
      { wrapper: createWrapper(errClient) }
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-activity-calendar-error]')).not.toBeNull()
    );

    const okClient = createMockClient();
    vi.mocked(okClient.get).mockResolvedValue({ data: [] });
    const { container: emptyContainer } = render(
      <ActivityCalendar initialView="day" initialAnchor={new Date('2026-05-06T12:00:00Z')} />,
      { wrapper: createWrapper(okClient) }
    );
    await waitFor(() =>
      expect(emptyContainer.querySelector('[data-granit-activity-calendar-empty]')).not.toBeNull()
    );
  });
});
