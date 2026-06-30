import { screen } from '@testing-library/react';
import * as React from 'react';

import { AuditEntityChangesPage } from '../audit-entity-changes-page';

import { renderAudit } from './test-utils';

// Smoke test: stub the framework hook + provider. Reusable audit fixtures live
// in @granit/react-auditing/testing (mockAuditEntityChanges) — not duplicated here.
vi.mock('@granit/react-auditing', () => ({
  AuditEntityChangesProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuditEntityChanges: () => ({
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

describe('AuditEntityChangesPage', () => {
  it('should render page title', () => {
    renderAudit(<AuditEntityChangesPage />);
    expect(screen.getByText('Entity Changes')).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    renderAudit(<AuditEntityChangesPage />);
    expect(
      document.querySelector('[data-slot="audit-entity-changes-page"]')
    ).toBeInTheDocument();
  });
});
