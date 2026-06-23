import type { EntityIdentitySection, EntityManifestResponse } from '@granit/entities';

// ---------------------------------------------------------------------------
// Forward-looking manifest extensions
// ---------------------------------------------------------------------------
//
// The framework's `EntityManifestResponse` covers the Phase 1.F scope:
// identity / permissions / forms / details / collections / relations /
// actions. The showcase needs a few more facets to render the legacy
// Party / Invoice detail pages without entity-specific code in
// `<WorkspaceEntityDetailPage />`:
//
// - `identity.subtitleProperty` — second display property surfaced under
//   the title (e.g. Party kind, Invoice document type).
// - `collectionSections` — child collection sections (Invoice line items,
//   Party addresses / emails / phones) rendered as Cards below the
//   sections grid.
//
// Action descriptors (PDF download, lifecycle transitions, navigation)
// now live on the canonical `EntityActionManifest` from
// `@granit/entities` (granit-front #351); call sites import that type
// directly and dispatch via `useEntityActionDispatcher`.
//
// Field-level rendering hints stay on `EntityFormFieldManifest.component`
// — the single ADR-041 vocabulary shared by `<EntityForm />` and
// `<EntityDetail />`, mirroring the .NET `FieldDescriptor.Component`.
// Component ids carry their config opaquely (e.g. `component: 'money'`
// + `config: { currencyProperty: 'Currency' }`), so no parallel `format`
// namespace is needed.
//
// Once granit-dotnet adds the missing structural primitives to the .NET
// DTOs (Phase 1.G), these helpers retire and the page consumes the
// framework types directly. Until then, the extensions live here as
// additive structural types over the existing `EntityManifestResponse`
// so the mock can declare them and the page can read them generically.

export type ExtendedIdentitySection = EntityIdentitySection;

/**
 * Child-collection section descriptor — renders a `<Card />` containing a
 * table of items pulled from the entity's `propertyName` value. Each
 * column declares which sub-field to render and which component id to
 * use for the read-mode formatter (same ADR-041 vocabulary as
 * `EntityFormFieldManifest.component`).
 */
export interface CollectionColumnManifest {
  readonly propertyName: string;
  readonly labelKey: string | null;
  readonly component?: string | null;
  readonly align?: 'left' | 'right' | 'center';
}

export interface EntityCollectionSectionManifest {
  readonly key: string;
  readonly labelKey: string | null;
  readonly order: number;
  /** Child collection property on the entity (camelCase JSON name). */
  readonly propertyName: string;
  readonly columns: readonly CollectionColumnManifest[];
  /**
   * Optional currency-code property on the parent entity used by the
   * `money` component when formatting amount columns (e.g. `'currency'`
   * on Invoice).
   */
  readonly currencyProperty?: string | null;
  /**
   * Optional row aggregate displayed as a footer (e.g. `Sum` of `total`).
   */
  readonly footer?: {
    readonly aggregate: 'Sum';
    readonly propertyName: string;
    readonly component?: string | null;
    readonly labelKey?: string | null;
  } | null;
}

// List-view layouts (kanban, calendar, …) and their per-kind configs come
// from the framework manifest at `manifest.collections.listLayouts` —
// types `EntityListLayoutKind` / `EntityListLayoutManifest` /
// `EntityCalendarLayoutManifest` / `EntityKanbanLayoutManifest` live in
// `@granit/entities`. Consumers import them directly; no local shim.

export interface ExtendedEntityManifest extends Omit<EntityManifestResponse, 'identity'> {
  readonly identity: ExtendedIdentitySection | null;
  readonly collectionSections?: readonly EntityCollectionSectionManifest[];
}

export function asExtended(manifest: EntityManifestResponse): ExtendedEntityManifest {
  return manifest as ExtendedEntityManifest;
}
