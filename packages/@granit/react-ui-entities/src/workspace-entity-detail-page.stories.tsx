import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { EntityRendererProvider } from '@granit/react-entities';
import {
  ENTITIES_BASE_PATH,
  SAMPLE_ENTITY_ID,
  SAMPLE_ENTITY_NAME,
  createEntitiesHandlers,
} from '@granit/react-entities/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { delay, http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router';

import { WorkspaceEntityDetailPage } from './workspace-entity-detail-page';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentType } from 'react';

// ---------------------------------------------------------------------------
// Harness — mirrors `workspace-entity-detail-page.test.tsx`. The detail body
// (`<EntityDetailContent />`) drives discovery, the per-entity manifest,
// relation aggregates and the single-row read; reuse the shared entities
// handlers plus the row endpoint hanging off `links.list` (`/api/v1/parties`).
// Relative paths let the MSW addon match against the Storybook origin.
// ---------------------------------------------------------------------------

const ROW_BASE_PATH = '/api/v1/parties';

/** Raw camelCase wire row returned by `GET /api/v1/parties/{id}`. */
const ROW: Record<string, unknown> = { number: 'P-001', kind: 'Company' };

const mockApiClient = createApiClient({ baseURL: '' });

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function loadedHandlers() {
  return [
    ...createEntitiesHandlers(ENTITIES_BASE_PATH),
    http.get(`${ROW_BASE_PATH}/:id`, () => HttpResponse.json(ROW)),
  ];
}

// The route supplies `/w/:workspace/:entity/:id` params, exactly like the test.
const DETAIL_PATH = '/w/:workspace/:entity/:id';
const WORKSPACE = 'acme';
const detailEntry = `/w/${WORKSPACE}/${SAMPLE_ENTITY_NAME}/${SAMPLE_ENTITY_ID}`;

/**
 * Router decorator factory — mounts the page under a `<Route>` whose path
 * carries the params `useParams()` reads. Providers come from the meta
 * decorator, so this only owns the routing context.
 */
function routerDecorator(initialEntry: string, routePath: string) {
  return function RouterDecorator(Story: ComponentType) {
    return (
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path={routePath} element={<Story />} />
        </Routes>
      </MemoryRouter>
    );
  };
}

const meta = {
  title: 'Entities/WorkspaceEntityDetailPage',
  component: WorkspaceEntityDetailPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Workspace-scoped entity detail route (`/w/:workspace/:entity/:id`). Wraps `<EntityDetailContent />` in the unified `<EntityPageLayout />` shell (back button + comfortable width). Guards on the three route params; a missing one renders the missing-parameter shell.',
      },
    },
  },
  decorators: [
    (Story: ComponentType) => (
      <QueryClientProvider client={makeQueryClient()}>
        <GranitClientProvider client={mockApiClient}>
          <EntityRendererProvider>
            <Story />
          </EntityRendererProvider>
        </GranitClientProvider>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof WorkspaceEntityDetailPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Every route param resolves — the detail shell mounts with its back-button
 * slot and the manifest-driven detail body (header, sections, relations).
 */
export const Default: Story = {
  parameters: { msw: { handlers: loadedHandlers() } },
  decorators: [routerDecorator(detailEntry, DETAIL_PATH)],
};

/**
 * Discovery + manifest requests stay pending — the detail body shows its
 * skeleton placeholder while the params themselves are fully resolved.
 */
export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(ENTITIES_BASE_PATH, async () => {
          await delay('infinite');
        }),
        http.get(`${ENTITIES_BASE_PATH}/:name`, async () => {
          await delay('infinite');
        }),
      ],
    },
  },
  decorators: [routerDecorator(detailEntry, DETAIL_PATH)],
};

/**
 * The `id` route param is absent — the guard short-circuits and the
 * missing-parameter shell renders instead of the detail body (no fetches).
 */
export const MissingParameter: Story = {
  parameters: { msw: { handlers: [] } },
  decorators: [routerDecorator(`/w/${WORKSPACE}/${SAMPLE_ENTITY_NAME}`, '/w/:workspace/:entity')],
};
