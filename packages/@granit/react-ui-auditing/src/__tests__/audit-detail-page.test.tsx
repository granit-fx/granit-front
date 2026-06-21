import { screen } from '@testing-library/react';
import * as React from 'react';

import { AuditDetailPage } from '../audit-detail-page';

import { renderAudit } from './test-utils';

import type { AuditEntryDetailResponse } from '@granit/auditing';

// Mock react-router-dom useParams (the test router does not bind `:id`).
const { mockUseParams } = vi.hoisted(() => ({ mockUseParams: vi.fn() }));
vi.mock('react-router-dom', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useParams: mockUseParams };
});

// Stub the framework hook + provider (fixtures live in @granit/react-auditing/testing).
const { mockUseAuditLogEntry } = vi.hoisted(() => ({ mockUseAuditLogEntry: vi.fn() }));
vi.mock('@granit/react-auditing', () => ({
  AuditLogProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuditLogEntry: mockUseAuditLogEntry,
}));

const mockEntry: AuditEntryDetailResponse = {
  id: 'audit-001' as AuditEntryDetailResponse['id'],
  timestamp: '2026-02-27T08:00:00Z' as AuditEntryDetailResponse['timestamp'],
  userId: 'user-001' as AuditEntryDetailResponse['userId'],
  userName: 'Marie Dupont',
  category: 'DataMutation',
  ipAddress: '10.0.1.45',
  tenantId: null,
  correlationId: null,
  entityChanges: [
    {
      entityType: 'User',
      entityId: 'user-001',
      changeType: 'Modified',
      propertyChanges: [
        { propertyName: 'email', originalValue: 'old@test.com', newValue: 'new@test.com' },
      ],
    },
  ],
};

describe('AuditDetailPage', () => {
  beforeEach(() => mockUseParams.mockReturnValue({ id: 'audit-001' }));
  afterEach(() => vi.clearAllMocks());

  it('should display the loading spinner', () => {
    mockUseAuditLogEntry.mockReturnValue({ data: undefined, isLoading: true });
    renderAudit(<AuditDetailPage />, { route: '/auditing/audit-001' });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should display the not-found state when the entry is missing', () => {
    mockUseAuditLogEntry.mockReturnValue({ data: undefined, isLoading: false });
    renderAudit(<AuditDetailPage />, { route: '/auditing/audit-001' });
    expect(screen.getByText('Audit entry not found')).toBeInTheDocument();
  });

  it('should render the entry metadata', () => {
    mockUseAuditLogEntry.mockReturnValue({ data: mockEntry, isLoading: false });
    renderAudit(<AuditDetailPage />, { route: '/auditing/audit-001' });
    expect(screen.getByText('Audit entry detail')).toBeInTheDocument();
    expect(screen.getByText('Marie Dupont')).toBeInTheDocument();
    expect(screen.getByText('10.0.1.45')).toBeInTheDocument();
  });

  it('should render the entity change with its property diff', () => {
    mockUseAuditLogEntry.mockReturnValue({ data: mockEntry, isLoading: false });
    renderAudit(<AuditDetailPage />, { route: '/auditing/audit-001' });
    expect(screen.getByText('Entity changes')).toBeInTheDocument();
    expect(screen.getByText('email')).toBeInTheDocument();
    expect(screen.getByText('old@test.com')).toBeInTheDocument();
    expect(screen.getByText('new@test.com')).toBeInTheDocument();
  });

  it('should render the empty state when there are no entity changes', () => {
    mockUseAuditLogEntry.mockReturnValue({
      data: { ...mockEntry, entityChanges: [] },
      isLoading: false,
    });
    renderAudit(<AuditDetailPage />, { route: '/auditing/audit-001' });
    expect(screen.getByText('No entity changes recorded for this entry')).toBeInTheDocument();
  });

  it('should have the data-slot attribute', () => {
    mockUseAuditLogEntry.mockReturnValue({ data: mockEntry, isLoading: false });
    renderAudit(<AuditDetailPage />, { route: '/auditing/audit-001' });
    expect(document.querySelector('[data-slot="audit-detail-page"]')).toBeInTheDocument();
  });

  it('falls back to System and a dash for a null user name and IP', () => {
    mockUseAuditLogEntry.mockReturnValue({
      data: { ...mockEntry, userName: null, ipAddress: null },
      isLoading: false,
    });
    renderAudit(<AuditDetailPage />, { route: '/auditing/audit-001' });
    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.queryByText('Marie Dupont')).toBeNull();
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
  });

  it('renders dashes for null property values and a placeholder for changes without properties', () => {
    mockUseAuditLogEntry.mockReturnValue({
      data: {
        ...mockEntry,
        entityChanges: [
          {
            entityType: 'User',
            entityId: 'user-001',
            changeType: 'Modified',
            propertyChanges: [{ propertyName: 'email', originalValue: null, newValue: null }],
          },
          {
            entityType: 'Role',
            entityId: 'role-001',
            changeType: 'Added',
            propertyChanges: [],
          },
        ],
      },
      isLoading: false,
    });
    renderAudit(<AuditDetailPage />, { route: '/auditing/audit-001' });
    expect(screen.getByText('email')).toBeInTheDocument();
    // null originalValue + newValue both render as a dash
    expect(screen.getAllByText('-').length).toBeGreaterThanOrEqual(2);
    // the change with no property diffs shows the empty placeholder
    expect(screen.getByText('Common.NoResults')).toBeInTheDocument();
  });
});
