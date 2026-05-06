import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ActivityDetailPanel } from '../components/activity-detail-panel.js';
import { ActivitiesProvider } from '../providers/activities-provider.js';

import type { ActivityResponse } from '@granit/activities';
import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

const open: ActivityResponse = {
  id: 'a1',
  entityType: 'Quote',
  entityId: 'q1',
  type: 'FollowUp',
  assignedToUserId: 'u1',
  createdByUserId: 'u2',
  dueAt: '2026-05-10T10:00:00Z',
  description: 'Call back the client',
  status: 'Open',
  completedAt: null,
  completedByUserId: null,
  createdAt: '2026-05-01T08:00:00Z',
};

const completed: ActivityResponse = {
  ...open,
  id: 'a2',
  status: 'Completed',
  completedAt: '2026-05-09T15:00:00Z',
  completedByUserId: 'u1',
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

describe('<ActivityDetailPanel>', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when activityId is empty', () => {
    const client = createMockClient();
    const { container } = render(<ActivityDetailPanel activityId="" />, {
      wrapper: createWrapper(client),
    });

    expect(container.firstChild).toBeNull();
    expect(client.get).not.toHaveBeenCalled();
  });

  it('renders all fields once the activity loads', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: open });

    render(<ActivityDetailPanel activityId="a1" />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('FollowUp')).toBeDefined());
    expect(screen.getByText('Quote · q1')).toBeDefined();
    expect(screen.getByText('Call back the client')).toBeDefined();
    expect(screen.getByText('Open')).toBeDefined();
  });

  it('renders Completed metadata when the activity is closed', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: completed });

    render(<ActivityDetailPanel activityId="a2" />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getAllByText('Completed').length).toBeGreaterThan(0));
    expect(screen.getByText('2026-05-09T15:00:00Z · u1')).toBeDefined();
  });

  it('hides Complete + Cancel on non-Open activities, even if callbacks are provided', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: completed });

    render(
      <ActivityDetailPanel
        activityId="a2"
        onComplete={vi.fn()}
        onCancel={vi.fn()}
        onReassign={vi.fn()}
      />,
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(screen.getAllByText('Completed').length).toBeGreaterThan(0));
    expect(screen.queryByRole('button', { name: 'Complete' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
    // Reassign stays available regardless of status
    expect(screen.getByRole('button', { name: 'Reassign' })).toBeDefined();
  });

  it('fires action callbacks with the loaded activity', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: open });
    const onComplete = vi.fn();

    render(<ActivityDetailPanel activityId="a1" onComplete={onComplete} />, {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Complete' })).toBeDefined());
    fireEvent.click(screen.getByRole('button', { name: 'Complete' }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(open);
  });

  it('renders an error state with role=alert on a failed fetch', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('boom'));

    const { container } = render(<ActivityDetailPanel activityId="a1" />, {
      wrapper: createWrapper(client),
    });

    await waitFor(() =>
      expect(container.querySelector('[data-granit-activity-detail-error]')).not.toBeNull()
    );
    expect(screen.getByRole('alert')).toBeDefined();
  });

  it('honors actionLabels overrides', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: open });

    render(
      <ActivityDetailPanel
        activityId="a1"
        onComplete={vi.fn()}
        actionLabels={{ complete: 'Mark done' }}
      />,
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(screen.getByRole('button', { name: 'Mark done' })).toBeDefined());
  });
});
