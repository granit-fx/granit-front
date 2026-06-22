import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotificationToastHandler } from '../components/notification-toast-handler';

import { renderNotifications } from './test-utils';

import type { NotificationSeverity } from '@granit/notifications';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  }),
}));

const mockLastMessage =
  vi.fn<() => { id: string; data: unknown; severity: NotificationSeverity } | null>();

vi.mock('@granit/react-notifications', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useRealTimeNotifications: () => ({
      lastMessage: mockLastMessage(),
    }),
    // The handler routes the transport message through the view registry; in the
    // unit test we resolve straight from the message payload so the toast
    // assertions stay focused on the handler's severity/title/body mapping.
    resolveNotificationPresentation: (
      message: {
        data?: { title?: string; body?: string };
        severity?: NotificationSeverity;
      } | null
    ) => ({
      title: message?.data?.title,
      body: message?.data?.body,
      severity: message?.severity,
    }),
  };
});

describe('NotificationToastHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLastMessage.mockReturnValue(null);
  });

  it('should render nothing', () => {
    const { container } = renderNotifications(<NotificationToastHandler />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should not show toast when no notification', () => {
    renderNotifications(<NotificationToastHandler />);
    expect(toast.info).not.toHaveBeenCalled();
  });

  it('should show info toast for Info severity', () => {
    mockLastMessage.mockReturnValue({
      id: '1',
      data: { title: 'Info title', body: 'Info body' },
      severity: 'Info',
    });

    renderNotifications(<NotificationToastHandler />);

    expect(toast.info).toHaveBeenCalledWith('Info title', {
      description: 'Info body',
    });
  });

  it('should show success toast for Success severity', () => {
    mockLastMessage.mockReturnValue({
      id: '2',
      data: { title: 'Success title' },
      severity: 'Success',
    });

    renderNotifications(<NotificationToastHandler />);

    expect(toast.success).toHaveBeenCalledWith('Success title', {
      description: undefined,
    });
  });

  it('should show error toast for Error severity', () => {
    mockLastMessage.mockReturnValue({
      id: '3',
      data: { title: 'Error title', body: 'Error details' },
      severity: 'Error',
    });

    renderNotifications(<NotificationToastHandler />);

    expect(toast.error).toHaveBeenCalledWith('Error title', {
      description: 'Error details',
    });
  });

  it('should show warning toast for Warning severity', () => {
    mockLastMessage.mockReturnValue({
      id: '4',
      data: { title: 'Warning title' },
      severity: 'Warning',
    });

    renderNotifications(<NotificationToastHandler />);

    expect(toast.warning).toHaveBeenCalledWith('Warning title', {
      description: undefined,
    });
  });
});
