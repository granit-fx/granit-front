import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotificationBell } from '../components/notification-bell';

import { renderNotifications } from './test-utils';

import type { NotificationSeverity } from '@granit/notifications';
import type * as ReactNotifications from '@granit/react-notifications';

const mockMarkRead = vi.fn();
const mockMarkAllRead = vi.fn();
const mockRefreshCount = vi.fn();
const mockNotifications = vi.fn<
  () => {
    id: string;
    data: unknown;
    severity: NotificationSeverity;
    state: 'Unread' | 'Read';
    createdAt: string;
  }[]
>();
const mockCount = vi.fn<() => number>();
const mockLoading = vi.fn<() => boolean>();

const mockRefreshList = vi.fn();

vi.mock('@granit/react-notifications', async (importActual) => ({
  // Keep the real rendering exports (registry/resolve) — only stub the hooks.
  ...(await importActual<typeof ReactNotifications>()),
  useNotifications: () => ({
    notifications: mockNotifications(),
    loading: mockLoading(),
    markRead: mockMarkRead,
    markAllRead: mockMarkAllRead,
    refresh: mockRefreshList,
  }),
  useUnreadCount: () => ({
    count: mockCount(),
    refresh: mockRefreshCount,
  }),
}));

function renderBell() {
  return renderNotifications(<NotificationBell />);
}

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNotifications.mockReturnValue([]);
    mockCount.mockReturnValue(0);
    mockLoading.mockReturnValue(false);
  });

  it('should render the bell button', () => {
    renderBell();
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
  });

  it('should not show badge when count is 0', () => {
    renderBell();
    expect(screen.queryByLabelText(/unread/)).not.toBeInTheDocument();
  });

  it('should show badge with count', () => {
    mockCount.mockReturnValue(5);
    renderBell();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should show 99+ when count exceeds 99', () => {
    mockCount.mockReturnValue(150);
    renderBell();
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('should refresh the notification list when the popover opens', async () => {
    const { user } = renderBell();

    await user.click(screen.getByRole('button', { name: 'Notifications' }));

    expect(mockRefreshList).toHaveBeenCalledTimes(1);
  });

  it('should show loading state in popover', async () => {
    mockLoading.mockReturnValue(true);
    const { user } = renderBell();

    await user.click(screen.getByRole('button', { name: 'Notifications' }));

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should show empty state in popover', async () => {
    const { user } = renderBell();

    await user.click(screen.getByRole('button', { name: 'Notifications' }));

    expect(screen.getByText('No notifications')).toBeInTheDocument();
  });

  it('should render notification list in popover', async () => {
    mockCount.mockReturnValue(1);
    mockNotifications.mockReturnValue([
      {
        id: '1',
        data: { title: 'Test notification', body: 'Test body' },
        severity: 'Info',
        state: 'Unread',
        createdAt: new Date().toISOString(),
      },
    ]);

    const { user } = renderBell();
    await user.click(screen.getByRole('button', { name: 'Notifications' }));

    expect(screen.getByText('Test notification')).toBeInTheDocument();
    expect(screen.getByText('Test body')).toBeInTheDocument();
  });

  it('should call markRead when clicking an unread notification', async () => {
    mockCount.mockReturnValue(1);
    mockMarkRead.mockResolvedValue(undefined);
    mockNotifications.mockReturnValue([
      {
        id: 'n1',
        data: { title: 'Unread notification' },
        severity: 'Warning',
        state: 'Unread',
        createdAt: new Date().toISOString(),
      },
    ]);

    const { user } = renderBell();
    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    await user.click(screen.getByText('Unread notification'));

    await waitFor(() => {
      expect(mockMarkRead).toHaveBeenCalledWith('n1');
      expect(mockRefreshCount).toHaveBeenCalled();
    });
  });

  it('should not call markRead when clicking a read notification', async () => {
    mockCount.mockReturnValue(0);
    mockNotifications.mockReturnValue([
      {
        id: 'n2',
        data: { title: 'Read notification' },
        severity: 'Info',
        state: 'Read',
        createdAt: new Date().toISOString(),
      },
    ]);

    const { user } = renderBell();
    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    await user.click(screen.getByText('Read notification'));

    expect(mockMarkRead).not.toHaveBeenCalled();
  });

  it('should call markAllRead when clicking mark all read button', async () => {
    mockCount.mockReturnValue(3);
    mockMarkAllRead.mockResolvedValue(undefined);
    mockNotifications.mockReturnValue([]);

    const { user } = renderBell();
    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    await user.click(screen.getByText('Mark all as read'));

    await waitFor(() => {
      expect(mockMarkAllRead).toHaveBeenCalled();
      expect(mockRefreshCount).toHaveBeenCalled();
    });
  });

  it('should render view all link in popover', async () => {
    const { user } = renderBell();
    await user.click(screen.getByRole('button', { name: 'Notifications' }));

    expect(screen.getByText('View all notifications')).toBeInTheDocument();
  });
});
