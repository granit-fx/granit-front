import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { EntityRendererProvider } from '@granit/react-entities';
import {
  SAMPLE_ENTITY_ID,
  SAMPLE_ENTITY_NAME,
  createEntitiesHandlers,
} from '@granit/react-entities/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { delay, http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router';

import { WorkspaceEntityFormPage } from './workspace-entity-form-page';

import type { Meta, StoryObj } from '@storybook/react-vite';

// Base path the sample entity's rows hang off — `links.list` for
// `Granit.Parties.Party` in the discovery fixture (`createEntitiesHandlers`).
const LIST_PATH = '/api/v1/parties';

// camelCase wire row served on the edit path; `toPascalCaseKeys` flips it to
// the manifest's `Number` / `Kind` fields before it seeds React Hook Form.
const existingRow = { id: SAMPLE_ENTITY_ID, number: 'P-100', kind: 'Company' };

const mockApiClient = createApiClient({ baseURL: '' });

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

const meta = {
  title: 'Entities/WorkspaceEntityFormPage',
  component: WorkspaceEntityFormPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Workspace-scoped entity create / edit page. Resolves the manifest (`useEntityMetadata`), the REST base path (`useEntityDiscovery`) and — in edit mode — the existing row (`useEntity`) from the route `:workspace` / `:entity` / `:id` params, then mounts a manifest-driven `<EntityForm />` wired to React Hook Form.',
      },
    },
  },
  decorators: [
    // Provider stack that mirrors the sibling test harness: the entity hooks
    // need a Granit client + React Query cache, and `<EntityForm />` reads its
    // component catalog from `<EntityRendererProvider>`. A fresh QueryClient
    // per render keeps the loading variant deterministic.
    (Story) => (
      <QueryClientProvider client={makeQueryClient()}>
        <GranitClientProvider client={mockApiClient}>
          <EntityRendererProvider>
            <Story />
          </EntityRendererProvider>
        </GranitClientProvider>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof WorkspaceEntityFormPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Create mode — the manifest's `default` form variant renders empty. The
 * submit button stays disabled until the form is dirty. Route supplies
 * `:workspace` + `:entity` (no `:id`).
 */
export const Default: Story = {
  args: { mode: 'create' },
  parameters: { msw: { handlers: createEntitiesHandlers() } },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={[`/w/acme/${SAMPLE_ENTITY_NAME}`]}>
        <Routes>
          <Route path="/w/:workspace/:entity" element={<Story />} />
        </Routes>
      </MemoryRouter>
    ),
  ],
};

/**
 * Edit mode — the existing row is fetched from `${LIST_PATH}/{id}`, remapped
 * to PascalCase and seeded into the form fields. The heading switches to
 * "Edit" and the submit label to "Save". Route supplies `:id`.
 */
export const Edit: Story = {
  args: { mode: 'edit' },
  parameters: {
    msw: {
      handlers: [
        ...createEntitiesHandlers(),
        http.get(`${LIST_PATH}/${SAMPLE_ENTITY_ID}`, () => HttpResponse.json(existingRow)),
      ],
    },
  },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={[`/w/acme/${SAMPLE_ENTITY_NAME}/${SAMPLE_ENTITY_ID}/edit`]}>
        <Routes>
          <Route path="/w/:workspace/:entity/:id/edit" element={<Story />} />
        </Routes>
      </MemoryRouter>
    ),
  ],
};

/**
 * Loading state — the discovery + manifest requests stay pending, so the page
 * renders its skeleton placeholders instead of the form.
 */
export const Loading: Story = {
  args: { mode: 'create' },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/v1/entities', async () => {
          await delay('infinite');
        }),
        http.get('/api/v1/entities/:name', async () => {
          await delay('infinite');
        }),
      ],
    },
  },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={[`/w/acme/${SAMPLE_ENTITY_NAME}`]}>
        <Routes>
          <Route path="/w/:workspace/:entity" element={<Story />} />
        </Routes>
      </MemoryRouter>
    ),
  ],
};
