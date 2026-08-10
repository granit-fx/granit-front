import { GranitClientProvider } from '@granit/react-api-client';
import { QueryProvider } from '@granit/react-query-engine';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react';
import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  EntityKanbanView,
  fieldToColumnDefinition,
  makeCurrencyResolver,
} from './entity-kanban-view';

import type { ExtendedEntityManifest } from './manifest-extensions';
import type {
  EntityActionKind,
  EntityActionManifest,
  EntityFormFieldManifest,
  EntityKanbanCardActionManifest,
  EntityKanbanColumnManifest,
  EntityKanbanLayoutManifest,
  KanbanColor,
  KanbanColumnState,
} from '@granit/entities';
import type { EntityActionHandlers } from '@granit/react-entities';
import type { ReactNode } from 'react';

const BASE_PATH = '/api/v1/tasks';
const ENTITY_NAME = 'Granit.Tasks.Task';

const patchedIds: string[] = [];

const server = setupServer(
  http.patch(`http://localhost${BASE_PATH}/:id`, ({ params }) => {
    patchedIds.push(String(params.id));
    return HttpResponse.json({ id: params.id });
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  patchedIds.length = 0;
});
afterAll(() => server.close());

function field(
  propertyName: string,
  overrides: Partial<EntityFormFieldManifest> = {}
): EntityFormFieldManifest {
  return {
    propertyName,
    clrTypeName: 'String',
    component: 'text',
    config: null,
    labelKey: null,
    helpKey: null,
    order: 0,
    readOnly: false,
    visibleIf: null,
    lookup: null,
    provenance: null,
    ...overrides,
  };
}

function action(
  name: string,
  kind: EntityActionKind,
  overrides: Partial<EntityActionManifest> = {}
): EntityActionManifest {
  return {
    name,
    kind,
    displayKey: null,
    icon: null,
    order: 0,
    urlTemplate: null,
    httpMethod: null,
    confirmationKey: null,
    workflowTransitionName: null,
    contributorAssemblyName: null,
    ...overrides,
  };
}

function cardActionRef(name: string): EntityKanbanCardActionManifest {
  return { name, displayKey: null, icon: null, contributorAssemblyName: null };
}

function column(
  value: string,
  color: EntityKanbanColumnManifest['color'] = null,
  defaultState: KanbanColumnState = 'Open'
): EntityKanbanColumnManifest {
  return { value, color, defaultState };
}

interface LayoutOverrides {
  readonly titleProperty?: string | null;
  readonly fields?: readonly EntityFormFieldManifest[];
  readonly actions?: readonly EntityKanbanCardActionManifest[];
  readonly columns?: readonly EntityKanbanColumnManifest[];
  readonly groupByPropertyName?: string;
}

function makeLayout(overrides: LayoutOverrides = {}): EntityKanbanLayoutManifest {
  return {
    groupByPropertyName: overrides.groupByPropertyName ?? 'Status',
    groupByClrTypeName: 'String',
    card: {
      titleProperty: overrides.titleProperty === undefined ? 'Title' : overrides.titleProperty,
      fields: overrides.fields ?? [],
      relations: [],
      actions: overrides.actions ?? [],
    },
    columns: overrides.columns ?? [
      column('Todo', 'Gray'),
      column('InProgress', 'Blue'),
      column('Done', 'Green'),
    ],
  };
}

function makeManifest(options: {
  displayProperty?: string | null;
  identity?: boolean;
  actions?: readonly EntityActionManifest[];
}): ExtendedEntityManifest {
  const { displayProperty = 'Title', identity = true, actions = [] } = options;
  return {
    schemaVersion: 1,
    identity: identity
      ? {
          name: ENTITY_NAME,
          entityClrType: ENTITY_NAME,
          displayKey: null,
          icon: null,
          permissionGroup: 'Tasks.Tasks',
          displayProperty,
          subtitleProperty: null,
        }
      : null,
    permissions: null,
    forms: null,
    details: null,
    collections: null,
    relations: null,
    actions: [...actions],
  } as unknown as ExtendedEntityManifest;
}

const ROWS: readonly Readonly<Record<string, unknown>>[] = [
  { id: '1', title: 'Draft proposal', status: 'Todo', assignee: 'Ada' },
  { id: '2', title: 'Review designs', status: 'Todo', assignee: 'Alan' },
  { id: '3', title: 'Build prototype', status: 'InProgress', assignee: 'Grace' },
  { id: '4', title: 'Ship release', status: 'Done', assignee: 'Linus' },
];

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const apiClient = axios.create({ baseURL: 'http://localhost' });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <GranitClientProvider client={apiClient}>
        <QueryProvider config={{ basePath: BASE_PATH }}>{children}</QueryProvider>
      </GranitClientProvider>
    </QueryClientProvider>
  );
  return wrapper;
}

interface RenderOptions {
  readonly rows?: readonly Readonly<Record<string, unknown>>[];
  readonly canUpdate?: boolean;
  readonly layout?: EntityKanbanLayoutManifest;
  readonly manifest?: ExtendedEntityManifest;
  readonly locale?: string;
  readonly onCardClick?: (id: string) => void;
  readonly actionHandlers?: EntityActionHandlers;
}

function renderView(options: RenderOptions = {}) {
  const Wrapper = makeWrapper();
  const layout = options.layout ?? makeLayout();
  const manifest = options.manifest ?? makeManifest({});
  return render(
    <Wrapper>
      <EntityKanbanView
        entityName={ENTITY_NAME}
        manifest={manifest}
        layout={layout}
        rows={options.rows ?? ROWS}
        canUpdate={options.canUpdate ?? false}
        locale={options.locale ?? 'en-GB'}
        onCardClick={options.onCardClick}
        actionHandlers={options.actionHandlers}
      />
    </Wrapper>
  );
}

describe('EntityKanbanView', () => {
  it('renders the board with a column per declared value and bucketed cards', () => {
    const { container } = renderView();
    const board = container.querySelector('[data-slot="entity-kanban-view"]');
    expect(board).not.toBeNull();
    expect(board?.getAttribute('data-entity')).toBe(ENTITY_NAME);
    expect(board?.getAttribute('data-group-by')).toBe('Status');
    expect(board?.getAttribute('data-can-update')).toBeNull();

    const columns = Array.from(container.querySelectorAll('[data-slot="kanban-column"]'));
    expect(columns.map((c) => c.getAttribute('data-column-value'))).toEqual([
      'Todo',
      'InProgress',
      'Done',
    ]);
    const cards = container.querySelectorAll('[data-slot="kanban-card"]');
    expect(cards).toHaveLength(4);
  });

  it('carries the color token attribute and falls back for a colourless column', () => {
    const layout = makeLayout({ columns: [column('Todo', 'Blue'), column('Done', null)] });
    const { container } = renderView({ layout });
    const [colored, plain] = Array.from(container.querySelectorAll('[data-slot="kanban-column"]'));
    expect(colored?.getAttribute('data-color')).toBe('Blue');
    expect(colored?.className).toContain('bg-primary/10');
    expect(plain?.getAttribute('data-color')).toBeNull();
    expect(plain?.className).toContain('bg-muted/40');
  });

  it('synthesises columns for unknown group values and buckets nulls into ∅', () => {
    const rows = [
      { id: '1', title: 'A', status: 'Todo' },
      { id: '2', title: 'B', status: 'Archived' },
      { id: '3', title: 'C', status: null },
      { id: '4', title: 'D', status: 7 },
      // object group value coerces to the same ∅ fallback bucket as null
      { id: '5', title: 'E', status: { weird: true } },
    ];
    const { container } = renderView({ rows });
    const values = Array.from(container.querySelectorAll('[data-slot="kanban-column"]')).map((c) =>
      c.getAttribute('data-column-value')
    );
    // declared first, then synthesised (Archived, ∅, and numeric coerced to "7")
    expect(values).toEqual(['Todo', 'InProgress', 'Done', 'Archived', '∅', '7']);
    const emptyBucket = container.querySelector('[data-column-value="∅"]');
    expect(emptyBucket?.querySelectorAll('[data-slot="kanban-card"]')).toHaveLength(2);
  });

  it('sets data-can-update and makes cards draggable when canUpdate is true', () => {
    const { container } = renderView({ canUpdate: true });
    expect(
      container.querySelector('[data-slot="entity-kanban-view"]')?.getAttribute('data-can-update')
    ).toBe('true');
    const card = container.querySelector('[data-slot="kanban-card"]');
    expect(card?.getAttribute('draggable')).toBe('true');
    expect(card?.className).toContain('cursor-grab');
  });

  it('renders a column collapsed by default and toggles it open then closed', () => {
    const layout = makeLayout({
      columns: [column('Todo', 'Gray', 'Collapsed'), column('Done', 'Green')],
    });
    const { container } = renderView({ layout });
    const todo = () =>
      container.querySelector('[data-slot="kanban-column"][data-column-value="Todo"]');
    expect(todo()?.getAttribute('data-collapsed')).toBe('true');

    // collapsed body button expands (toggleColumn delete path)
    fireEvent.click(todo()?.querySelector('button') as HTMLButtonElement);
    expect(todo()?.getAttribute('data-collapsed')).toBeNull();
    expect(todo()?.querySelector('[data-slot="kanban-column-header"]')).not.toBeNull();

    // clicking the header button collapses again (toggleColumn add path)
    fireEvent.click(
      todo()?.querySelector('[data-slot="kanban-column-header"] button') as HTMLButtonElement
    );
    expect(todo()?.getAttribute('data-collapsed')).toBe('true');
  });

  it('drops Hidden columns from the board entirely', () => {
    const layout = makeLayout({
      columns: [column('Todo', 'Gray'), column('Secret', 'Red', 'Hidden'), column('Done', 'Green')],
    });
    const rows = [
      { id: '1', title: 'A', status: 'Todo' },
      { id: '2', title: 'B', status: 'Done' },
    ];
    const { container } = renderView({ layout, rows });
    const values = Array.from(container.querySelectorAll('[data-slot="kanban-column"]')).map((c) =>
      c.getAttribute('data-column-value')
    );
    expect(values).toEqual(['Todo', 'Done']);
  });

  it('uses the explicit card titleProperty for the card title', () => {
    const { container } = renderView({ layout: makeLayout({ titleProperty: 'Title' }) });
    const first = container.querySelector('[data-slot="kanban-card"]');
    expect(first?.textContent).toContain('Draft proposal');
  });

  it('falls back to identity.displayProperty when titleProperty is null', () => {
    const layout = makeLayout({ titleProperty: null });
    const manifest = makeManifest({ displayProperty: 'Assignee' });
    const { container } = renderView({ layout, manifest });
    const first = container.querySelector('[data-slot="kanban-card"]');
    expect(first?.textContent).toContain('Ada');
  });

  it('falls back to the "name" property when there is no identity', () => {
    const layout = makeLayout({ titleProperty: null });
    const manifest = makeManifest({ identity: false });
    const rows = [{ id: '9', name: 'Named row', status: 'Todo' }];
    const { container } = renderView({ layout, manifest, rows });
    expect(container.querySelector('[data-slot="kanban-card"]')?.textContent).toContain(
      'Named row'
    );
  });

  it('falls back to the row id when the title value is an object or missing', () => {
    const layout = makeLayout({ titleProperty: 'Title' });
    const rows = [
      { id: 'obj', title: { nested: true }, status: 'Todo' },
      { id: 'none', status: 'Todo' },
    ];
    const { container } = renderView({ layout, rows });
    const cards = Array.from(container.querySelectorAll('[data-slot="kanban-card"]'));
    expect(cards.map((c) => c.getAttribute('data-card-id'))).toEqual(['obj', 'none']);
    expect(cards[0]?.textContent).toContain('obj');
    expect(cards[1]?.textContent).toContain('none');
  });

  it('renders manifest body fields as a definition list, and none when empty', () => {
    const withFields = renderView({ layout: makeLayout({ fields: [field('Assignee')] }) });
    expect(withFields.container.querySelector('[data-slot="kanban-card"] dl')).not.toBeNull();
    expect(withFields.container.querySelector('[data-slot="kanban-card"] dd')?.textContent).toBe(
      'Ada'
    );

    const noFields = renderView({ layout: makeLayout({ fields: [] }) });
    expect(noFields.container.querySelector('[data-slot="kanban-card"] dl')).toBeNull();
  });

  it('renders a clickable card body button and fires onCardClick with the id', () => {
    const onCardClick = vi.fn();
    const { container } = renderView({ onCardClick });
    const body = container.querySelector(
      '[data-slot="kanban-card"] [data-slot="kanban-card-body"]'
    ) as HTMLButtonElement;
    expect(body.tagName).toBe('BUTTON');
    fireEvent.click(body);
    expect(onCardClick).toHaveBeenCalledWith('1');
  });

  it('renders a non-interactive body when no onCardClick is supplied', () => {
    const { container } = renderView({ onCardClick: undefined });
    expect(
      container.querySelector('[data-slot="kanban-card"] [data-slot="kanban-card-body"]')
    ).toBeNull();
  });

  it('handles drag start / over / drop to PATCH a moved card', async () => {
    const { container } = renderView({ canUpdate: true });
    const todoCard = container.querySelector('[data-card-id="1"]') as HTMLElement;
    const doneColumn = container.querySelector('[data-column-value="Done"]') as HTMLElement;

    const store: Record<string, string> = {};
    const dataTransfer = {
      setData: (type: string, val: string) => {
        store[type] = val;
      },
      getData: (type: string) => store[type] ?? '',
      effectAllowed: '',
      dropEffect: '',
    };

    fireEvent.dragStart(todoCard, { dataTransfer });
    expect(store['text/plain']).toBe('1');

    fireEvent.dragOver(doneColumn, { dataTransfer });
    expect(dataTransfer.dropEffect).toBe('move');

    fireEvent.drop(doneColumn, { dataTransfer });
    await waitFor(() => expect(patchedIds).toContain('1'));
  });

  it('ignores a drop with no dragged id and a drop back onto the same column', async () => {
    const { container } = renderView({ canUpdate: true });
    const todoColumn = container.querySelector('[data-column-value="Todo"]') as HTMLElement;
    const doneColumn = container.querySelector('[data-column-value="Done"]') as HTMLElement;

    // no id → early return
    fireEvent.drop(doneColumn, { dataTransfer: { getData: () => '' } });
    // drop card '1' (already Todo) back onto Todo → current === newValue → no-op
    fireEvent.drop(todoColumn, { dataTransfer: { getData: () => '1' } });

    await new Promise((r) => setTimeout(r, 20));
    expect(patchedIds).toHaveLength(0);
  });

  it('does not enable drop handlers or preventDefault on dragover when read-only', () => {
    const { container } = renderView({ canUpdate: false });
    const doneColumn = container.querySelector('[data-column-value="Done"]') as HTMLElement;
    const dataTransfer = { getData: () => '1', dropEffect: '' };
    // canUpdate false: handleDragOver returns before touching dropEffect
    fireEvent.dragOver(doneColumn, { dataTransfer });
    expect(dataTransfer.dropEffect).toBe('');
    // and onDrop is undefined, so a drop never mutates
    fireEvent.drop(doneColumn, { dataTransfer });
    expect(patchedIds).toHaveLength(0);
  });

  it('does not carry drag data when the card is not draggable', () => {
    const { container } = renderView({ canUpdate: false });
    const card = container.querySelector('[data-card-id="1"]') as HTMLElement;
    expect(card.getAttribute('draggable')).toBe('false');
    const store: Record<string, string> = {};
    fireEvent.dragStart(card, {
      dataTransfer: {
        setData: (t: string, v: string) => {
          store[t] = v;
        },
      },
    });
    expect(store['text/plain']).toBeUndefined();
  });

  it('renders one action button per resolved card action with the right icon per kind', () => {
    const actions = [
      action('dl', 'Download'),
      action('go', 'Navigate'),
      action('flow', 'WorkflowTransitionResponse'),
      action('drawer', 'OpenDrawer'),
      action('modal', 'OpenModal'),
      action('call', 'ApiCall'),
      action('del', 'ApiCall', { confirmationKey: 'Confirm.Delete' }),
      // referenced by name but NOT declared on manifest → filtered out
    ];
    const layout = makeLayout({
      actions: [
        cardActionRef('dl'),
        cardActionRef('go'),
        cardActionRef('flow'),
        cardActionRef('drawer'),
        cardActionRef('modal'),
        cardActionRef('call'),
        cardActionRef('del'),
        cardActionRef('missing'),
      ],
    });
    const manifest = makeManifest({ actions });
    const rows = [{ id: '1', title: 'Only', status: 'Todo' }];
    const { container } = renderView({ layout, manifest, rows });
    const buttons = Array.from(
      container.querySelectorAll('[data-slot="kanban-card-action"]')
    ) as HTMLElement[];
    expect(buttons.map((b) => b.getAttribute('data-action-kind'))).toEqual([
      'Download',
      'Navigate',
      'WorkflowTransitionResponse',
      'OpenDrawer',
      'OpenModal',
      'ApiCall',
      'ApiCall',
    ]);
    // confirmation ApiCall uses the trash icon; plain ApiCall the play icon
    const call = buttons.find((b) => b.getAttribute('data-action-name') === 'call');
    const del = buttons.find((b) => b.getAttribute('data-action-name') === 'del');
    expect(call?.querySelector('.lucide-play')).not.toBeNull();
    expect(del?.querySelector('.lucide-trash2')).not.toBeNull();
  });

  it('dispatches an action via the provided handler without triggering onCardClick', async () => {
    const navigate = vi.fn();
    const onCardClick = vi.fn();
    const layout = makeLayout({ actions: [cardActionRef('go')] });
    const manifest = makeManifest({ actions: [action('go', 'Navigate')] });
    const rows = [{ id: '42', title: 'Row', status: 'Todo' }];
    const { container } = renderView({
      layout,
      manifest,
      rows,
      onCardClick,
      actionHandlers: { navigate },
    });
    const btn = container.querySelector('[data-slot="kanban-card-action"]') as HTMLButtonElement;
    fireEvent.click(btn);
    await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1));
    expect(navigate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'go' }),
      '42',
      rows[0],
      expect.anything()
    );
    expect(onCardClick).not.toHaveBeenCalled();
  });

  it('surfaces a toast and re-enables the button when the action handler throws', async () => {
    const navigate = vi.fn().mockRejectedValue(new Error('boom'));
    const layout = makeLayout({ actions: [cardActionRef('go')] });
    const manifest = makeManifest({ actions: [action('go', 'Navigate')] });
    const rows = [{ id: '5', title: 'Row', status: 'Todo' }];
    const { container } = renderView({
      layout,
      manifest,
      rows,
      actionHandlers: { navigate },
    });
    const btn = container.querySelector('[data-slot="kanban-card-action"]') as HTMLButtonElement;
    fireEvent.click(btn);
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    // finally { setPending(false) } re-enables the button
    await waitFor(() => expect(btn.disabled).toBe(false));
  });

  it('renders an empty board (columns with zero counts) when there are no rows', () => {
    const { container } = renderView({ rows: [] });
    expect(container.querySelectorAll('[data-slot="kanban-column"]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-slot="kanban-card"]')).toHaveLength(0);
  });

  it('tolerates a manifest with no actions array at all', () => {
    // `manifest.actions ?? []` — undefined actions must not throw.
    const manifest = {
      ...makeManifest({}),
      actions: undefined,
    } as unknown as ExtendedEntityManifest;
    const { container } = renderView({ manifest });
    expect(container.querySelectorAll('[data-slot="kanban-column"]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-slot="kanban-card"]')).toHaveLength(4);
  });

  it('falls back to the neutral tint for a colour outside the token map', () => {
    // `COLUMN_COLOR_CLASS[color] ?? FALLBACK_COLUMN_CLASS` — unknown colour value.
    const layout = makeLayout({ columns: [column('Todo', 'Magenta' as KanbanColor)] });
    const { container } = renderView({ layout });
    const col = container.querySelector('[data-column-value="Todo"]');
    expect(col?.getAttribute('data-color')).toBe('Magenta');
    expect(col?.className).toContain('bg-muted/40');
  });

  it('resolves the dragged card by its PascalCase Id key when lowercase id is absent', async () => {
    // `row.id ?? row.Id` on the card (id/key) AND in the drop lookup.
    const rows = [{ Id: 'cap-1', title: 'Capitalised', status: 'Todo' }];
    const { container } = renderView({ rows, canUpdate: true });
    const card = container.querySelector('[data-card-id="cap-1"]') as HTMLElement;
    expect(card).not.toBeNull();
    const doneColumn = container.querySelector('[data-column-value="Done"]') as HTMLElement;

    const store: Record<string, string> = {};
    const dataTransfer = {
      setData: (type: string, val: string) => {
        store[type] = val;
      },
      getData: (type: string) => store[type] ?? '',
      effectAllowed: '',
      dropEffect: '',
    };
    fireEvent.dragStart(card, { dataTransfer });
    expect(store['text/plain']).toBe('cap-1');
    fireEvent.drop(doneColumn, { dataTransfer });
    await waitFor(() => expect(patchedIds).toContain('cap-1'));
  });

  it('patches an unknown dragged id (row not in the current rows) as a move from no column', async () => {
    // handleDrop: `row ? toScalarString(row[groupByJsonKey]) : ''` — the else branch.
    const { container } = renderView({ canUpdate: true });
    const doneColumn = container.querySelector('[data-column-value="Done"]') as HTMLElement;
    // id is present but matches no row → current resolves to '' → '' !== 'Done' → mutate
    fireEvent.drop(doneColumn, { dataTransfer: { getData: () => 'ghost' } });
    await waitFor(() => expect(patchedIds).toContain('ghost'));
  });

  it('optimistically patches the seeded list cache, touching only the matching row', async () => {
    // Drives the `optimistic.patchRow` closure: `r.id ?? r.Id` and the
    // matched/unmatched sides of the row-id ternary against the cached list.
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const listKey = ['api', 'v1', 'tasks', 'list'];
    queryClient.setQueryData(listKey, {
      items: [
        { id: 'match', title: 'Matches', status: 'Todo' },
        { Id: 'other', title: 'Untouched', status: 'Todo' },
      ],
    });
    const apiClient = axios.create({ baseURL: 'http://localhost' });
    const rows = [{ id: 'match', title: 'Matches', status: 'Todo' }];
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <GranitClientProvider client={apiClient}>
          <QueryProvider config={{ basePath: BASE_PATH }}>
            <EntityKanbanView
              entityName={ENTITY_NAME}
              manifest={makeManifest({})}
              layout={makeLayout()}
              rows={rows}
              canUpdate
              locale="en-GB"
            />
          </QueryProvider>
        </GranitClientProvider>
      </QueryClientProvider>
    );

    const card = container.querySelector('[data-card-id="match"]') as HTMLElement;
    const doneColumn = container.querySelector('[data-column-value="Done"]') as HTMLElement;
    const store: Record<string, string> = {};
    const dataTransfer = {
      setData: (type: string, val: string) => {
        store[type] = val;
      },
      getData: (type: string) => store[type] ?? '',
      effectAllowed: '',
      dropEffect: '',
    };
    fireEvent.dragStart(card, { dataTransfer });
    fireEvent.drop(doneColumn, { dataTransfer });

    await waitFor(() => expect(patchedIds).toContain('match'));
    const patched = queryClient.getQueryData(listKey) as {
      readonly items: readonly Readonly<Record<string, unknown>>[];
    };
    expect(patched.items[0]?.status).toBe('Done');
    expect(patched.items[1]?.status).toBe('Todo');
  });

  it('ignores a second action click while the first dispatch is still pending', async () => {
    // `if (pending) return` guard in the action button handler.
    let release!: () => void;
    const navigate = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        })
    );
    const layout = makeLayout({ actions: [cardActionRef('go')] });
    const manifest = makeManifest({ actions: [action('go', 'Navigate')] });
    const rows = [{ id: '7', title: 'Row', status: 'Todo' }];
    const { container } = renderView({ layout, manifest, rows, actionHandlers: { navigate } });
    const btn = container.querySelector('[data-slot="kanban-card-action"]') as HTMLButtonElement;

    fireEvent.click(btn);
    await waitFor(() => expect(btn.disabled).toBe(true));
    // second click while pending must not dispatch again
    fireEvent.click(btn);
    release();
    await waitFor(() => expect(btn.disabled).toBe(false));
    expect(navigate).toHaveBeenCalledTimes(1);
  });
});

describe('fieldToColumnDefinition', () => {
  it('camelizes the property name and forwards the valueKind for non-money components', () => {
    const def = fieldToColumnDefinition(field('DueDate', { valueKind: 'Date' }));
    expect(def.name).toBe('dueDate');
    expect(def.valueKind).toBe('Date');
  });

  it('keeps an empty property name empty and suppresses valueKind for the money component', () => {
    const def = fieldToColumnDefinition(field('', { component: 'money', valueKind: 'Currency' }));
    expect(def.name).toBe('');
    expect(def.valueKind).toBeUndefined();
  });
});

describe('makeCurrencyResolver', () => {
  it('prefers the configured currency property, then the row currency, then EUR', () => {
    const withProperty = makeCurrencyResolver(
      field('Amount', { config: { currencyProperty: 'CurrencyCode' } })
    );
    expect(withProperty({ currencyCode: 'USD', currency: 'GBP' })).toBe('USD');

    const withoutProperty = makeCurrencyResolver(field('Amount'));
    expect(withoutProperty({ currency: 'GBP' })).toBe('GBP');
    expect(withoutProperty({})).toBe('EUR');
  });
});
