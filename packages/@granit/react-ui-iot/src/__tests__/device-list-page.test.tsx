import { sampleDeviceEntities } from '@granit/react-iot/testing';
import { screen, waitFor } from '@testing-library/react';

import { DeviceListPage } from '../components/device-list-page';

import { renderWithProviders } from './test-utils';

// ---------------------------------------------------------------------------
// Mocks — the page consumes the query-engine surface (useDevicesQuery,
// UseQueryEndpointReturn) plus the provision mutation. Device rows reuse the
// shared fixtures from @granit/react-iot/testing (SN-001 / SN-002 / SN-003).
// ---------------------------------------------------------------------------

const mockDevices = sampleDeviceEntities;

const { mockUseDevicesQuery } = vi.hoisted(() => ({
  mockUseDevicesQuery: vi.fn(),
}));

function queryEndpoint(data: unknown, isLoading: boolean) {
  return {
    query: { data, isLoading },
    params: {},
    setPage: vi.fn(),
    setPageSize: vi.fn(),
    toggleSort: vi.fn(),
    isGrouped: false,
    groupedQuery: { data: undefined, isLoading: false },
  };
}

vi.mock('@granit/react-iot', () => ({
  useDevicesQuery: mockUseDevicesQuery,
  useProvisionDevice: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe('DeviceListPage', () => {
  afterEach(() => vi.clearAllMocks());

  it('renders the page title and subtitle', () => {
    mockUseDevicesQuery.mockReturnValue(
      queryEndpoint({ items: mockDevices, totalCount: mockDevices.length }, false)
    );
    renderWithProviders(<DeviceListPage />);
    expect(screen.getByText('Devices')).toBeInTheDocument();
    expect(screen.getByText('Manage the device fleet')).toBeInTheDocument();
  });

  it('renders the provision button', () => {
    mockUseDevicesQuery.mockReturnValue(
      queryEndpoint({ items: mockDevices, totalCount: mockDevices.length }, false)
    );
    renderWithProviders(<DeviceListPage />);
    expect(screen.getByText('Provision Device')).toBeInTheDocument();
  });

  it('has the correct data-slot', () => {
    mockUseDevicesQuery.mockReturnValue(
      queryEndpoint({ items: mockDevices, totalCount: mockDevices.length }, false)
    );
    renderWithProviders(<DeviceListPage />);
    expect(document.querySelector('[data-slot="device-list-page"]')).toBeInTheDocument();
  });

  it('renders the column headers', async () => {
    mockUseDevicesQuery.mockReturnValue(
      queryEndpoint({ items: mockDevices, totalCount: mockDevices.length }, false)
    );
    renderWithProviders(<DeviceListPage />);
    await waitFor(() => {
      expect(screen.getByText('Serial Number')).toBeInTheDocument();
    });
    expect(screen.getByText('Model')).toBeInTheDocument();
    expect(screen.getByText('Firmware')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders a row per device', async () => {
    mockUseDevicesQuery.mockReturnValue(
      queryEndpoint({ items: mockDevices, totalCount: mockDevices.length }, false)
    );
    renderWithProviders(<DeviceListPage />);
    await waitFor(() => {
      expect(screen.getByText('SN-001')).toBeInTheDocument();
    });
    expect(screen.getByText('SN-002')).toBeInTheDocument();
  });

  it('renders no data rows when the fleet is empty', async () => {
    mockUseDevicesQuery.mockReturnValue(queryEndpoint({ items: [], totalCount: 0 }, false));
    renderWithProviders(<DeviceListPage />);
    await waitFor(() => {
      expect(screen.queryByText('SN-001')).not.toBeInTheDocument();
    });
  });
});
