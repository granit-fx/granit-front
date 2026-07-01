import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotificationListPage } from '../components/notification-list-page';

import { renderNotifications } from './test-utils';

import type * as ReactNotifications from '@granit/react-notifications';

const mockNotifications = vi.fn<
  () => {
    id: string;
    data: unknown;
    severity: string;
    state: 'Unread' | 'Read';
    createdAt: string;
  }[]
>();

vi.mock('@granit/react-notifications', async (importActual) => ({
  // Keep the real rendering exports (registry/resolve) — only stub the hooks.
  ...(await importActual<typeof ReactNotifications>()),
  useNotifications: () => ({
    notifications: mockNotifications(),
    loading: false,
    hasMore: false,
    loadMore: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
    refresh: vi.fn(),
  }),
  useUnreadCount: () => ({ count: 0, refresh: vi.fn() }),
}));

describe('NotificationListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNotifications.mockReturnValue([]);
  });

  it('should render the page title', () => {
    renderNotifications(<NotificationListPage />);

    expect(screen.getByRole('heading', { name: 'Notifications' })).toBeInTheDocument();
  });

  it('should expose the page data-slot', () => {
    renderNotifications(<NotificationListPage />);

    expect(document.querySelector('[data-slot="notification-list-page"]')).toBeInTheDocument();
  });

  it('should render the notification inbox with loaded data', () => {
    mockNotifications.mockReturnValue([
      {
        id: '1',
        data: { title: 'New user registered' },
        severity: 'Info',
        state: 'Unread',
        createdAt: new Date().toISOString(),
      },
    ]);

    renderNotifications(<NotificationListPage />);

    expect(screen.getByText('New user registered')).toBeInTheDocument();
  });
});
