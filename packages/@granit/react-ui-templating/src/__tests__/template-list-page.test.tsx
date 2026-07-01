import { mockTemplatesData, toTemplateListItem } from '@granit/react-templating/testing';
import { screen, waitFor } from '@testing-library/react';
import * as React from 'react';

import { TemplateListPage } from '../components/template-list-page';

import { renderWithProviders } from './test-utils';

import type { TemplateListItem } from '@granit/templating';

// ---------------------------------------------------------------------------
// Mock data — shared fixtures (Email.Welcome / Email.ResetPassword /
// Document.Invoice) converted to the TemplateListItem wire shape.
// ---------------------------------------------------------------------------

const mockTemplates: TemplateListItem[] = mockTemplatesData.map(toTemplateListItem);

const mockMeta = {
  columns: [
    { name: 'name', label: 'Name', type: 'String', order: 1, isSortable: true, isVisible: true },
  ],
  filterableFields: [],
  sortableFields: [{ name: 'name' }],
  presetFilterGroups: [],
  quickFilters: [],
  dateFilters: [],
  groupByFields: [],
  pagination: { defaultPageSize: 25, maxPageSize: 100, supportsCursor: false },
};

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { mockQueryEndpoint } = vi.hoisted(() => ({ mockQueryEndpoint: vi.fn() }));

vi.mock('@granit/react-query-engine', () => ({
  QueryProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useQueryMeta: () => ({ data: mockMeta, isLoading: false }),
  useQueryEndpoint: () => mockQueryEndpoint(),
  useSmartFilter: () => ({
    phase: 'idle',
    inputValue: '',
    tokens: [],
    suggestions: [],
    presets: {},
    setInput: vi.fn(),
    selectField: vi.fn(),
    selectOperator: vi.fn(),
    confirmValue: vi.fn(),
    addPresetToken: vi.fn(),
    addQuickFilterToken: vi.fn(),
    addSearchToken: vi.fn(),
    addFilterToken: vi.fn(),
    removeToken: vi.fn(),
    clearAll: vi.fn(),
    cancel: vi.fn(),
  }),
}));

vi.mock('@granit/react-templating', () => ({
  TemplatingProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTemplateCategories: () => ({ data: [], isLoading: false }),
  useTemplateCategoryMutations: () => ({
    create: { mutateAsync: vi.fn(), isPending: false },
    remove: { mutateAsync: vi.fn(), isPending: false },
  }),
}));

vi.mock('@granit/react-data-exchange', () => ({
  DataExchangeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@granit/react-ui-data-exchange', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ExportButton: ({ label }: { label: string }) => <button type="button">{label}</button>,
  ExportDialog: () => <div data-testid="export-dialog" />,
  ImportButton: ({ label }: { label: string }) => <button type="button">{label}</button>,
  ImportDialog: () => <div data-testid="import-dialog" />,
}));

vi.mock('@granit/react-ui-kit', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useSmartFilterSync: () => ({ handlePresetToggle: vi.fn() }),
  useOperatorLabels: () => ({}),
}));

function endpointWith(items: TemplateListItem[]) {
  return {
    query: { data: { items, totalCount: items.length }, isLoading: false, isFetching: false },
    groupedQuery: { data: null, isLoading: false },
    params: { page: 1, pageSize: 25, sort: [{ field: 'name', direction: 'asc' }], filters: [] },
    isGrouped: false,
    setPage: vi.fn(),
    setPageSize: vi.fn(),
    toggleSort: vi.fn(),
    setGroupBy: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TemplateListPage', () => {
  beforeEach(() => {
    mockQueryEndpoint.mockReturnValue(endpointWith(mockTemplates));
  });

  afterEach(() => vi.clearAllMocks());

  it('should render the page title and subtitle', async () => {
    renderWithProviders(<TemplateListPage />);
    await waitFor(() => {
      expect(screen.getByText('Template Management')).toBeInTheDocument();
    });
    expect(
      screen.getByText('Manage Scriban templates for emails, letters and documents')
    ).toBeInTheDocument();
  });

  it('should have the page data-slot', async () => {
    renderWithProviders(<TemplateListPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-slot="template-list-page"]')).toBeInTheDocument();
    });
  });

  it('should render the create and categories buttons', async () => {
    renderWithProviders(<TemplateListPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /New template/ })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Categories/ })).toBeInTheDocument();
  });

  it('should render the template rows', async () => {
    renderWithProviders(<TemplateListPage />);
    await waitFor(() => {
      expect(screen.getByText('Email.Welcome')).toBeInTheDocument();
    });
    expect(screen.getByText('Document.Invoice')).toBeInTheDocument();
  });

  it('should render the Name column header', async () => {
    renderWithProviders(<TemplateListPage />);
    await waitFor(() => {
      expect(screen.getAllByText('Name').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('should render an empty table when there are no templates', async () => {
    mockQueryEndpoint.mockReturnValue(endpointWith([]));
    renderWithProviders(<TemplateListPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-slot="template-list-page"]')).toBeInTheDocument();
    });
    expect(screen.queryByText('Email.Welcome')).not.toBeInTheDocument();
  });
});
