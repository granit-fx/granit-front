import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import {
  ENTITIES_BASE_PATH,
  SAMPLE_ENTITY_NAME,
  createEntitiesHandlers,
} from '@granit/react-entities/testing';
import { buildEmptyQueryMeta, createQueryMetaHandler } from '@granit/react-query-engine/testing';
import { pagedResponse } from '@granit/testing/msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { EntityActionScopeProvider } from './entity-action-scope';
import { WorkspaceEntityPage } from './workspace-entity-page';

import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import type { RequestHandler } from 'msw';

// ---------------------------------------------------------------------------
// Route wiring
//
// The page reads `:workspace` / `:entity` via `useParams` and resolves its
// REST base path from the entity-discovery tree. `Granit.Parties.Party` is
// routable (discovery exposes `links.list = /api/v1/parties`);
// `Granit.Parties.Contact` is registered but has `links.list = null`, which
// drives the "not yet routable" guard.
// ---------------------------------------------------------------------------
const ROUTE_PATH = '/w/:workspace/:entity';
const PARTY_ROUTE = `/w/sales/${SAMPLE_ENTITY_NAME}`;
const CONTACT_ROUTE = '/w/sales/Granit.Parties.Contact';

const client = createApiClient({ baseURL: '' });

function withEntityRoute(initialEntry: string): Decorator {
  return function EntityRouteDecorator(Story) {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return (
      <QueryClientProvider client={queryClient}>
        <GranitClientProvider client={client}>
          <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
              <Route
                path={ROUTE_PATH}
                element={
                  <EntityActionScopeProvider>
                    <Story />
                  </EntityActionScopeProvider>
                }
              />
            </Routes>
          </MemoryRouter>
        </GranitClientProvider>
      </QueryClientProvider>
    );
  };
}

// ---------------------------------------------------------------------------
// MSW handlers
//
// `createEntitiesHandlers` serves discovery + per-entity manifest. The
// query-engine grid then hits `{list}/meta` (columns) and `{list}` (rows) at
// the discovered base path `/api/v1/parties`.
// ---------------------------------------------------------------------------
const PARTIES_BASE_PATH = '/api/v1/parties';

const partyMeta = buildEmptyQueryMeta({
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
  ],
  groupByFields: [{ name: 'kind', type: 'String' }],
  presetFilterGroups: [
    {
      name: 'g',
      label: 'Kind',
      presets: [{ name: 'customer', label: 'Customers', isDefault: false }],
    },
  ],
});

const partyRows: ReadonlyArray<Record<string, unknown>> = [
  { id: 'party-1', kind: 'Customer', number: 'PTY-0001' },
  { id: 'party-2', kind: 'Supplier', number: 'PTY-0002' },
  { id: 'party-3', kind: 'Customer', number: 'PTY-0003' },
];

function partiesListHandler(rows: ReadonlyArray<Record<string, unknown>>): RequestHandler {
  return http.get(PARTIES_BASE_PATH, () => pagedResponse(rows, rows.length));
}

const baseHandlers: RequestHandler[] = [
  ...createEntitiesHandlers(ENTITIES_BASE_PATH),
  createQueryMetaHandler(PARTIES_BASE_PATH, partyMeta),
];

const populatedHandlers: RequestHandler[] = [...baseHandlers, partiesListHandler(partyRows)];
const emptyHandlers: RequestHandler[] = [...baseHandlers, partiesListHandler([])];

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------
const meta = {
  title: 'Entities/WorkspaceEntityPage',
  component: WorkspaceEntityPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Route-level, 100% manifest-driven entity list page (`/w/:workspace/:entity`). Resolves its REST base path from entity discovery, builds columns from QueryMetadata and renders the manifest-declared layouts, selection bar and row actions.',
      },
    },
  },
  args: {
    // Storage-agnostic image slot for the gallery layout — the host injects it.
    renderImage: () => null,
  },
  decorators: [withEntityRoute(PARTY_ROUTE)],
} satisfies Meta<typeof WorkspaceEntityPage>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Loaded list view for a routable entity: create action, smart-filter bar,
 * sort / group-by selectors, preset chips and per-row open/edit actions,
 * populated from the mocked `/api/v1/parties` grid.
 */
export const Default: Story = {
  parameters: {
    msw: { handlers: populatedHandlers },
  },
};

/**
 * Same manifest, but the grid resolves to zero rows — the toolbar stays
 * mounted and the record count collapses to `0`.
 */
export const EmptyList: Story = {
  parameters: {
    msw: { handlers: emptyHandlers },
  },
};

/**
 * `Granit.Parties.Contact` is registered in the discovery tree but exposes no
 * list endpoint (`links.list = null`), so the page renders the
 * "not yet routable" guard instead of a grid.
 */
export const NotRoutable: Story = {
  decorators: [withEntityRoute(CONTACT_ROUTE)],
  parameters: {
    msw: { handlers: baseHandlers },
  },
};
