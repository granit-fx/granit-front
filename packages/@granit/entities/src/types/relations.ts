/**
 * Cardinality of an entity relation. Mirrors
 * `Granit.Entities.Relations.RelationCardinality`.
 */
export type RelationCardinality = 'Many' | 'One';

/**
 * Display mode a relation picks on the source entity's detail view.
 * Mirrors `Granit.Entities.Relations.RelationDisplay` (ADR-048).
 *
 * - `Tab` — dedicated tab, full-screen list of related rows
 * - `SmartButton` — compact button in the detail header, click for drilldown
 * - `Sidebar` — always-visible side panel in the right rail
 * - `InlineChips` — chip strip embedded in a section, click-to-expand
 */
export type RelationDisplay = 'Tab' | 'SmartButton' | 'Sidebar' | 'InlineChips';

/**
 * Aggregate kinds a relation may surface. Mirrors
 * `Granit.Entities.Relations.RelationAggregateKind`.
 */
export type RelationAggregateKind = 'Count' | 'Sum' | 'Avg' | 'Min' | 'Max';

/**
 * One aggregate declared on a relation. Mirrors
 * `Granit.Entities.Endpoints.Dtos.EntityRelationAggregateManifest`.
 */
export interface EntityRelationAggregateManifest {
  readonly kind: RelationAggregateKind;
  /** Property on the related entity (or `null` for `Count`). */
  readonly propertyName: string | null;
  readonly labelKey: string | null;
  /** Optional formatter hint (e.g. `"currency"`). */
  readonly format: string | null;
}

/**
 * One relation surfaced in the manifest's Relations facet. Mirrors
 * `Granit.Entities.Endpoints.Dtos.EntityRelationManifest`.
 */
export interface EntityRelationManifest {
  /** Stable relation name, unique per source entity. */
  readonly name: string;
  readonly cardinality: RelationCardinality;
  readonly display: RelationDisplay;
  /** Wire identifier of the target `EntityDefinition`. */
  readonly targetEntityName: string;
  readonly displayKey: string | null;
  readonly icon: string | null;
  readonly order: number;
  /** Optional named QueryDefinition used for the drilldown collection. */
  readonly queryDefinitionName: string | null;
  readonly aggregates: readonly EntityRelationAggregateManifest[];
  /**
   * Assembly that contributed this relation. `null` for intra-module
   * declarations; populated for cross-module grafts (smart buttons
   * contributed via `IEntityRelationContributor`).
   */
  readonly contributorAssemblyName: string | null;
}

/**
 * Computed aggregate values for one relation, returned by
 * `POST /api/entities/{name}/{id}/relations/aggregates`. Each numeric slot
 * is nullable — the runner only fills aggregates the relation declared, and
 * `Sum`/`Avg`/`Min`/`Max` are `null` on empty sets per ADR-038.
 *
 * Mirrors `Granit.Entities.Relations.RelationAggregateValue`.
 */
export interface RelationAggregateValue {
  readonly count: number | null;
  readonly sum: number | null;
  readonly avg: number | null;
  readonly min: number | null;
  readonly max: number | null;
  /** ISO 4217 currency code when the aggregate's format is `"currency"`. */
  readonly currency: string | null;
}

/**
 * Request body for `POST /api/entities/{name}/{id}/relations/aggregates`.
 * Mirrors `Granit.Entities.Endpoints.Dtos.RelationAggregatesRequest`.
 *
 * When `relations` is omitted or empty, the endpoint resolves "every
 * relation the caller can read on the source entity" — convenient for a
 * detail page that wants every smart-button count in one round-trip.
 */
export interface RelationAggregatesRequest {
  readonly relations?: readonly string[] | null;
}

/**
 * Response body for `POST /api/entities/{name}/{id}/relations/aggregates`,
 * keyed by relation name. Relations the caller cannot read are absent
 * (defense in depth). Mirrors
 * `Granit.Entities.Endpoints.Dtos.RelationAggregatesResponse`.
 */
export interface RelationAggregatesResponse {
  readonly aggregates: Readonly<Record<string, RelationAggregateValue>>;
}
