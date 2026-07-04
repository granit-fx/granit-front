import { GranitClientProvider } from '@granit/react-api-client';
import {
  ENTITIES_BASE_PATH,
  SAMPLE_ENTITY_NAME,
  createEntitiesHandlers,
  mockEntityManifest,
} from '@granit/react-entities/testing';
import { buildEmptyQueryMeta } from '@granit/react-query-engine/testing';
import { toast, TooltipProvider } from '@granit/react-ui';
import { createMswServer } from '@granit/testing/msw-server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import i18next from 'i18next';
import { http, HttpResponse } from 'msw';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EntityActionScopeProvider } from './entity-action-scope';
import { WorkspaceEntityPage } from './workspace-entity-page';

import type { GalleryRenderImage } from './entity-gallery-view';
import type {
  EntityActionManifest,
  EntityListLayoutManifest,
  EntityManifestResponse,
  EntitySelectionActionManifest,
} from '@granit/entities';
import type { QueryMetadata } from '@granit/query-engine';
import type { EntitySelectionBarRecap } from '@granit/react-entities';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Mutable query-engine state shared with the vi.mock factory below. Each test
// mutates `qe.*` before rendering; the mocked hooks read the current value.
// ---------------------------------------------------------------------------
const qe = vi.hoisted(() => ({
  meta: { data: undefined as unknown, isLoading: false },
  endpoint: {
    params: {
      page: 1,
      pageSize: 20,
      sort: [] as unknown[],
      groupBy: undefined as string | undefined,
    },
    query: {
      data: { items: [] as ReadonlyArray<Record<string, unknown>>, totalCount: 0 },
      isLoading: false,
      isFetching: false,
    } as {
      data: { items: ReadonlyArray<Record<string, unknown>>; totalCount: number } | undefined;
      isLoading: boolean;
      isFetching: boolean;
    },
    groupedQuery: {
      data: { groups: [] as unknown[], totalCount: 0 } as
        { groups: unknown[]; totalCount: number } | undefined,
      isLoading: false,
    },
    isGrouped: false,
    setPage: vi.fn(),
    setPageSize: vi.fn(),
    toggleSort: vi.fn(),
    setGroupBy: vi.fn(),
    setSearch: vi.fn(),
  },
  smartFilter: {
    filters: [] as unknown[],
    search: '',
    presets: {} as Record<string, unknown>,
    quickFilters: [] as unknown[],
    tokens: [] as unknown[],
    setSearch: vi.fn(),
    addFilter: vi.fn(),
    removeFilter: vi.fn(),
    clearFilters: vi.fn(),
    removeToken: vi.fn(),
  },
}));

vi.mock('@granit/react-query-engine', () => ({
  QueryProvider: ({ children }: { readonly children: ReactNode }) => children,
  QueryEndpointStateProvider: ({ children }: { readonly children: ReactNode }) => children,
  useQueryMeta: () => qe.meta,
  useQueryEndpoint: () => qe.endpoint,
  useSmartFilter: () => qe.smartFilter,
  formatCell: ({
    row,
    column,
    currencyResolver,
  }: {
    readonly row: Record<string, unknown>;
    readonly column: { readonly name: string };
    readonly currencyResolver?: (row: Readonly<Record<string, unknown>>) => string;
  }) => {
    // Exercise the page's currency-resolver so its fallback chain is covered.
    currencyResolver?.(row);
    return String(row[column.name] ?? '');
  },
}));

vi.mock('@granit/react-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useOperatorLabels: () => ({}),
    useSmartFilterSync: () => ({ handlePresetToggle: vi.fn() }),
  };
});

// Stub the heavy alternate-layout renderers so the switch branches in
// `renderLayoutBody` are exercised without dragging in their own data layers.
vi.mock('./entity-calendar-view', () => ({
  EntityCalendarView: () => <div data-testid="calendar-view" />,
}));
vi.mock('./entity-kanban-view', () => ({
  EntityKanbanView: () => <div data-testid="kanban-view" />,
}));
vi.mock('./entity-gallery-view', () => ({
  EntityGalleryView: () => <div data-testid="gallery-view" />,
}));

// Replace the page-header + selection-bar with markers. The bar exposes buttons
// that invoke the `confirm` / `onComplete` callbacks the page wires up, so the
// recap-toast and confirm-dialog branches are drivable from the test.
vi.mock('@granit/react-entities', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  const action: EntitySelectionActionManifest = {
    name: 'Approve',
    displayKey: 'Act.Approve',
    icon: null,
    confirmationKey: 'Act.Confirm',
    contributorAssemblyName: null,
  };
  const actionNoKey: EntitySelectionActionManifest = { ...action, confirmationKey: null };
  const actionNoDisplay: EntitySelectionActionManifest = { ...action, displayKey: null };
  const navTemplated: EntityActionManifest = {
    name: 'Go',
    kind: 'Navigate',
    displayKey: null,
    icon: null,
    order: 0,
    urlTemplate: '/w/x/{id}',
    httpMethod: null,
    confirmationKey: null,
    workflowTransitionName: null,
    contributorAssemblyName: null,
  };
  const navPlain: EntityActionManifest = { ...navTemplated, urlTemplate: '/w/plain' };
  const navNoUrl: EntityActionManifest = { ...navTemplated, urlTemplate: null };
  return {
    ...actual,
    EntityListPageHeader: () => <div data-testid="list-header" />,
    EntitySelectionBar: (props: {
      readonly confirm: (
        a: EntitySelectionActionManifest,
        ids: ReadonlySet<string>
      ) => Promise<boolean>;
      readonly onComplete: (
        a: EntitySelectionActionManifest,
        recap: EntitySelectionBarRecap
      ) => void;
      readonly handlers?: {
        readonly navigate?: (action: EntityActionManifest, rowId: string | null) => void;
      };
    }) => (
      <div data-testid="selection-bar">
        <button
          type="button"
          data-testid="bar-success-nokey"
          onClick={() =>
            props.onComplete(actionNoDisplay, { succeeded: ['a'], failed: [], parents: undefined })
          }
        >
          success-nokey
        </button>
        <button
          type="button"
          data-testid="bar-nav-id"
          onClick={() => props.handlers?.navigate?.(navTemplated, 'row-9')}
        >
          nav-id
        </button>
        <button
          type="button"
          data-testid="bar-nav-noid"
          onClick={() => props.handlers?.navigate?.(navPlain, null)}
        >
          nav-noid
        </button>
        <button
          type="button"
          data-testid="bar-nav-nourl"
          onClick={() => props.handlers?.navigate?.(navNoUrl, 'row-9')}
        >
          nav-nourl
        </button>
        <button
          type="button"
          data-testid="bar-confirm"
          onClick={() => {
            void props.confirm(action, new Set(['a', 'b']));
          }}
        >
          confirm
        </button>
        <button
          type="button"
          data-testid="bar-confirm-nokey"
          onClick={() => {
            void props.confirm(actionNoKey, new Set(['a']));
          }}
        >
          confirm-nokey
        </button>
        <button
          type="button"
          data-testid="bar-success"
          onClick={() =>
            props.onComplete(action, { succeeded: ['a', 'b'], failed: [], parents: undefined })
          }
        >
          success
        </button>
        <button
          type="button"
          data-testid="bar-fail"
          onClick={() =>
            props.onComplete(action, {
              succeeded: [],
              failed: [{ id: 'a', error: 'x' }],
              parents: [],
            })
          }
        >
          fail
        </button>
        <button
          type="button"
          data-testid="bar-partial"
          onClick={() =>
            props.onComplete(action, {
              succeeded: ['a'],
              failed: [{ id: 'b', error: 'y' }],
              parents: ['Granit.Parties.Party:123'],
            })
          }
        >
          partial
        </button>
      </div>
    ),
  };
});

vi.mock('@granit/react-ui', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
  };
});

// ---------------------------------------------------------------------------
// Fixtures & harness
// ---------------------------------------------------------------------------
const MANIFEST_URL = 'http://localhost/api/v1/entities/:name';

const server = createMswServer(
  { onUnhandledRequest: 'error' },
  ...createEntitiesHandlers(`http://localhost${ENTITIES_BASE_PATH}`)
);

const renderImage: GalleryRenderImage = () => null;

const i18n = i18next.createInstance();
void i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: { en: { translation: {} } },
  interpolation: { escapeValue: false },
});

function LocationProbe() {
  const loc = useLocation();
  return (
    <div data-testid="loc">
      {loc.pathname}
      {loc.search}
    </div>
  );
}

function renderPage(
  route = `/w/sales/${encodeURIComponent(SAMPLE_ENTITY_NAME)}`,
  path = '/w/:workspace/:entity'
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const apiClient = axios.create({ baseURL: 'http://localhost' });
  return render(
    <QueryClientProvider client={queryClient}>
      <GranitClientProvider client={apiClient}>
        <I18nextProvider i18n={i18n}>
          <TooltipProvider>
            <MemoryRouter initialEntries={[route]}>
              <LocationProbe />
              <Routes>
                <Route
                  path={path}
                  element={
                    <EntityActionScopeProvider>
                      <WorkspaceEntityPage renderImage={renderImage} />
                    </EntityActionScopeProvider>
                  }
                />
              </Routes>
            </MemoryRouter>
          </TooltipProvider>
        </I18nextProvider>
      </GranitClientProvider>
    </QueryClientProvider>
  );
}

function fullMeta(overrides?: Partial<QueryMetadata>): QueryMetadata {
  return buildEmptyQueryMeta({
    columns: [
      {
        name: 'kind',
        label: 'Kind',
        type: 'String',
        order: 0,
        isSortable: true,
        isFilterable: true,
        isVisible: true,
      },
      {
        name: 'number',
        label: 'Number',
        type: 'String',
        order: 1,
        isSortable: true,
        isFilterable: true,
        isVisible: true,
      },
      {
        name: 'secret',
        label: 'Secret',
        type: 'String',
        order: 2,
        isSortable: false,
        isFilterable: false,
        isVisible: false,
      },
    ],
    groupByFields: [{ name: 'kind', type: 'String' }],
    presetFilterGroups: [
      { name: 'g', label: 'Group', presets: [{ name: 'p', label: 'Preset', isDefault: false }] },
    ],
    ...overrides,
  });
}

function resetEndpoint() {
  qe.endpoint.params = { page: 1, pageSize: 20, sort: [], groupBy: undefined };
  qe.endpoint.query = {
    data: {
      items: [
        { id: 'row-1', kind: 'A', number: 'INV-1' },
        { id: 'row-2', kind: 'B', number: 'INV-2' },
        { kind: 'C', number: 'no-id' },
      ],
      totalCount: 3,
    },
    isLoading: false,
    isFetching: false,
  };
  qe.endpoint.groupedQuery = { data: { groups: [], totalCount: 0 }, isLoading: false };
  qe.endpoint.isGrouped = false;
}

function buildManifest(over: {
  readonly permissions?: EntityManifestResponse['permissions'];
  readonly selectionActions?: readonly EntitySelectionActionManifest[];
  readonly listLayouts?: readonly EntityListLayoutManifest[];
}): EntityManifestResponse {
  const c = mockEntityManifest.collections;
  return {
    ...mockEntityManifest,
    permissions: over.permissions ?? mockEntityManifest.permissions,
    collections: c
      ? {
          ...c,
          selectionActions: over.selectionActions ?? c.selectionActions,
          listLayouts: over.listLayouts ?? c.listLayouts,
        }
      : c,
  };
}

function serveManifest(manifest: EntityManifestResponse) {
  server.use(
    http.get(MANIFEST_URL, ({ params }) =>
      typeof params.name === 'string' && params.name.length > 0
        ? HttpResponse.json(manifest, { headers: { ETag: '"custom"' } })
        : new HttpResponse(null, { status: 404 })
    )
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  qe.meta = { data: fullMeta(), isLoading: false };
  resetEndpoint();
  qe.smartFilter = {
    filters: [],
    search: '',
    presets: {},
    quickFilters: [],
    tokens: [],
    setSearch: vi.fn(),
    addFilter: vi.fn(),
    removeFilter: vi.fn(),
    clearFilters: vi.fn(),
    removeToken: vi.fn(),
  };
});

afterEach(() => {
  vi.mocked(toast.success).mockClear();
});

const calendarCfg = {
  startPropertyName: 'start',
  endPropertyName: null,
  titlePropertyName: null,
  colorByPropertyName: null,
  actions: [],
};
const kanbanCfg = {
  groupByPropertyName: 'kind',
  groupByClrTypeName: 'String',
  card: { titleProperty: null, fields: [], relations: [], actions: [] },
  columns: [],
};
const galleryCfg = {
  imagePropertyName: 'image',
  titlePropertyName: null,
  subtitlePropertyName: null,
  groupByPropertyName: null,
  cardSize: 'Medium' as const,
  actions: [],
};

// ---------------------------------------------------------------------------
// Early-return branches on the exported page
// ---------------------------------------------------------------------------
describe('WorkspaceEntityPage — guards', () => {
  it('renders the missing-parameter view when route params are absent', async () => {
    renderPage('/plain', '/plain');
    expect(await screen.findByText('Missing entity parameter')).toBeInTheDocument();
    expect(screen.queryByTestId('selection-bar')).toBeNull();
  });

  it('renders the loading view while manifest/discovery are pending', () => {
    const { container } = renderPage();
    // Synchronous first paint: queries still in flight → skeleton, no content.
    expect(container.querySelector('[data-slot="skeleton"]')).not.toBeNull();
    expect(screen.queryByTestId('selection-bar')).toBeNull();
  });

  it('renders the not-found view when the manifest request errors', async () => {
    server.use(http.get(MANIFEST_URL, () => new HttpResponse(null, { status: 500 })));
    renderPage();
    expect(await screen.findByText('Entity not found')).toBeInTheDocument();
  });

  it('renders the not-routable view when discovery exposes no list endpoint', async () => {
    renderPage('/w/sales/Granit.Parties.Contact');
    expect(await screen.findByText('Entity is not yet routable')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Populated List view + toolbar gating
// ---------------------------------------------------------------------------
describe('WorkspaceEntityPage — list view', () => {
  it('mounts the manifest-driven list with create action, toolbar and row actions', async () => {
    renderPage();
    await screen.findByTestId('selection-bar');

    expect(document.querySelector('[data-slot="workspace-entity-create"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="smart-filter-bar"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="sort-selector"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="group-by-selector"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="filter-presets"]')).not.toBeNull();

    // Two rows carry an id (the third is id-less) → two open + two edit buttons.
    expect(screen.getAllByLabelText('Open')).toHaveLength(2);
    expect(screen.getAllByLabelText('Edit')).toHaveLength(2);

    const count = document.querySelector('.ml-auto');
    expect(count?.textContent).toContain('3');
  });

  it('shows the spinner while the query metadata is loading', async () => {
    qe.meta = { data: undefined, isLoading: true };
    renderPage();
    await waitFor(() =>
      expect(document.querySelector('[data-slot="workspace-entity-loading"]')).not.toBeNull()
    );
    expect(screen.queryByTestId('selection-bar')).toBeNull();
  });

  it('hides create and edit actions when permissions deny them', async () => {
    serveManifest(
      buildManifest({
        permissions: {
          canRead: true,
          canCreate: false,
          canUpdate: false,
          canDelete: false,
          canManage: false,
          canExecute: false,
        },
      })
    );
    renderPage();
    await screen.findByTestId('selection-bar');

    expect(document.querySelector('[data-slot="workspace-entity-create"]')).toBeNull();
    expect(screen.queryByLabelText('Edit')).toBeNull();
    // Open (view) stays available regardless of update permission.
    expect(screen.getAllByLabelText('Open')).toHaveLength(2);
  });

  it('reads the grouped total count and forwards groups to the table', async () => {
    qe.endpoint.isGrouped = true;
    qe.endpoint.groupedQuery = { data: { groups: [], totalCount: 7 }, isLoading: false };
    renderPage();
    await screen.findByTestId('selection-bar');

    expect(document.querySelector('.ml-auto')?.textContent).toContain('7');
  });

  it('omits the group-by and preset controls when the metadata declares none', async () => {
    qe.meta = { data: fullMeta({ groupByFields: [], presetFilterGroups: [] }), isLoading: false };
    renderPage();
    await screen.findByTestId('selection-bar');

    expect(document.querySelector('[data-slot="sort-selector"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="group-by-selector"]')).toBeNull();
    expect(document.querySelector('[data-slot="filter-presets"]')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Selection column (resolveSelectAllChecked + toggle/clear)
// ---------------------------------------------------------------------------
describe('WorkspaceEntityPage — selection column', () => {
  it('drives select-all, per-row toggle and clear through the checkbox states', async () => {
    const user = userEvent.setup();
    serveManifest(
      buildManifest({
        selectionActions: [
          {
            name: 'Approve',
            displayKey: 'Act.Approve',
            icon: null,
            confirmationKey: null,
            contributorAssemblyName: null,
          },
        ],
      })
    );
    renderPage();
    await screen.findByTestId('selection-bar');

    const selectAll = () => screen.getByLabelText('Select all');
    // 0 selected → unchecked
    expect(selectAll()).toHaveAttribute('data-state', 'unchecked');
    expect(screen.getAllByLabelText('Select row')).toHaveLength(2);

    // Select all → 2/2 → checked
    await user.click(selectAll());
    await waitFor(() => expect(selectAll()).toHaveAttribute('data-state', 'checked'));

    // Toggle one row off → 1/2 → indeterminate
    await user.click(screen.getAllByLabelText('Select row')[0] as HTMLElement);
    await waitFor(() => expect(selectAll()).toHaveAttribute('data-state', 'indeterminate'));

    // From indeterminate, clicking re-selects everything → checked
    await user.click(selectAll());
    await waitFor(() => expect(selectAll()).toHaveAttribute('data-state', 'checked'));

    // From checked, clicking clears the selection → unchecked
    await user.click(selectAll());
    await waitFor(() => expect(selectAll()).toHaveAttribute('data-state', 'unchecked'));
  });
});

// ---------------------------------------------------------------------------
// Alternate layouts (renderLayoutBody switch + view-kind gating)
// ---------------------------------------------------------------------------
describe('WorkspaceEntityPage — layouts', () => {
  it('switches between list, kanban, calendar and gallery renderers', async () => {
    const user = userEvent.setup();
    serveManifest(
      buildManifest({
        listLayouts: [
          { kind: 'List', isDefault: true, kanban: null, calendar: null, gallery: null },
          { kind: 'Kanban', isDefault: false, kanban: kanbanCfg, calendar: null, gallery: null },
          {
            kind: 'Calendar',
            isDefault: false,
            kanban: null,
            calendar: calendarCfg,
            gallery: null,
          },
          { kind: 'Gallery', isDefault: false, kanban: null, calendar: null, gallery: galleryCfg },
        ],
      })
    );
    renderPage();
    await screen.findByTestId('selection-bar');

    const tabs = screen.getByRole('tablist');

    // Calendar → view mounts, sort + group-by suppressed.
    await user.click(within(tabs).getByRole('tab', { name: /Calendar/ }));
    await screen.findByTestId('calendar-view');
    expect(document.querySelector('[data-slot="sort-selector"]')).toBeNull();
    expect(document.querySelector('[data-slot="group-by-selector"]')).toBeNull();

    // Kanban → view mounts, sort back but group-by still suppressed.
    await user.click(within(tabs).getByRole('tab', { name: /Kanban/ }));
    await screen.findByTestId('kanban-view');
    expect(document.querySelector('[data-slot="sort-selector"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="group-by-selector"]')).toBeNull();

    // Gallery → view mounts, all controls visible.
    await user.click(within(tabs).getByRole('tab', { name: /Gallery/ }));
    await screen.findByTestId('gallery-view');
    expect(document.querySelector('[data-slot="sort-selector"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="group-by-selector"]')).not.toBeNull();
  });

  it('renders nothing for a layout whose per-kind config is null', async () => {
    const user = userEvent.setup();
    serveManifest(
      buildManifest({
        listLayouts: [
          { kind: 'List', isDefault: true, kanban: null, calendar: null, gallery: null },
          { kind: 'Kanban', isDefault: false, kanban: null, calendar: null, gallery: null },
          { kind: 'Calendar', isDefault: false, kanban: null, calendar: null, gallery: null },
          { kind: 'Gallery', isDefault: false, kanban: null, calendar: null, gallery: null },
        ],
      })
    );
    renderPage();
    await screen.findByTestId('selection-bar');
    const tabs = screen.getByRole('tablist');

    await user.click(within(tabs).getByRole('tab', { name: /Calendar/ }));
    expect(screen.queryByTestId('calendar-view')).toBeNull();

    await user.click(within(tabs).getByRole('tab', { name: /Kanban/ }));
    expect(screen.queryByTestId('kanban-view')).toBeNull();

    await user.click(within(tabs).getByRole('tab', { name: /Gallery/ }));
    expect(screen.queryByTestId('gallery-view')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Bulk recap toasts + confirm dialog
// ---------------------------------------------------------------------------
describe('WorkspaceEntityPage — bulk recap & confirmation', () => {
  it('reports an all-succeeded recap as a success toast', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByTestId('bar-success'));
    expect(vi.mocked(toast.success)).toHaveBeenCalledTimes(1);
  });

  it('reports an all-failed recap as an error toast', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByTestId('bar-fail'));
    expect(vi.mocked(toast.error)).toHaveBeenCalledTimes(1);
  });

  it('reports a partial recap as a warning toast and invalidates impacted parents', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByTestId('bar-partial'));
    expect(vi.mocked(toast.warning)).toHaveBeenCalledTimes(1);
  });

  it('opens the confirm dialog and resolves on confirm', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByTestId('bar-confirm'));

    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
  });

  it('closes the confirm dialog on cancel', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByTestId('bar-confirm'));

    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
  });

  it('opens the confirm dialog for an action without a confirmation key', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByTestId('bar-confirm-nokey'));
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Navigation callbacks
// ---------------------------------------------------------------------------
describe('WorkspaceEntityPage — navigation', () => {
  it('navigates to the create route from the create button', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByTestId('selection-bar');
    await user.click(
      document.querySelector('[data-slot="workspace-entity-create"]') as HTMLElement
    );
    expect(screen.getByTestId('loc').textContent).toContain('/new');
  });

  it('navigates to the edit route from a row edit button', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByTestId('selection-bar');
    await user.click(screen.getAllByLabelText('Edit')[0] as HTMLElement);
    expect(screen.getByTestId('loc').textContent).toContain('/row-1/edit');
  });

  it('opens a side-peek (peek query param) from a row open button', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByTestId('selection-bar');
    await user.click(screen.getAllByLabelText('Open')[0] as HTMLElement);
    await waitFor(() => expect(screen.getByTestId('loc').textContent).toContain('peek'));
  });

  it('routes an in-app navigate action with row-id substitution', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByTestId('bar-nav-id'));
    expect(screen.getByTestId('loc').textContent).toContain('/w/x/row-9');
  });

  it('routes an in-app navigate action that carries no row id', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByTestId('bar-nav-noid'));
    expect(screen.getByTestId('loc').textContent).toContain('/w/plain');
  });

  it('ignores a navigate action whose url template is absent', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByTestId('selection-bar');
    const before = screen.getByTestId('loc').textContent;
    await user.click(screen.getByTestId('bar-nav-nourl'));
    expect(screen.getByTestId('loc').textContent).toBe(before);
  });
});

// ---------------------------------------------------------------------------
// Manifest-shape fallbacks (absent optional facets / null field component)
// ---------------------------------------------------------------------------
describe('WorkspaceEntityPage — manifest fallbacks', () => {
  it('renders when every optional manifest facet is absent', async () => {
    const bare: EntityManifestResponse = {
      schemaVersion: 1,
      identity: null,
      permissions: null,
      forms: null,
      details: null,
      collections: null,
      relations: null,
      actions: null,
      activities: null,
    };
    serveManifest(bare);
    renderPage();
    await screen.findByTestId('selection-bar');

    // permissions null → no create, no edit; identity null → title falls
    // back to the entity name.
    expect(document.querySelector('[data-slot="workspace-entity-create"]')).toBeNull();
    expect(screen.queryByLabelText('Edit')).toBeNull();
    expect(screen.getByRole('heading', { name: SAMPLE_ENTITY_NAME })).toBeInTheDocument();
  });

  it('skips form fields that declare no component when collecting hints', async () => {
    const manifest: EntityManifestResponse = {
      ...mockEntityManifest,
      forms: [
        {
          name: 'default',
          customizable: true,
          hiddenByOverride: null,
          sections: [
            {
              key: 's',
              labelKey: null,
              order: 0,
              collapsedByDefault: false,
              ownedCollection: null,
              fields: [
                {
                  propertyName: 'NoComp',
                  clrTypeName: 'String',
                  component: null,
                  config: null,
                  labelKey: null,
                  helpKey: null,
                  order: 0,
                  readOnly: false,
                  visibleIf: null,
                  lookup: null,
                  provenance: null,
                },
              ],
            },
          ],
        },
      ],
    };
    serveManifest(manifest);
    renderPage();
    await screen.findByTestId('selection-bar');
    expect(screen.getAllByLabelText('Open')).toHaveLength(2);
  });

  it('derives the active kind from the first layout when none is default', async () => {
    serveManifest(
      buildManifest({
        listLayouts: [
          { kind: 'Kanban', isDefault: false, kanban: kanbanCfg, calendar: null, gallery: null },
        ],
      })
    );
    renderPage();
    await screen.findByTestId('kanban-view');
  });
});

// ---------------------------------------------------------------------------
// Empty / undefined query result sets (nullish fallbacks)
// ---------------------------------------------------------------------------
describe('WorkspaceEntityPage — empty result sets', () => {
  it('falls back to an empty list and zero total when the query result is undefined', async () => {
    qe.endpoint.query = { data: undefined, isLoading: false, isFetching: false };
    renderPage();
    await screen.findByTestId('selection-bar');
    expect(document.querySelector('.ml-auto')?.textContent).toContain('0');
    expect(screen.queryByLabelText('Open')).toBeNull();
  });

  it('defaults the grouped total to zero when the grouped result is undefined', async () => {
    qe.endpoint.isGrouped = true;
    qe.endpoint.groupedQuery = { data: undefined, isLoading: false };
    renderPage();
    await screen.findByTestId('selection-bar');
    expect(document.querySelector('.ml-auto')?.textContent).toContain('0');
  });

  it('passes an empty row set to the kanban view when the query result is undefined', async () => {
    qe.endpoint.query = { data: undefined, isLoading: false, isFetching: false };
    serveManifest(
      buildManifest({
        listLayouts: [
          { kind: 'Kanban', isDefault: true, kanban: kanbanCfg, calendar: null, gallery: null },
        ],
      })
    );
    renderPage();
    await screen.findByTestId('kanban-view');
  });
});

// ---------------------------------------------------------------------------
// Currency resolver + recap without a display key
// ---------------------------------------------------------------------------
describe('WorkspaceEntityPage — cell + recap fallbacks', () => {
  it('resolves a row currency from explicit, default and hard-coded fallbacks', async () => {
    qe.endpoint.query = {
      data: {
        items: [
          { id: 'c1', kind: 'A', number: 'N1', currency: 'USD' },
          { id: 'c2', kind: 'B', number: 'N2', defaultCurrency: 'GBP' },
          { id: 'c3', kind: 'C', number: 'N3' },
        ],
        totalCount: 3,
      },
      isLoading: false,
      isFetching: false,
    };
    renderPage();
    await screen.findByTestId('selection-bar');
    expect(screen.getAllByLabelText('Open')).toHaveLength(3);
  });

  it('uses the action name in the recap toast when it has no display key', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByTestId('bar-success-nokey'));
    expect(vi.mocked(toast.success)).toHaveBeenCalledTimes(1);
  });
});
