import { screen } from '@testing-library/react';
import * as React from 'react';

import { AuditListPage } from '../audit-list-page';

import { renderAudit } from './test-utils';

// Smoke test: stub the framework hook + provider. Reusable audit fixtures live
// in @granit/react-auditing/testing (mockAuditEntries, createAuditHandlers) —
// not duplicated here. The vi.mock applies in-workspace (same monorepo).
vi.mock('@granit/react-auditing', () => ({
  AuditLogProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuditEntries: () => ({
    query: {
      data: { items: [], totalCount: 0 },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    },
    groupedQuery: { data: null, isLoading: false },
    params: { page: 1, pageSize: 20 },
    isGrouped: false,
    setPage: vi.fn(),
    setPageSize: vi.fn(),
    setFilters: vi.fn(),
    toggleSort: vi.fn(),
  }),
}));

describe('AuditListPage', () => {
  it('should render page title', () => {
    renderAudit(<AuditListPage />);
    expect(screen.getByText('Audit Logs')).toBeInTheDocument();
  });

  it('should render page subtitle', () => {
    renderAudit(<AuditListPage />);
    expect(
      screen.getByText('Track all administrative actions and system events')
    ).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    renderAudit(<AuditListPage />);
    expect(document.querySelector('[data-slot="audit-list-page"]')).toBeInTheDocument();
  });
});
