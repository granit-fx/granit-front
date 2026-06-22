import { toEntityId } from '@granit/types';
import { screen } from '@testing-library/react';

import { CatalogDetailPage } from '../catalog-detail-page';

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

// Mock the catalog data hook. The lifecycle sub-components consume their own
// catalog mutation hooks, so stub those too to keep the detail render isolated.
const { mockUseProduct } = vi.hoisted(() => ({
  mockUseProduct: vi.fn(),
}));

vi.mock('@granit/react-catalog', () => ({
  useProduct: mockUseProduct,
  usePublishProduct: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useArchiveProduct: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateProductMetadata: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
  useAddProductExternalMapping: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
  useRemoveProductExternalMapping: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  }),
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

describe('CatalogDetailPage', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: '00000000-0000-0000-0000-000000000001' });
  });

  afterEach(() => vi.clearAllMocks());

  it('displays the loading spinner', () => {
    mockUseProduct.mockReturnValue({ data: undefined, isLoading: true, error: null });
    renderWithProviders(<CatalogDetailPage />, {
      route: '/catalog/00000000-0000-0000-0000-000000000001',
    });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('displays the not-found state on error', () => {
    mockUseProduct.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Not found'),
    });
    renderWithProviders(<CatalogDetailPage />, {
      route: '/catalog/00000000-0000-0000-0000-000000000001',
    });
    expect(screen.getByText('Product not found.')).toBeInTheDocument();
  });

  it('displays the not-found state when no product is returned', () => {
    mockUseProduct.mockReturnValue({ data: undefined, isLoading: false, error: null });
    renderWithProviders(<CatalogDetailPage />, {
      route: '/catalog/00000000-0000-0000-0000-000000000001',
    });
    expect(screen.getByText('Product not found.')).toBeInTheDocument();
  });

  it('renders the product name, sku and fields', () => {
    mockUseProduct.mockReturnValue({ data: buildProduct(), isLoading: false, error: null });
    renderWithProviders(<CatalogDetailPage />, {
      route: '/catalog/00000000-0000-0000-0000-000000000001',
    });
    expect(screen.getByText('Basic plan')).toBeInTheDocument();
    expect(screen.getByText('BASIC-MONTHLY')).toBeInTheDocument();
    expect(screen.getByText('Service')).toBeInTheDocument();
    expect(screen.getByText('month')).toBeInTheDocument();
    expect(screen.getByText('A simple monthly subscription.')).toBeInTheDocument();
  });

  it('exposes the data-slot anchor', () => {
    mockUseProduct.mockReturnValue({ data: buildProduct(), isLoading: false, error: null });
    renderWithProviders(<CatalogDetailPage />, {
      route: '/catalog/00000000-0000-0000-0000-000000000001',
    });
    expect(document.querySelector('[data-slot="catalog-detail-page"]')).toBeInTheDocument();
  });

  it('shows the edit button when the product is in Draft (canEdit gate open)', () => {
    mockUseProduct.mockReturnValue({
      data: buildProduct({ lifecycleStatus: 'Draft' }),
      isLoading: false,
      error: null,
    });
    renderWithProviders(<CatalogDetailPage />, {
      route: '/catalog/00000000-0000-0000-0000-000000000001',
    });
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  it('hides the edit button for non-Draft products (canEdit gate closed)', () => {
    mockUseProduct.mockReturnValue({
      data: buildProduct({ lifecycleStatus: 'Published' }),
      isLoading: false,
      error: null,
    });
    renderWithProviders(<CatalogDetailPage />, {
      route: '/catalog/00000000-0000-0000-0000-000000000001',
    });
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });
});
