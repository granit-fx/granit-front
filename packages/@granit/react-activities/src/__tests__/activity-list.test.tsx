import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ActivityList } from '../components/activity-list';
import { ActivitiesProvider } from '../providers/activities-provider';

import type { ActivityListResponse, ActivityResponse } from '@granit/activities';
import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

const open: ActivityResponse = {
  id: 'a1',
  entityType: 'Quote',
  entityId: 'q1',
  type: 'FollowUp',
  assignedToUserId: 'u1',
  createdByUserId: 'u2',
  dueAt: toISODateString('2026-05-10T10:00:00Z'),
  description: null,
  status: 'Open',
  completedAt: null,
  completedByUserId: null,
  createdAt: toISODateString('2026-05-01T08:00:00Z'),
};

const completed: ActivityResponse = { ...open, id: 'a2', status: 'Done' };

const sampleResponse: ActivityListResponse = {
  items: [open, completed],
  totalCount: 42,
  page: 1,
  pageSize: 20,
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

describe('<ActivityList>', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders rows once data is loaded', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleResponse });

    render(<ActivityList />, { wrapper: createWrapper(client) });

    await waitFor(() => {
      expect(screen.getAllByRole('row')).toHaveLength(3); // header + 2 rows
    });
    expect(screen.getAllByText('FollowUp')).toHaveLength(2);
  });

  it('forwards filter + pagination to useActivities', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleResponse });

    render(<ActivityList filter={{ status: 'OpenOrOverdue' }} pageSize={50} />, {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(client.get).toHaveBeenCalled());
    expect(client.get).toHaveBeenCalledWith('/api/v1/activities', {
      params: { status: 'OpenOrOverdue', page: 1, pageSize: 50 },
    });
  });

  it('shows Complete + Cancel only on Open rows when callbacks are provided', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleResponse });
    const onComplete = vi.fn();
    const onCancel = vi.fn();

    render(<ActivityList onComplete={onComplete} onCancel={onCancel} />, {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(3));

    // Only one Open row → exactly one "Complete" and one "Cancel" button
    expect(screen.getAllByRole('button', { name: 'Complete' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Cancel' })).toHaveLength(1);
  });

  it('hides actions column when no action callback is provided', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleResponse });

    render(<ActivityList />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(3));
    expect(screen.queryByText('Actions')).toBeNull();
  });

  it('fires onComplete with the row activity and stops propagation to onSelect', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleResponse });
    const onComplete = vi.fn();
    const onSelect = vi.fn();

    render(<ActivityList onComplete={onComplete} onSelect={onSelect} />, {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(3));
    fireEvent.click(screen.getByRole('button', { name: 'Complete' }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(open);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('renders a loading state, then an empty state, then an error state', async () => {
    // Empty
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({
      data: { items: [], totalCount: 0, page: 1, pageSize: 20 } as ActivityListResponse,
    });

    const { rerender, container } = render(<ActivityList />, {
      wrapper: createWrapper(client),
    });

    expect(container.querySelector('[data-granit-activity-list-loading]')).not.toBeNull();
    await waitFor(() =>
      expect(container.querySelector('[data-granit-activity-list-empty]')).not.toBeNull()
    );

    // Error path
    const errClient = createMockClient();
    vi.mocked(errClient.get).mockRejectedValue(new Error('boom'));
    rerender(<ActivityList />);
    // Re-render with the failing client requires a fresh wrapper
    const { container: errContainer } = render(<ActivityList />, {
      wrapper: createWrapper(errClient),
    });
    await waitFor(() =>
      expect(errContainer.querySelector('[data-granit-activity-list-error]')).not.toBeNull()
    );
  });

  it('paginates: clicking Next bumps page on the next request', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleResponse });

    render(<ActivityList />, { wrapper: createWrapper(client) });
    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(3));

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));

    await waitFor(() => {
      expect(client.get).toHaveBeenLastCalledWith('/api/v1/activities', {
        params: { page: 2, pageSize: 20 },
      });
    });
  });
});
