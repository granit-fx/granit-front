import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { EntityRendererProvider } from '@granit/react-entities';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { delay, http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';

import { EntityDetailContent } from './entity-detail-content';

import type {
  EntityDiscoveryResponse,
  EntityFormFieldManifest,
  EntityManifestResponse,
} from '@granit/entities';
import type { Meta, StoryObj } from '@storybook/react-vite';

const ENTITY_NAME = 'Granit.Parties.Party';
const ENTITY_ID = 'party-1';
const LIST_PATH = '/api/v1/parties';

const mockApiClient = createApiClient({ baseURL: '' });

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function field(propertyName: string, component: string): EntityFormFieldManifest {
  return {
    propertyName,
    clrTypeName: 'String',
    component,
    config: null,
    labelKey: null,
    helpKey: null,
    order: 0,
    readOnly: false,
    visibleIf: null,
    lookup: null,
    provenance: null,
  };
}

const discovery: EntityDiscoveryResponse = {
  schemaVersion: 1,
  modules: [
    {
      module: 'Parties',
      items: [
        {
          name: ENTITY_NAME,
          displayKey: null,
          icon: null,
          permissionGroup: 'Parties.Parties',
          links: { manifest: `/api/v1/entities/${ENTITY_NAME}`, list: LIST_PATH },
        },
      ],
    },
  ],
};

// Detail variant inherits its single section from the form variant so the
// framework reads field components (Email → mailto, Website → url) without
// re-declaring them on the section.
const manifest = {
  schemaVersion: 1,
  identity: {
    name: ENTITY_NAME,
    entityClrType: 'Granit.Parties.Party',
    displayKey: null,
    icon: null,
    permissionGroup: 'Parties.Parties',
    displayProperty: 'Name',
    subtitleProperty: 'Kind',
  },
  permissions: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
  forms: [
    {
      name: 'Default',
      customizable: false,
      hiddenByOverride: null,
      sections: [
        {
          key: 'main',
          labelKey: null,
          order: 0,
          collapsedByDefault: false,
          ownedCollection: null,
          fields: [field('Name', 'text'), field('Email', 'email'), field('Website', 'url')],
        },
      ],
    },
  ],
  details: [
    {
      name: 'Default',
      sidePanels: [],
      sections: [
        {
          key: 'main',
          labelKey: null,
          order: 0,
          inheritsFromFormVariant: 'Default',
          fields: null,
        },
      ],
    },
  ],
  collections: null,
  relations: null,
  actions: [],
  activities: null,
} as unknown as EntityManifestResponse;

const entityData = {
  id: ENTITY_ID,
  name: 'Acme Corporation',
  kind: 'Organisation',
  email: 'contact@acme.example',
  website: 'https://acme.example',
};

function loadedHandlers() {
  return [
    http.get('/api/v1/entities', () => HttpResponse.json(discovery)),
    http.get(`/api/v1/entities/${ENTITY_NAME}`, () => HttpResponse.json(manifest)),
    http.get(`${LIST_PATH}/${ENTITY_ID}`, () => HttpResponse.json(entityData)),
  ];
}

const meta = {
  title: 'Layout/EntityDetailContent',
  component: EntityDetailContent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Manifest-driven entity detail body — header + actions + `<EntityDetail />` (sections / relations) + collection sections. Resolves the manifest via `useEntityMetadata`, the REST base path via `useEntityDiscovery`, and the row via React Query. Shared by the full detail page and the side-peek drawer.',
      },
    },
  },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/parties']}>
        <QueryClientProvider client={makeQueryClient()}>
          <GranitClientProvider client={mockApiClient}>
            <EntityRendererProvider>
              <div className="mx-auto max-w-3xl bg-background p-6">
                <Story />
              </div>
            </EntityRendererProvider>
          </GranitClientProvider>
        </QueryClientProvider>
      </MemoryRouter>
    ),
  ],
  args: {
    entityName: ENTITY_NAME,
    entityId: ENTITY_ID,
  },
} satisfies Meta<typeof EntityDetailContent>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Fully resolved record — header, subtitle, and inherited detail section. */
export const Loaded: Story = {
  parameters: { msw: { handlers: loadedHandlers() } },
};

/** Manifest + data requests stay pending — the skeleton placeholder shows. */
export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/v1/entities', async () => {
          await delay('infinite');
        }),
        http.get(`/api/v1/entities/${ENTITY_NAME}`, async () => {
          await delay('infinite');
        }),
      ],
    },
  },
};

/** Discovery lists the entity but the row 404s — the not-found body renders. */
export const NotFound: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/v1/entities', () => HttpResponse.json(discovery)),
        http.get(`/api/v1/entities/${ENTITY_NAME}`, () => HttpResponse.json(manifest)),
        http.get(`${LIST_PATH}/${ENTITY_ID}`, () => new HttpResponse(null, { status: 404 })),
      ],
    },
  },
};
