import { GranitClientProvider } from '@granit/react-api-client';
import { EntityRendererProvider } from '@granit/react-entities';
import {
  ENTITIES_BASE_PATH,
  SAMPLE_ENTITY_ID,
  SAMPLE_ENTITY_NAME,
  createEntitiesHandlers,
  mockEntityManifest,
} from '@granit/react-entities/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { MemoryRouter, useLocation } from 'react-router';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { EntityDetailContent } from './entity-detail-content';

import type {
  EntityCollectionSectionManifest,
  ExtendedEntityManifest,
} from './manifest-extensions';
import type {
  EntityActionManifest,
  EntityFormFieldManifest,
  EntityFormManifest,
  EntityIdentitySection,
} from '@granit/entities';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Fixtures — the entity row (opaque camelCase wire record, no static DTO) plus
// manifest builders layered over the shared `mockEntityManifest` fixture.
// ---------------------------------------------------------------------------

const ORIGIN = 'http://localhost';
const ROW_BASE_PATH = '/api/v1/parties';

/** Raw camelCase wire row returned by `GET /api/v1/parties/{id}`. */
const RICH_ROW: Record<string, unknown> = {
  number: 'P-001',
  kind: 'Company',
  amount: 12345,
  currency: 'USD',
  dueDate: '2026-03-04T00:00:00Z',
  createdAt: '2026-01-02T10:30:00Z',
  badDate: 'not-a-date',
  timestamp: '2026-05-06T08:00:00Z',
  meta: { nested: true },
  lines: [
    { id: 'l1', description: 'Widget', total: 1000 },
    { id: 'l2', description: 'Gadget', total: 500 },
  ],
};

function field(
  propertyName: string,
  order: number,
  component: string,
  overrides: Partial<EntityFormFieldManifest> = {}
): EntityFormFieldManifest {
  return {
    propertyName,
    clrTypeName: 'String',
    component,
    config: null,
    labelKey: `Field.${propertyName}.Label`,
    helpKey: null,
    order,
    readOnly: false,
    visibleIf: null,
    lookup: null,
    provenance: null,
    ...overrides,
  };
}

const RICH_FORMS: EntityFormManifest[] = [
  {
    name: 'default',
    customizable: true,
    sections: [
      {
        key: 'identity',
        labelKey: 'Section.Identity',
        order: 0,
        collapsedByDefault: false,
        ownedCollection: null,
        fields: [
          field('Number', 0, 'text'),
          field('Amount', 1, 'money'),
          field('DueDate', 2, 'date'),
          field('CreatedAt', 3, 'datetime'),
          field('BadDate', 4, 'date'),
        ],
      },
    ],
    hiddenByOverride: null,
  },
];

const RICH_ACTIONS: EntityActionManifest[] = [
  {
    name: 'Edit',
    kind: 'Navigate',
    displayKey: 'Action.Edit',
    icon: 'pencil',
    order: 5,
    urlTemplate: '/parties/{id}/edit',
    httpMethod: null,
    confirmationKey: null,
    workflowTransitionName: null,
    contributorAssemblyName: null,
  },
  {
    name: 'Blank',
    kind: 'Navigate',
    displayKey: null,
    icon: null,
    order: 1,
    urlTemplate: null,
    httpMethod: null,
    confirmationKey: null,
    workflowTransitionName: null,
    contributorAssemblyName: null,
  },
];

const RICH_COLLECTION_SECTIONS: EntityCollectionSectionManifest[] = [
  {
    key: 'lines',
    labelKey: 'Section.Lines',
    order: 10,
    propertyName: 'lines',
    currencyProperty: 'currency',
    columns: [
      { propertyName: 'description', labelKey: null },
      { propertyName: 'total', labelKey: null, component: 'money', align: 'right' },
    ],
    footer: { aggregate: 'Sum', propertyName: 'total', component: 'money', labelKey: null },
  },
  {
    key: 'empty',
    labelKey: null,
    order: 0,
    propertyName: 'nothingHere',
    columns: [{ propertyName: 'x', labelKey: null }],
  },
];

const RICH_IDENTITY: EntityIdentitySection = {
  name: SAMPLE_ENTITY_NAME,
  entityClrType: 'Granit.Parties.Domain.Party',
  displayKey: 'Granit.Parties.Party.DisplayName',
  icon: 'users',
  permissionGroup: 'Parties.Parties',
  displayProperty: 'Number',
  subtitleProperty: 'Kind',
};

/** Manifest exercising money/date/datetime pre-formatting, actions, collections. */
const richManifest: ExtendedEntityManifest = {
  ...mockEntityManifest,
  identity: RICH_IDENTITY,
  forms: RICH_FORMS,
  actions: RICH_ACTIONS,
  collectionSections: RICH_COLLECTION_SECTIONS,
};

// ---------------------------------------------------------------------------
// MSW — discovery + manifest + relation aggregates from the shared handlers,
// plus the single-row read the detail body drives off `links.list`.
// ---------------------------------------------------------------------------

function rowHandler(row: Record<string, unknown> = RICH_ROW) {
  return http.get(`${ORIGIN}${ROW_BASE_PATH}/:id`, () => HttpResponse.json(row));
}

function baseHandlers() {
  return [...createEntitiesHandlers(`${ORIGIN}${ENTITIES_BASE_PATH}`), rowHandler()];
}

const server = setupServer(...baseHandlers());

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers(...baseHandlers()));
afterAll(() => server.close());

// ---------------------------------------------------------------------------
// Render harness — QueryClient + Granit axios client + entity renderer +
// router (the body calls `useNavigate`).
// ---------------------------------------------------------------------------

let lastLocation = '';
function LocationProbe() {
  lastLocation = useLocation().pathname;
  return null;
}

function renderContent(ui: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const apiClient = axios.create({ baseURL: ORIGIN });
  return render(
    <MemoryRouter initialEntries={['/start']}>
      <QueryClientProvider client={queryClient}>
        <GranitClientProvider client={apiClient}>
          <EntityRendererProvider>
            {ui}
            <LocationProbe />
          </EntityRendererProvider>
        </GranitClientProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe('EntityDetailContent', () => {
  it('renders the skeleton while manifest / entity / discovery load', () => {
    const { container } = renderContent(
      <EntityDetailContent entityName={SAMPLE_ENTITY_NAME} entityId={SAMPLE_ENTITY_ID} />
    );
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
    expect(container.querySelector('[data-slot="entity-detail-content"]')).toBeNull();
  });

  it('renders the not-found error slot when the entity is absent from discovery', async () => {
    // Unknown name => no `links.list` => useEntity stays disabled => no row =>
    // `!entityData` error branch (the row endpoint is never hit).
    renderContent(<EntityDetailContent entityName="Granit.Unknown.Thing" entityId="x-1" />);
    await waitFor(() =>
      expect(document.querySelector('[data-slot="entity-detail-content-error"]')).not.toBeNull()
    );
  });

  it('renders the not-found error slot when the row request fails', async () => {
    server.use(
      http.get(`${ORIGIN}${ROW_BASE_PATH}/:id`, () => new HttpResponse(null, { status: 500 }))
    );
    renderContent(
      <EntityDetailContent entityName={SAMPLE_ENTITY_NAME} entityId={SAMPLE_ENTITY_ID} />
    );
    await waitFor(() =>
      expect(document.querySelector('[data-slot="entity-detail-content-error"]')).not.toBeNull()
    );
  });

  it('renders the no-variant slot when the manifest declares no detail variant', async () => {
    server.use(
      http.get(`${ORIGIN}${ENTITIES_BASE_PATH}/:name`, () =>
        HttpResponse.json({ ...mockEntityManifest, details: [] })
      )
    );
    renderContent(
      <EntityDetailContent entityName={SAMPLE_ENTITY_NAME} entityId={SAMPLE_ENTITY_ID} />
    );
    await waitFor(() =>
      expect(
        document.querySelector('[data-slot="entity-detail-content-no-variant"]')
      ).not.toBeNull()
    );
  });

  it('renders the populated body: header, actions, formatted values and collections', async () => {
    server.use(
      http.get(`${ORIGIN}${ENTITIES_BASE_PATH}/:name`, () => HttpResponse.json(richManifest))
    );
    const { container } = renderContent(
      <EntityDetailContent
        entityName={SAMPLE_ENTITY_NAME}
        entityId={SAMPLE_ENTITY_ID}
        workspace="acme"
      />
    );

    await waitFor(() =>
      expect(container.querySelector('[data-slot="entity-detail-content"]')).not.toBeNull()
    );

    // Header label (displayProperty=Number) is rendered in the <h1>.
    expect(container.querySelector('h1')?.textContent).toBe('P-001');
    // Subtitle uses subtitleProperty=Kind.
    expect(container.querySelector('header p')?.textContent).toBe('Company');

    // Two Navigate actions render as action buttons.
    const actionButtons = container.querySelectorAll('[data-slot="entity-action-button"]');
    expect(actionButtons.length).toBe(2);

    // Money pre-formatting (component=money) reaches the detail rows.
    expect(container.textContent).toContain('$123.45');

    // Collection section with rows renders a table; the empty one shows a placeholder.
    const cards = container.querySelectorAll('[data-slot="collection-section-card"]');
    expect(cards.length).toBe(2);
    const linesCard = container.querySelector('[data-section-key="lines"]');
    expect(linesCard?.querySelectorAll('tbody tr').length).toBe(2);

    // The reserved workspace context is written to the hidden span.
    expect(container.querySelector('[data-workspace-context="acme"]')).not.toBeNull();
  });

  it('routes in-app when a Navigate action with a urlTemplate is clicked', async () => {
    server.use(
      http.get(`${ORIGIN}${ENTITIES_BASE_PATH}/:name`, () => HttpResponse.json(richManifest))
    );
    const user = userEvent.setup();
    const { container } = renderContent(
      <EntityDetailContent entityName={SAMPLE_ENTITY_NAME} entityId={SAMPLE_ENTITY_ID} />
    );
    await waitFor(() =>
      expect(container.querySelector('[data-slot="entity-detail-content"]')).not.toBeNull()
    );

    // The action whose urlTemplate carries {id} => navigate with the id substituted.
    const editButton = container.querySelector('[data-action-name="Edit"]');
    expect(editButton).not.toBeNull();
    await user.click(editButton as Element);
    await waitFor(() =>
      expect(lastLocation).toBe(`/parties/${encodeURIComponent(SAMPLE_ENTITY_ID)}/edit`)
    );

    // The action with a null urlTemplate is a no-op (early return in the handler).
    await user.click(container.querySelector('[data-action-name="Blank"]') as Element);
    expect(lastLocation).toBe(`/parties/${encodeURIComponent(SAMPLE_ENTITY_ID)}/edit`);
  });

  it('omits the header actions and h1 when identity + actions are absent', async () => {
    server.use(
      http.get(`${ORIGIN}${ENTITIES_BASE_PATH}/:name`, () =>
        HttpResponse.json({
          ...mockEntityManifest,
          identity: null,
          actions: null,
        })
      )
    );
    const { container } = renderContent(
      <EntityDetailContent entityName={SAMPLE_ENTITY_NAME} entityId={SAMPLE_ENTITY_ID} />
    );
    await waitFor(() =>
      expect(container.querySelector('[data-slot="entity-detail-content"]')).not.toBeNull()
    );
    // No displayProperty => no header label.
    expect(container.querySelector('h1')).toBeNull();
    // No actions => no action buttons.
    expect(container.querySelector('[data-slot="entity-action-button"]')).toBeNull();
    // subtitleProperty absent => subtitle falls back to the resolved identity label.
    expect(container.querySelector('header p')?.textContent).toBeTruthy();
    // Absent workspace prop => empty context marker.
    expect(container.querySelector('[data-workspace-context=""]')).not.toBeNull();
  });

  it('stringifies an object header, defaults currency to EUR and skips invalid ISO strings', async () => {
    // Row with NO `currency` key => `values.Currency ?? 'EUR'` takes the EUR
    // fallback. `weird` is a no-component string matching the ISO date regex
    // but parsing to an invalid Date => the `!Number.isNaN` guard is skipped.
    // `displayProperty` points at an object value => `toDisplayString` walks
    // its `JSON.stringify` branch.
    const objectRow: Record<string, unknown> = {
      number: 'P-777',
      amount: 5000,
      weird: '2026-13-45T99:00',
      meta: { nested: true },
    };
    const objectHeaderManifest: ExtendedEntityManifest = {
      ...mockEntityManifest,
      identity: { ...RICH_IDENTITY, displayProperty: 'Meta', subtitleProperty: 'Number' },
      forms: [
        {
          name: 'default',
          customizable: true,
          sections: [
            {
              key: 'identity',
              labelKey: 'Section.Identity',
              order: 0,
              collapsedByDefault: false,
              ownedCollection: null,
              // The empty-string component exercises the `if (field.component)`
              // false branch of the property→component map builder.
              fields: [field('Amount', 0, 'money'), field('Number', 1, '')],
            },
          ],
          hiddenByOverride: null,
        },
      ],
      actions: null,
      collectionSections: null,
    };
    server.use(
      http.get(`${ORIGIN}${ENTITIES_BASE_PATH}/:name`, () =>
        HttpResponse.json(objectHeaderManifest)
      ),
      http.get(`${ORIGIN}${ROW_BASE_PATH}/:id`, () => HttpResponse.json(objectRow))
    );
    const { container } = renderContent(
      <EntityDetailContent entityName={SAMPLE_ENTITY_NAME} entityId={SAMPLE_ENTITY_ID} />
    );
    await waitFor(() =>
      expect(container.querySelector('[data-slot="entity-detail-content"]')).not.toBeNull()
    );
    // Object header value stringified into the <h1>.
    expect(container.querySelector('h1')?.textContent).toBe('{"nested":true}');
    // Subtitle resolves from the string `Number` property.
    expect(container.querySelector('header p')?.textContent).toBe('P-777');
    // EUR default currency reaches the money-formatted amount (5000 / 100).
    expect(container.textContent).toContain('€');
  });

  it('renders when the manifest omits forms and relations entirely', async () => {
    // `forms: null` and `relations: null` drive the `?? []` / `?? undefined`
    // nullish fallbacks feeding the component map builder and `<EntityDetail />`.
    server.use(
      http.get(`${ORIGIN}${ENTITIES_BASE_PATH}/:name`, () =>
        HttpResponse.json({ ...mockEntityManifest, forms: null, relations: null })
      )
    );
    const { container } = renderContent(
      <EntityDetailContent entityName={SAMPLE_ENTITY_NAME} entityId={SAMPLE_ENTITY_ID} />
    );
    await waitFor(() =>
      expect(container.querySelector('[data-slot="entity-detail-content"]')).not.toBeNull()
    );
    // displayProperty=Number still resolves the header from the row.
    expect(container.querySelector('h1')?.textContent).toBe('P-001');
  });
});
