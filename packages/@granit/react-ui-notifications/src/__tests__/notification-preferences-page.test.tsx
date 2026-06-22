import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NotificationPreferencesPage } from '../notification-preferences-page';

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
    allowDoNotDisturbBypass: false,
    requiredPermission: null,
    requiredFeature: null,
  },
];

beforeEach(() => {
  mockUseNotificationConfig.mockReturnValue({
    config: { apiClient: {}, basePath: '/api/v1' },
  });
  mockUseNotificationTypes.mockReturnValue({ data: mockDefinitions, isLoading: false });
  mockUseNotificationPreferences.mockReturnValue({
    preferences: [],
    loading: false,
    saving: false,
    togglePreference: vi.fn(),
    refresh: vi.fn(),
  });
});

describe('NotificationPreferencesPage', () => {
  afterEach(() => vi.clearAllMocks());

  it('should render the page title and subtitle', () => {
    renderNotifications(<NotificationPreferencesPage />);
    const heading = screen.getByRole('heading', { level: 2, name: 'Preferences' });
    expect(heading).toBeInTheDocument();
    expect(screen.getByText('Manage notification preferences')).toBeInTheDocument();
  });

  it('should expose the page data-slot', () => {
    renderNotifications(<NotificationPreferencesPage />);
    expect(
      document.querySelector('[data-slot="notification-preferences-page"]')
    ).toBeInTheDocument();
  });

  it('should render the preferences panel', () => {
    renderNotifications(<NotificationPreferencesPage />);
    expect(document.querySelector('[data-slot="notification-preferences"]')).toBeInTheDocument();
    expect(screen.getByText('Login alerts')).toBeInTheDocument();
  });

  it('should show a spinner while the panel loads', () => {
    mockUseNotificationTypes.mockReturnValue({ data: [], isLoading: true });
    renderNotifications(<NotificationPreferencesPage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
