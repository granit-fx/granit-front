import type {
  BulkActionResponse,
  CalendarItemResponse,
  EntityDiscoveryResponse,
  EntityManifestResponse,
  RelationAggregatesResponse,
} from '@granit/entities';
import type { Mutable } from '@granit/testing';

/**
 * Wire identifier reused across the fixtures so handlers, query keys and
 * assertions all line up on the same entity name. Mirrors the canonical
 * `Granit.Parties.Party` used in the hook tests.
 */
export const SAMPLE_ENTITY_NAME = 'Granit.Parties.Party';

/** Stable id of the sample source row used by relation-aggregate / detail fixtures. */
export const SAMPLE_ENTITY_ID = '8c6b1e10-0000-4000-8000-000000000001';

/**
 * Discovery tree returned by `GET /api/v1/entities`. One module group with a
 * single readable entity — enough to drive the discovery hook and the nav
 * tree without dragging in every registered module.
 */
export const mockEntityDiscovery: EntityDiscoveryResponse = {
  schemaVersion: 1,
  modules: [
    {
      module: 'Parties',
      items: [
        {
          name: SAMPLE_ENTITY_NAME,
          displayKey: 'Granit.Parties.Party.DisplayName',
          icon: 'users',
          permissionGroup: 'Parties.Parties',
          links: {
            manifest: `/api/v1/entities/${SAMPLE_ENTITY_NAME}`,
            list: '/api/v1/parties',
          },
        },
        {
          name: 'Granit.Parties.Contact',
          displayKey: 'Granit.Parties.Contact.DisplayName',
          icon: 'user',
          permissionGroup: 'Parties.Contacts',
          links: {
            manifest: '/api/v1/entities/Granit.Parties.Contact',
            list: null,
          },
        },
      ],
    },
  ],
};

/**
 * Full per-entity manifest returned by `GET /api/v1/entities/{name}` with no
 * `?facets=` filter — every facet populated. Slim variants (facet-filtered)
 * come back with the omitted facets as `null`; build those from this base.
 */
export const mockEntityManifest: EntityManifestResponse = {
  schemaVersion: 1,
  identity: {
    name: SAMPLE_ENTITY_NAME,
    entityClrType: 'Granit.Parties.Domain.Party',
    displayKey: 'Granit.Parties.Party.DisplayName',
    icon: 'users',
    permissionGroup: 'Parties.Parties',
    displayProperty: 'Number',
    subtitleProperty: 'Kind',
  },
  permissions: {
    canRead: true,
    canCreate: true,
    canUpdate: true,
    canDelete: false,
    canManage: false,
    canExecute: false,
  },
  forms: [
    {
      name: 'default',
      customizable: true,
      sections: [
        {
          key: 'identity',
          labelKey: 'Granit.Parties.Party.Section.Identity',
          order: 0,
          collapsedByDefault: false,
          fields: [
            {
              propertyName: 'Number',
              clrTypeName: 'String',
              component: 'text',
              config: null,
              labelKey: 'Granit.Parties.Party.Number',
              helpKey: null,
              order: 0,
              readOnly: false,
              visibleIf: null,
              lookup: null,
              provenance: null,
            },
            {
              propertyName: 'Kind',
              clrTypeName: 'String',
              component: 'select',
              config: null,
              labelKey: 'Granit.Parties.Party.Kind',
              helpKey: null,
              order: 1,
              readOnly: false,
              visibleIf: null,
              lookup: null,
              provenance: null,
            },
          ],
          ownedCollection: null,
        },
      ],
      hiddenByOverride: null,
    },
  ],
  details: [
    {
      name: 'default',
      sections: [
        {
          key: 'identity',
          labelKey: 'Granit.Parties.Party.Section.Identity',
          order: 0,
          inheritsFromFormVariant: 'default',
          fields: null,
        },
      ],
      sidePanels: [
        { kind: 'Audit', order: 0 },
        { kind: 'Timeline', order: 1 },
      ],
    },
  ],
  collections: {
    query: { name: 'Granit.Parties.PartyQuery', clrTypeName: 'PartyQueryDefinition' },
    export: null,
    metrics: [],
    dashboards: [],
    defaultViewId: null,
    listLayouts: [],
    headerActions: [],
    selectionActions: [],
  },
  relations: [
    {
      name: 'Invoices',
      cardinality: 'Many',
      display: 'SmartButton',
      targetEntityName: 'Granit.Invoicing.Invoice',
      displayKey: 'Granit.Parties.Party.Relation.Invoices',
      icon: 'file-text',
      order: 0,
      queryDefinitionName: null,
      aggregates: [
        { kind: 'Count', propertyName: null, labelKey: null, format: null },
        { kind: 'Sum', propertyName: 'Total', labelKey: null, format: 'currency' },
      ],
      contributorAssemblyName: null,
    },
  ],
  actions: [
    {
      name: 'Approve',
      kind: 'WorkflowTransition',
      displayKey: 'Granit.Parties.Party.Action.Approve',
      icon: 'check',
      order: 0,
      urlTemplate: null,
      httpMethod: null,
      confirmationKey: 'Granit.Parties.Party.Action.Approve.Confirm',
      workflowTransitionName: 'Approve',
      contributorAssemblyName: null,
    },
  ],
  activities: null,
};

/**
 * Calendar items returned by `GET /api/v1/entities/{name}/calendar`. Covers
 * both a ranged event (start + end + colour) and a point-in-time marker
 * (`end: null`, `color: null`).
 */
export const mockCalendarItems: Mutable<CalendarItemResponse>[] = [
  {
    id: SAMPLE_ENTITY_ID,
    start: '2026-05-04T09:00:00Z',
    end: '2026-05-04T10:30:00Z',
    title: 'INV-001',
    color: 'Blue',
  },
  {
    id: '8c6b1e10-0000-4000-8000-000000000002',
    start: '2026-05-12T00:00:00Z',
    end: null,
    title: 'INV-002',
    color: null,
  },
];

/**
 * Relation-aggregate response for `POST /api/v1/entities/{name}/{id}/relations/aggregates`.
 * `Invoices` exercises a fully-populated numeric set; `Payments` exercises the
 * empty-set case where `Sum/Avg/Min/Max` collapse to `null` (ADR-038).
 */
export const mockRelationAggregates: RelationAggregatesResponse = {
  aggregates: {
    Invoices: { count: 12, sum: 4500, avg: 375, min: 100, max: 1200, currency: 'EUR' },
    Payments: { count: 8, sum: null, avg: null, min: null, max: null, currency: null },
  },
};

/**
 * Bulk-action recap for `POST /api/v1/entities/{name}/bulk/{action}` — two
 * rows processed, one captured per-id failure (partial-success path the retry
 * UX drives off).
 */
export const mockBulkActionResponse: BulkActionResponse = {
  affected: 2,
  failures: [{ id: 'q-3', reason: 'Workflow transition not allowed in state Draft.' }],
};
