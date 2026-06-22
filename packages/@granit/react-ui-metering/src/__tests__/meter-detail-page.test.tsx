import { useMeterDefinition } from '@granit/react-metering';
import { screen } from '@testing-library/react';

import { MeterDetailPage } from '../meter-detail-page';

import { renderWithProviders } from './test-utils';

const MOCK_METER = {
  id: 'meter-1',
  name: 'API Requests',
  description: 'Tracks API usage',
  aggregationType: 'Sum',
  unit: 'requests',
  productId: null,
  lifecycleStatus: 'Published',
  distinctProperty: null,
};

vi.mock('@granit/react-metering', () => ({
  useActiveMeters: vi.fn(() => ({ data: [], isLoading: false })),
  useCreateMeterDefinition: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useMeterDefinition: vi.fn(() => ({ data: MOCK_METER, isLoading: false })),
  useUsageForPeriod: vi.fn(() => ({ data: null, isLoading: false })),
  useMeteringQuota: vi.fn(() => ({ data: null, isLoading: false })),
  useUpdateMeterDefinition: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  usePublishMeterDefinition: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useArchiveMeterDefinition: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useRecordUsageEvents: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

vi.mock('@granit/types', () => ({
  toEntityId: (id: unknown) => id,
}));

describe('MeterDetailPage', () => {
  it('renders the meter name', () => {
    renderWithProviders(<MeterDetailPage />, { route: '/metering/meter-1' });
    expect(screen.getByText('API Requests')).toBeInTheDocument();
  });

  it('renders the meter description', () => {
    renderWithProviders(<MeterDetailPage />, { route: '/metering/meter-1' });
    expect(screen.getByText('Tracks API usage')).toBeInTheDocument();
  });

  it('has the correct data-slot', () => {
    renderWithProviders(<MeterDetailPage />, { route: '/metering/meter-1' });
    expect(document.querySelector('[data-slot="meter-detail-page"]')).toBeInTheDocument();
  });

  it('renders Record Events and Edit action buttons', () => {
    renderWithProviders(<MeterDetailPage />, { route: '/metering/meter-1' });
    expect(screen.getByText('Record Events')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('shows not-found message when meter data is undefined', () => {
    vi.mocked(useMeterDefinition).mockReturnValueOnce({
      data: undefined,
      isLoading: false,
    } as never);
    renderWithProviders(<MeterDetailPage />, { route: '/metering/unknown' });
    expect(screen.getByText('Meter not found')).toBeInTheDocument();
  });
});
