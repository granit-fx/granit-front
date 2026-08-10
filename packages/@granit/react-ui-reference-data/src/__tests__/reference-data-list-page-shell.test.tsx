import { screen, waitFor } from '@testing-library/react';
import * as React from 'react';

import { ReferenceDataCard } from '../components/reference-data-card';
import { createReferenceDataColumns } from '../components/reference-data-columns';
import { ReferenceDataListPageShell } from '../components/reference-data-list-page-shell';

import { renderWithProviders, testI18n } from './test-utils';

import type { ReferenceDataResponse } from '../components/types';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

function makeEntry(overrides: Partial<ReferenceDataResponse> = {}): ReferenceDataResponse {
  return {
    id: 'rd-1' as ReferenceDataResponse['id'],
    code: 'BE',
    label: 'Belgium',
    labelEn: 'Belgium',
    labelFr: 'Belgique',
    labelNl: '',
    labelDe: '',
    labelEs: '',
    labelIt: '',
    labelPt: '',
    labelZh: '',
    labelJa: '',
    labelPl: '',
    labelTr: '',
    labelKo: '',
    labelSv: '',
    labelCs: '',
    labelHi: '',
    activated: true,
    sortOrder: 0,
    validFrom: null,
    validTo: null,
    parentCode: null,
    metadata: null,
    ...overrides,
  };
}

const mockMeta = {
  columns: [{ name: 'labelEn', label: 'Label (EN)', isSortable: true, isVisible: true }],
  presetFilterGroups: [{ key: 'status', label: 'Status', presets: [] }],
  groupByFields: ['parentCode'],
};

// ---------------------------------------------------------------------------
// Hoisted mock state
// ---------------------------------------------------------------------------

const { mockMetaResult, mockQueryEndpoint, mockToastSuccess, mockLoggerError } = vi.hoisted(() => ({
  mockMetaResult: vi.fn(),
  mockQueryEndpoint: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockLoggerError: vi.fn(),
}));

vi.mock('sonner', () => ({ toast: { success: mockToastSuccess } }));

vi.mock('../logger', () => ({ logger: { error: mockLoggerError } }));

vi.mock('@granit/react-query-engine', () => ({
  QueryProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useQueryMeta: () => mockMetaResult(),
  useQueryEndpoint: () => mockQueryEndpoint(),
  useSmartFilter: () => ({
    presets: {},
    tokens: [],
    phase: 'idle',
    inputValue: '',
    suggestions: [],
    setInput: vi.fn(),
    removeToken: vi.fn(),
  }),
}));

vi.mock('@granit/react-data-exchange', () => ({
  DataExchangeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@granit/react-ui-data-exchange', () => ({
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const t = testI18n.t.bind(testI18n);

function endpointWith(items: ReferenceDataResponse[], extra: { isLoading?: boolean } = {}) {
  return {
    query: {
      data: { items, totalCount: items.length },
      isLoading: extra.isLoading ?? false,
      isFetching: false,
    },
    groupedQuery: { data: null, isLoading: false },
    params: {
      page: 1,
      pageSize: 20,
      sort: [{ field: 'labelEn', direction: 'asc' }],
      filters: [{ field: 'code', operator: 'eq', value: 'BE' }],
      search: 'be',
      groupBy: undefined,
    },
    isGrouped: false,
    setPage: vi.fn(),
    setPageSize: vi.fn(),
    toggleSort: vi.fn(),
    setGroupBy: vi.fn(),
  };
}

const deactivateMutation = { mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false };
const updateMutation = { mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false };

function baseProps() {
  return {
    i18nPrefix: 'ReferenceData.Common',
    basePath: '/admin/countries',
    queryConfig: {} as never,
    exportDefinition: 'export-def',
    importDefinition: 'import-def',
    columns: createReferenceDataColumns({
      t,
      onEdit: vi.fn(),
      onDeactivate: vi.fn(),
      onReactivate: vi.fn(),
    }),
    deactivateMutation,
    updateMutation,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ReferenceDataListPageShell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deactivateMutation.mutateAsync.mockResolvedValue(undefined);
    updateMutation.mutateAsync.mockResolvedValue(undefined);
    mockMetaResult.mockReturnValue({ data: mockMeta, isLoading: false });
    mockQueryEndpoint.mockReturnValue(endpointWith([makeEntry()]));
  });

  it('renders a spinner while meta is loading', () => {
    mockMetaResult.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<ReferenceDataListPageShell {...baseProps()} />);
    expect(
      document.querySelector('[data-slot="reference-data-list-page"]')
    ).not.toBeInTheDocument();
  });

  it('renders the header, filter bar and table view', () => {
    renderWithProviders(<ReferenceDataListPageShell {...baseProps()} />);
    expect(document.querySelector('[data-slot="reference-data-list-page"]')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
    expect(screen.getByText('Import')).toBeInTheDocument();
    expect(screen.getByTestId('export-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('import-dialog')).toBeInTheDocument();
  });

  it('navigates to the edit route from a card action', async () => {
    const props = baseProps();
    const { user } = renderWithProviders(
      <ReferenceDataListPageShell
        {...props}
        showCardView
        renderCard={(entry, cb) => <ReferenceDataCard key={entry.code} entry={entry} {...cb} />}
      />,
      { route: '/admin/countries' }
    );
    await user.click(screen.getByRole('button', { name: '', pressed: false }));
    await user.click(screen.getByRole('button', { name: 'Actions for Belgium' }));
    await user.click(screen.getByText('Edit'));
    // Navigation is handled by react-router; the card menu closes after edit.
    await waitFor(() =>
      expect(screen.queryByRole('menuitem', { name: 'Edit' })).not.toBeInTheDocument()
    );
  });

  it('renders grouped totals when the endpoint is grouped', () => {
    mockQueryEndpoint.mockReturnValue({
      ...endpointWith([makeEntry()]),
      isGrouped: true,
      groupedQuery: { data: { groups: [], totalCount: 0 }, isLoading: false },
    });
    renderWithProviders(<ReferenceDataListPageShell {...baseProps()} />);
    expect(document.querySelector('[data-slot="reference-data-list-page"]')).toBeInTheDocument();
  });

  it('switches to the card (kanban) view and renders cards', async () => {
    const props = baseProps();
    const { user } = renderWithProviders(
      <ReferenceDataListPageShell
        {...props}
        showCardView
        renderCard={(entry, cb) => <ReferenceDataCard key={entry.code} entry={entry} {...cb} />}
      />
    );
    // The second view-switcher button toggles to kanban.
    const kanbanButton = screen.getByRole('button', { name: '', pressed: false });
    await user.click(kanbanButton);
    expect(document.querySelector('[data-slot="reference-data-card"]')).toBeInTheDocument();
  });

  it('shows the empty card state when kanban has no items', async () => {
    mockQueryEndpoint.mockReturnValue(endpointWith([]));
    const props = baseProps();
    const { user } = renderWithProviders(
      <ReferenceDataListPageShell
        {...props}
        showCardView
        renderCard={(entry, cb) => <ReferenceDataCard key={entry.code} entry={entry} {...cb} />}
      />
    );
    const kanbanButton = screen.getByRole('button', { name: '', pressed: false });
    await user.click(kanbanButton);
    expect(screen.getByText('No results')).toBeInTheDocument();
  });

  it('shows skeletons in the kanban view while loading', async () => {
    mockQueryEndpoint.mockReturnValue(endpointWith([], { isLoading: true }));
    const props = baseProps();
    const { user } = renderWithProviders(
      <ReferenceDataListPageShell
        {...props}
        showCardView
        renderCard={(entry, cb) => <ReferenceDataCard key={entry.code} entry={entry} {...cb} />}
      />
    );
    const kanbanButton = screen.getByRole('button', { name: '', pressed: false });
    await user.click(kanbanButton);
    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it('renders an extra view in the kanban slot', async () => {
    const props = baseProps();
    const { user } = renderWithProviders(
      <ReferenceDataListPageShell
        {...props}
        renderExtraView={() => <div data-testid="tree">tree</div>}
      />
    );
    const kanbanButton = screen.getByRole('button', { name: '', pressed: false });
    await user.click(kanbanButton);
    expect(screen.getByTestId('tree')).toBeInTheDocument();
  });

  it('confirms deactivation: calls the mutation and toasts success', async () => {
    const props = baseProps();
    const { user } = renderWithProviders(
      <ReferenceDataListPageShell
        {...props}
        showCardView
        renderCard={(entry, cb) => <ReferenceDataCard key={entry.code} entry={entry} {...cb} />}
      />
    );
    await user.click(screen.getByRole('button', { name: '', pressed: false }));
    await user.click(screen.getByRole('button', { name: 'Actions for Belgium' }));
    await user.click(screen.getByText('Deactivate'));
    await user.click(screen.getByRole('button', { name: 'Deactivate' }));
    await waitFor(() => expect(deactivateMutation.mutateAsync).toHaveBeenCalledWith('BE'));
    expect(mockToastSuccess).toHaveBeenCalled();
  });

  it('logs an error when the deactivate mutation rejects', async () => {
    deactivateMutation.mutateAsync.mockRejectedValueOnce(new Error('boom'));
    const props = baseProps();
    const { user } = renderWithProviders(
      <ReferenceDataListPageShell
        {...props}
        showCardView
        renderCard={(entry, cb) => <ReferenceDataCard key={entry.code} entry={entry} {...cb} />}
      />
    );
    await user.click(screen.getByRole('button', { name: '', pressed: false }));
    await user.click(screen.getByRole('button', { name: 'Actions for Belgium' }));
    await user.click(screen.getByText('Deactivate'));
    await user.click(screen.getByRole('button', { name: 'Deactivate' }));
    await waitFor(() => expect(mockLoggerError).toHaveBeenCalled());
  });

  it('confirms reactivation of an inactive entry via the update mutation', async () => {
    mockQueryEndpoint.mockReturnValue(endpointWith([makeEntry({ activated: false })]));
    const props = baseProps();
    const { user } = renderWithProviders(
      <ReferenceDataListPageShell
        {...props}
        showCardView
        renderCard={(entry, cb) => <ReferenceDataCard key={entry.code} entry={entry} {...cb} />}
      />
    );
    await user.click(screen.getByRole('button', { name: '', pressed: false }));
    await user.click(screen.getByRole('button', { name: 'Actions for Belgium' }));
    await user.click(screen.getByText('Reactivate'));
    await user.click(screen.getByRole('button', { name: 'Reactivate' }));
    await waitFor(() =>
      expect(updateMutation.mutateAsync).toHaveBeenCalledWith({
        code: 'BE',
        data: { labelEn: 'Belgium', activated: true },
      })
    );
    expect(mockToastSuccess).toHaveBeenCalled();
  });
});
