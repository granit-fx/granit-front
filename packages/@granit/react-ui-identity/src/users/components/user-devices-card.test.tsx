import { screen } from '@testing-library/react';

import { renderWithProviders } from '../../__tests__/test-utils';

import { UserDevicesCard } from './user-devices-card';

import type { UserDeviceResponse } from '@granit/identity';

let mockDevicesData: UserDeviceResponse[] | undefined;
let mockIsLoading = false;

vi.mock('@granit/react-identity', () => ({
  useUserDevices: () => ({
    data: mockDevicesData,
    isLoading: mockIsLoading,
  }),
}));

function makeDevice(overrides: Partial<UserDeviceResponse> = {}): UserDeviceResponse {
  return {
    deviceId: 'device-1' as UserDeviceResponse['deviceId'],
    kind: 'Browser',
    operatingSystem: 'Windows',
    browser: 'Chrome',
    lastSeen: '2026-03-08T09:30:00Z' as UserDeviceResponse['lastSeen'],
    sessionCount: 1,
    lastLocation: null,
    ...overrides,
  };
}

describe('UserDevicesCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDevicesData = undefined;
    mockIsLoading = false;
  });

  it('should render skeleton when loading', () => {
    mockIsLoading = true;

    const { container } = renderWithProviders(<UserDevicesCard userId="user-1" />);

    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render empty state when no devices', () => {
    mockDevicesData = [];

    renderWithProviders(<UserDevicesCard userId="user-1" />);

    expect(screen.getByText('No device activity')).toBeInTheDocument();
  });

  it('composes a browser device label from browser and OS', () => {
    mockDevicesData = [
      makeDevice({ kind: 'Browser', browser: 'Chrome', operatingSystem: 'Windows' }),
    ];

    renderWithProviders(<UserDevicesCard userId="user-1" />);

    expect(screen.getByText('Chrome on Windows')).toBeInTheDocument();
  });

  it('composes a non-browser device label from the kind name and OS', () => {
    mockDevicesData = [makeDevice({ kind: 'MobileApp', browser: null, operatingSystem: 'iOS' })];

    renderWithProviders(<UserDevicesCard userId="user-1" />);

    expect(screen.getByText('Mobile app on iOS')).toBeInTheDocument();
  });

  it('renders the location and session count', () => {
    mockDevicesData = [
      makeDevice({
        sessionCount: 3,
        lastLocation: {
          city: 'Brussels',
          region: null,
          country: 'Belgium',
          countryCode: 'BE',
          latitude: null,
          longitude: null,
        },
      }),
    ];

    renderWithProviders(<UserDevicesCard userId="user-1" />);

    expect(screen.getByText('Brussels, Belgium')).toBeInTheDocument();
    expect(screen.getByText('3 sessions')).toBeInTheDocument();
  });
});
