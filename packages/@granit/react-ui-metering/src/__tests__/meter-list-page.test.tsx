import { screen } from '@testing-library/react';

import { MeterListPage } from '../meter-list-page';

import { renderWithProviders } from './test-utils';

vi.mock('@granit/react-metering', () => ({
  useActiveMeters: () => ({ data: [], isLoading: false }),
  useCreateMeterDefinition: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe('MeterListPage', () => {
  it('renders the page title', () => {
    renderWithProviders(<MeterListPage />);
    expect(screen.getByText('Metering')).toBeInTheDocument();
  });

  it('renders the page subtitle', () => {
    renderWithProviders(<MeterListPage />);
    expect(screen.getByText('Manage metering definitions')).toBeInTheDocument();
  });

  it('renders the create button', () => {
    renderWithProviders(<MeterListPage />);
    expect(screen.getByText('Create Meter')).toBeInTheDocument();
  });

  it('has the correct data-slot', () => {
    renderWithProviders(<MeterListPage />);
    expect(document.querySelector('[data-slot="meter-list-page"]')).toBeInTheDocument();
  });
});
