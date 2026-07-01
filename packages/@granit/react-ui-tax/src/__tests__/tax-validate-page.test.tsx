import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TaxValidatePage } from '../components/tax-validate-page';

import { renderWithProviders } from './test-utils';

vi.mock('@granit/react-tax', () => ({
  useTaxRates: () => ({ data: [], isLoading: false }),
  useTaxRateByCountry: () => ({ data: undefined, isLoading: false }),
  useValidateTaxId: () => ({
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    data: undefined,
  }),
}));

describe('TaxValidatePage', () => {
  it('renders the page title heading', () => {
    renderWithProviders(<TaxValidatePage />);
    expect(screen.getByRole('heading', { name: 'Tax Validation' })).toBeInTheDocument();
  });

  it('renders the page subtitle', () => {
    renderWithProviders(<TaxValidatePage />);
    expect(screen.getByText('Validate tax identifiers')).toBeInTheDocument();
  });

  it('renders the validate submit button', () => {
    renderWithProviders(<TaxValidatePage />);
    expect(screen.getByText('Validate')).toBeInTheDocument();
  });

  it('has the correct data-slot', () => {
    renderWithProviders(<TaxValidatePage />);
    expect(document.querySelector('[data-slot="tax-validate-page"]')).toBeInTheDocument();
  });
});
