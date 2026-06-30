import { screen } from '@testing-library/react';

import { ApiKeyDetailPage } from '../components/api-key-detail-page';

import { renderWithProviders } from './test-utils';

// Mock react-router-dom useParams to supply the :id route param.
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

// Mock the api-keys data hooks.
const { mockUseApiKey } = vi.hoisted(() => ({
  mockUseApiKey: vi.fn(),
}));

vi.mock('@granit/react-authentication-api-keys', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useApiKey: mockUseApiKey,
    useRevokeApiKey: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useRotateApiKey: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useUpdateApiKeyScopes: () => ({ mutateAsync: vi.fn(), isPending: false }),
  };
});

const mockApiKey = {
  id: '894c3628-9424-5a2d-ab57-ba0535dffac8',
  name: 'CI Deploy Key',
  type: 'Secret' as const,
  environment: 'live',
  prefix: 'gsk_live',
  lastFourChars: 'a1b2',
  permissions: ['documents:read', 'documents:write'],
  allowedCidrs: ['203.0.113.0/24'],
  expiresAt: null,
  lastUsedAt: '2026-06-20T10:00:00.000Z',
  revokedAt: null,
  cacheBehavior: 'Normal' as const,
  createdAt: '2026-06-01T08:00:00.000Z',
  modifiedAt: null,
};

describe('ApiKeyDetailPage', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: mockApiKey.id });
  });

  afterEach(() => vi.clearAllMocks());

  it('should display the loading spinner', () => {
    mockUseApiKey.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<ApiKeyDetailPage />, { route: `/api-keys/${mockApiKey.id}` });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should display the not-found state', () => {
    mockUseApiKey.mockReturnValue({ data: undefined, isLoading: false });
    renderWithProviders(<ApiKeyDetailPage />, { route: `/api-keys/${mockApiKey.id}` });
    expect(screen.getByText('API key not found')).toBeInTheDocument();
    expect(screen.getByText('Back to API keys')).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    mockUseApiKey.mockReturnValue({ data: mockApiKey, isLoading: false });
    renderWithProviders(<ApiKeyDetailPage />, { route: `/api-keys/${mockApiKey.id}` });
    expect(document.querySelector('[data-slot="api-key-detail-page"]')).toBeInTheDocument();
  });

  it('should display the key name as a heading', () => {
    mockUseApiKey.mockReturnValue({ data: mockApiKey, isLoading: false });
    renderWithProviders(<ApiKeyDetailPage />, { route: `/api-keys/${mockApiKey.id}` });
    expect(screen.getByRole('heading', { name: 'CI Deploy Key' })).toBeInTheDocument();
  });

  it('should display the active status badge', () => {
    mockUseApiKey.mockReturnValue({ data: mockApiKey, isLoading: false });
    renderWithProviders(<ApiKeyDetailPage />, { route: `/api-keys/${mockApiKey.id}` });
    expect(document.querySelector('[data-slot="api-key-status-badge"]')?.textContent).toContain(
      'Active'
    );
  });

  it('should display the prefix and last four characters', () => {
    mockUseApiKey.mockReturnValue({ data: mockApiKey, isLoading: false });
    renderWithProviders(<ApiKeyDetailPage />, { route: `/api-keys/${mockApiKey.id}` });
    expect(screen.getByText(/gsk_live\.\.\.a1b2/)).toBeInTheDocument();
  });

  it('should display the permissions', () => {
    mockUseApiKey.mockReturnValue({ data: mockApiKey, isLoading: false });
    renderWithProviders(<ApiKeyDetailPage />, { route: `/api-keys/${mockApiKey.id}` });
    expect(screen.getByText('documents:read')).toBeInTheDocument();
    expect(screen.getByText('documents:write')).toBeInTheDocument();
  });

  it('should display the revoked banner for a revoked key', () => {
    mockUseApiKey.mockReturnValue({
      data: { ...mockApiKey, revokedAt: '2026-06-15T08:00:00.000Z' },
      isLoading: false,
    });
    renderWithProviders(<ApiKeyDetailPage />, { route: `/api-keys/${mockApiKey.id}` });
    expect(screen.getByText('This key is revoked. No actions available.')).toBeInTheDocument();
  });
});
