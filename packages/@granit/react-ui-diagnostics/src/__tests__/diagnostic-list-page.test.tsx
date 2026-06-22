import { screen } from '@testing-library/react';

import { DiagnosticListPage } from '../diagnostic-list-page';

import { renderDiagnostics } from './test-utils';

import type { ServiceHealthResponse } from '@granit/diagnostics';

const { mockUseMonitoringHealth } = vi.hoisted(() => ({ mockUseMonitoringHealth: vi.fn() }));

vi.mock('@granit/react-diagnostics', () => ({
  useMonitoringHealth: () => mockUseMonitoringHealth(),
}));

const services: ServiceHealthResponse[] = [
  {
    id: 'api',
    name: 'API Gateway',
    description: null,
    status: 'healthy',
    responseTimeMs: 42,
    tags: [],
  },
  {
    id: 'iam',
    name: 'Keycloak (IAM)',
    description: null,
    status: 'degraded',
    responseTimeMs: 850,
    tags: [],
  },
  {
    id: 'fhir',
    name: 'FHIR Server',
    description: null,
    status: 'down',
    responseTimeMs: null,
    tags: [],
  },
];

beforeEach(() => {
  mockUseMonitoringHealth.mockReturnValue({
    data: { services, checkedAt: '2026-06-01T10:00:00Z' },
    isLoading: false,
    isFetching: false,
    refetch: vi.fn(),
  });
});

afterEach(() => vi.clearAllMocks());

describe('DiagnosticListPage', () => {
  it('should render page title', () => {
    renderDiagnostics(<DiagnosticListPage />);
    expect(screen.getByText('Monitoring')).toBeInTheDocument();
  });

  it('should render the auto-refresh button', () => {
    renderDiagnostics(<DiagnosticListPage />);
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });

  it('should render a card for each service', () => {
    renderDiagnostics(<DiagnosticListPage />);
    expect(screen.getByText('API Gateway')).toBeInTheDocument();
    expect(screen.getByText('Keycloak (IAM)')).toBeInTheDocument();
    expect(screen.getByText('FHIR Server')).toBeInTheDocument();
  });

  it('should render translated status labels (not raw i18n keys)', () => {
    renderDiagnostics(<DiagnosticListPage />);
    expect(screen.getAllByText('Healthy').length).toBeGreaterThan(0);
    expect(screen.getByText('Degraded')).toBeInTheDocument();
    expect(screen.getByText('Down')).toBeInTheDocument();
    expect(screen.queryByText(/Diagnostics\.Status\./)).not.toBeInTheDocument();
  });

  it('should show the loading skeletons while loading', () => {
    mockUseMonitoringHealth.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: true,
      refetch: vi.fn(),
    });
    renderDiagnostics(<DiagnosticListPage />);
    expect(screen.queryByText('API Gateway')).not.toBeInTheDocument();
  });
});
