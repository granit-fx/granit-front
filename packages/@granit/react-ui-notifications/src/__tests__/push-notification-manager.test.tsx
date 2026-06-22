import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PushNotificationManager } from '../components/push-notification-manager';

import { renderNotifications } from './test-utils';

const { mockUseWebPush } = vi.hoisted(() => ({
  mockUseWebPush: vi.fn(),
}));

vi.mock('@granit/react-notifications-web-push', () => ({
  WebPushProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useWebPush: mockUseWebPush,
}));

const defaultWebPush = {
  isSupported: true,
  permission: 'default' as NotificationPermission,
  isSubscribed: false,
  loading: false,
  error: null,
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
};

describe('PushNotificationManager', () => {
  afterEach(() => vi.clearAllMocks());

  it('should render nothing when no VAPID key is provided', () => {
    const { container } = renderNotifications(<PushNotificationManager />);
    expect(container.innerHTML).toBe('');
  });

  describe('when a VAPID key is configured', () => {
    it('should render nothing when push is not supported', () => {
      mockUseWebPush.mockReturnValue({ ...defaultWebPush, isSupported: false });
      const { container } = renderNotifications(
        <PushNotificationManager vapidPublicKey="test-vapid-key" />
      );
      expect(container.innerHTML).toBe('');
    });

    it('should render the enable button when not subscribed', () => {
      mockUseWebPush.mockReturnValue(defaultWebPush);
      renderNotifications(<PushNotificationManager vapidPublicKey="test-vapid-key" />);

      expect(screen.getByText('Enable push notifications')).toBeInTheDocument();
    });

    it('should render the disable button when subscribed', () => {
      mockUseWebPush.mockReturnValue({ ...defaultWebPush, isSubscribed: true });
      renderNotifications(<PushNotificationManager vapidPublicKey="test-vapid-key" />);

      expect(screen.getByText('Disable push notifications')).toBeInTheDocument();
    });

    it('should render denied message when permission is denied', () => {
      mockUseWebPush.mockReturnValue({ ...defaultWebPush, permission: 'denied' });
      renderNotifications(<PushNotificationManager vapidPublicKey="test-vapid-key" />);

      expect(screen.getByText(/push notifications denied/i)).toBeInTheDocument();
    });

    it('should disable the button while loading', () => {
      mockUseWebPush.mockReturnValue({ ...defaultWebPush, loading: true });
      renderNotifications(<PushNotificationManager vapidPublicKey="test-vapid-key" />);

      expect(screen.getByRole('button')).toBeDisabled();
    });
  });
});
