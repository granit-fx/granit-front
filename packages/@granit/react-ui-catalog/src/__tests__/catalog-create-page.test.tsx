import { screen } from '@testing-library/react';

import { CatalogCreatePage } from '../catalog-create-page';

import { renderWithProviders } from './test-utils';

// Stub the catalog mutation hook so the test focuses on render — the real
// mutation is exercised end-to-end via MSW elsewhere.
const { mockMutate } = vi.hoisted(() => ({
  mockMutate: vi.fn(),
}));

vi.mock('@granit/react-catalog', () => ({
  useCreateProduct: () => ({ mutate: mockMutate, isPending: false }),
}));

describe('CatalogCreatePage', () => {
  afterEach(() => vi.clearAllMocks());

  it('renders the title and subtitle', () => {
    renderWithProviders(<CatalogCreatePage />);
    expect(screen.getByText('New product')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Create a new product in Draft status. Publish it later to make it available.'
      )
    ).toBeInTheDocument();
  });

  it('exposes the data-slot anchor', () => {
    renderWithProviders(<CatalogCreatePage />);
    expect(document.querySelector('[data-slot="catalog-create-page"]')).toBeInTheDocument();
  });

  it('renders the SKU, name, type, unit and description fields', () => {
    renderWithProviders(<CatalogCreatePage />);
    expect(screen.getByText('SKU')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Unit')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('renders the cancel and create buttons', () => {
    renderWithProviders(<CatalogCreatePage />);
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });
});
