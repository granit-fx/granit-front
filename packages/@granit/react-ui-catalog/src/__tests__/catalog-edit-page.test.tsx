import { toEntityId } from '@granit/types';
import { screen, waitFor } from '@testing-library/react';

import { CatalogEditPage } from '../catalog-edit-page';

import { renderWithProviders } from './test-utils';

import type { ProductId, ProductResponse } from '@granit/catalog';

// Mock react-router-dom useParams so the page resolves a product id.
const { mockUseParams } = vi.hoisted(() => ({
  mockUseParams: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useParams: mockUseParams,
  };
});

// Mock the catalog fetch + update hooks.
const { mockUseProduct } = vi.hoisted(() => ({
  mockUseProduct: vi.fn(),
}));

vi.mock('@granit/react-catalog', () => ({
  useProduct: mockUseProduct,
  useUpdateProduct: () => ({ mutate: vi.fn(), isPending: false }),
}));

function buildProduct(overrides: Partial<ProductResponse> = {}): ProductResponse {
  return {
    id: toEntityId<'Product'>('00000000-0000-0000-0000-000000000001') as ProductId,
    sku: 'BASIC-MONTHLY',
    name: 'Basic plan',
    description: 'A simple monthly subscription.',
    type: 'Service',
    unit: 'month',
    lifecycleStatus: 'Draft',
    metadata: {},
    externalMappings: [],
    ...overrides,
  };
}

const ROUTE = '/catalog/00000000-0000-0000-0000-000000000001/edit';

describe('CatalogEditPage', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: '00000000-0000-0000-0000-000000000001' });
  });

  afterEach(() => vi.clearAllMocks());

  it('displays the loading spinner', () => {
    mockUseProduct.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<CatalogEditPage />, { route: ROUTE });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('displays the not-found state when no product is returned', () => {
    mockUseProduct.mockReturnValue({ data: undefined, isLoading: false });
    renderWithProviders(<CatalogEditPage />, { route: ROUTE });
    expect(screen.getByText('Product not found.')).toBeInTheDocument();
  });

  it('renders the edit form pre-filled for a Draft product', async () => {
    mockUseProduct.mockReturnValue({ data: buildProduct(), isLoading: false });
    renderWithProviders(<CatalogEditPage />, { route: ROUTE });

    await waitFor(() => {
      expect(screen.getByLabelText('Name')).toHaveValue('Basic plan');
    });
    expect(screen.getByLabelText('Unit')).toHaveValue('month');
    expect(screen.getByLabelText('Description')).toHaveValue('A simple monthly subscription.');
  });

  it('renders the title with the product name and its sku', () => {
    mockUseProduct.mockReturnValue({ data: buildProduct(), isLoading: false });
    renderWithProviders(<CatalogEditPage />, { route: ROUTE });
    expect(screen.getByText('Edit Basic plan')).toBeInTheDocument();
    expect(screen.getByText('BASIC-MONTHLY')).toBeInTheDocument();
  });

  it('exposes the data-slot anchor for a Draft product', () => {
    mockUseProduct.mockReturnValue({ data: buildProduct(), isLoading: false });
    renderWithProviders(<CatalogEditPage />, { route: ROUTE });
    expect(document.querySelector('[data-slot="catalog-edit-page"]')).toBeInTheDocument();
  });

  it('shows the Draft-only guard for a Published product', () => {
    mockUseProduct.mockReturnValue({
      data: buildProduct({ lifecycleStatus: 'Published' }),
      isLoading: false,
    });
    renderWithProviders(<CatalogEditPage />, { route: ROUTE });
    expect(screen.getByText('Editing not allowed')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Only Draft products can be edited. Use metadata or external mappings to update Published or Archived products.'
      )
    ).toBeInTheDocument();
    // The form must not render behind the guard.
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
  });

  it('shows the Draft-only guard for an Archived product', () => {
    mockUseProduct.mockReturnValue({
      data: buildProduct({ lifecycleStatus: 'Archived' }),
      isLoading: false,
    });
    renderWithProviders(<CatalogEditPage />, { route: ROUTE });
    expect(screen.getByText('Editing not allowed')).toBeInTheDocument();
  });
});
