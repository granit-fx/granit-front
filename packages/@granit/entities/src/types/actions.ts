/**
 * Closed catalog of action kinds the renderer knows how to surface (per
 * ADR-040). Each kind binds to a specific frontend behaviour and a
 * specific descriptor field shape; the dispatcher branches on this enum
 * and never on a free-form string.
 *
 * Mirrors `Granit.Entities.Actions.EntityActionKind`.
 */
export type EntityActionKind =
  'ApiCall' | 'Download' | 'Navigate' | 'WorkflowTransitionResponse' | 'OpenDrawer' | 'OpenModal';

/**
 * Wire shape for one action exposed on an entity manifest. Carries the
 * full descriptor — the compact references on layouts (kanban card,
 * gallery card, calendar tile, list header) only carry `name` and look
 * up this descriptor to decide how to dispatch on click.
 *
 * Mirrors `Granit.Entities.Endpoints.Dtos.EntityActionManifest`.
 */
export interface EntityActionManifest {
  /** Stable action name, unique per entity. */
  readonly name: string;
  /** Renderer dispatch — drives which payload fields the frontend reads. */
  readonly kind: EntityActionKind;
  /** i18n key for the user-facing label. */
  readonly displayKey: string | null;
  /** Icon name from the catalog. */
  readonly icon: string | null;
  /** Display order among the entity's actions. */
  readonly order: number;
  /** URL template with `{id}` placeholder. `null` for `WorkflowTransitionResponse`. */
  readonly urlTemplate: string | null;
  /** HTTP verb for `ApiCall` (POST / PUT / DELETE). `null` otherwise. */
  readonly httpMethod: string | null;
  /** Optional i18n key for the confirmation modal. */
  readonly confirmationKey: string | null;
  /** Name of the target workflow state for `WorkflowTransitionResponse`. */
  readonly workflowTransitionName: string | null;
  /** Contributing assembly. `null` for intra-module declarations. */
  readonly contributorAssemblyName: string | null;
}
