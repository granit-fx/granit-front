import { screen } from '@testing-library/react';

import { renderWithProviders } from '../__tests__/test-utils';

import { MyDevicesCard } from './my-devices-card';

import type { UserDeviceResponse } from '@granit/identity';

let currentDevices: readonly UserDeviceResponse[] = [];

vi.mock('@granit/react-identity', () => ({
  useMyUserDevices: () => ({ data: currentDevices, isLoading: false }),
}));

function makeDevice(overrides: Partial<UserDeviceResponse> = {}): UserDeviceResponse {
  return {
    deviceId: 'dev-1' as UserDeviceResponse['deviceId'],
    kind: 'Browser',
    operatingSystem: 'Windows',
    browser: 'Chrome',
    lastSeen: '2026-03-08T09:30:00Z' as UserDeviceResponse['lastSeen'],
    sessionCount: 2,
    lastLocation: null,
    ...overrides,
  };
}

beforeEach(() => {
  currentDevices = [];
});

describe('MyDevicesCard', () => {
  it('should render nothing when session tracking is disabled', () => {
    currentDevices = [makeDevice()];
    const { container } = renderWithProviders(<MyDevicesCard sessionTrackingEnabled={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should render the self-service title and device labels', async () => {
    currentDevices = [makeDevice()];

    renderWithProviders(<MyDevicesCard sessionTrackingEnabled />);

    expect(await screen.findByText('My devices')).toBeInTheDocument();
    expect(screen.getByText('Chrome on Windows')).toBeInTheDocument();
    expect(screen.getByText('2 sessions')).toBeInTheDocument();
  });

  it('should render an empty state when there are no devices', async () => {
    currentDevices = [];

    renderWithProviders(<MyDevicesCard sessionTrackingEnabled />);

    expect(await screen.findByText('No device activity')).toBeInTheDocument();
  });
});
