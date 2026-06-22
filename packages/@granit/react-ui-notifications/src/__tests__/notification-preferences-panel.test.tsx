import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NotificationPreferencesPanel } from '../components/notification-preferences-panel';

import { renderNotifications } from './test-utils';

const { mockUseNotificationPreferences, mockUseNotificationTypes, mockUseNotificationConfig } =
  vi.hoisted(() => ({
    mockUseNotificationPreferences: vi.fn(),
    mockUseNotificationTypes: vi.fn(),
    mockUseNotificationConfig: vi.fn(),
  }));

vi.mock('@granit/react-notifications', () => ({
  useNotificationPreferences: mockUseNotificationPreferences,
  useNotificationTypes: mockUseNotificationTypes,
  useNotificationConfig: mockUseNotificationConfig,
}));

vi.mock('@granit/notifications', () => ({
  updatePreference: vi.fn(),
}));

const mockDefinitions = [
  {
    name: 'security.login',
    displayName: 'Login alerts',
    description: null,
    defaultSeverity: 'Info',
    defaultChannels: ['InApp', 'Email'],
    groupName: null,
    allowUserOptOut: true,
  },
  {
    name: 'system.update',
    displayName: null,
    description: null,
    defaultSeverity: 'Info',
    defaultChannels: ['InApp'],
    groupName: null,
    allowUserOptOut: true,
  },
  {
    name: 'security.breach',
    displayName: null,
    description: null,
    defaultSeverity: 'Critical',
    defaultChannels: ['InApp', 'Email', 'Push'],
    groupName: null,
    allowUserOptOut: false,
  },
];

const mockPreferences = [
  {
    id: 'pref-1',
    userId: 'u1',
    notificationTypeName: 'security.login',
    channelName: 'InApp',
    isEnabled: true,
  },
];

beforeEach(() => {
  mockUseNotificationConfig.mockReturnValue({
    config: { apiClient: {}, basePath: '/api/v1' },
  });
  mockUseNotificationTypes.mockReturnValue({ data: mockDefinitions, isLoading: false });
  mockUseNotificationPreferences.mockReturnValue({
    preferences: mockPreferences,
    loading: false,
    saving: false,
    togglePreference: vi.fn(),
    refresh: vi.fn(),
  });
});

describe('NotificationPreferencesPanel', () => {
  afterEach(() => vi.clearAllMocks());

  it('should display a spinner while loading types', () => {
    mockUseNotificationTypes.mockReturnValue({ data: [], isLoading: true });
    renderNotifications(<NotificationPreferencesPanel />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should display a spinner while loading preferences', () => {
    mockUseNotificationPreferences.mockReturnValue({
      preferences: [],
      loading: true,
      saving: false,
      togglePreference: vi.fn(),
      refresh: vi.fn(),
    });
    renderNotifications(<NotificationPreferencesPanel />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render the preferences table with channel headers', () => {
    renderNotifications(<NotificationPreferencesPanel />);
    expect(screen.getByText('Type')).toBeInTheDocument();
  });

  it('should render one row per opt-outable notification type', () => {
    renderNotifications(<NotificationPreferencesPanel />);
    expect(screen.getByText('Login alerts')).toBeInTheDocument();
    expect(screen.getByText('system.update')).toBeInTheDocument();
  });

  it('should hide notification types that disallow user opt-out', () => {
    renderNotifications(<NotificationPreferencesPanel />);
    expect(screen.queryByText('security.breach')).not.toBeInTheDocument();
  });

  it('should render a checkbox for each type/channel combination', () => {
    renderNotifications(<NotificationPreferencesPanel />);
    // 2 opt-outable types x 3 channels = 6 checkboxes
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(6);
  });

  it('should render the panel title and description', () => {
    renderNotifications(<NotificationPreferencesPanel />);
    expect(screen.getByText('Preferences')).toBeInTheDocument();
    expect(screen.getByText('Choose how you want to be notified')).toBeInTheDocument();
  });

  it('should show the empty-state message when no types are opt-outable', () => {
    mockUseNotificationTypes.mockReturnValue({
      data: mockDefinitions.filter((d) => !d.allowUserOptOut),
      isLoading: false,
    });
    renderNotifications(<NotificationPreferencesPanel />);
    expect(screen.getByText('No notification types are available.')).toBeInTheDocument();
  });
});
