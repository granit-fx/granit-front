/**
 * Closed enum of standard side panels a detail view may surface. Each value
 * maps to an existing Granit module; the renderer no-ops gracefully when
 * the target module isn't loaded in the host. Mirrors
 * `Granit.Entities.Details.SidePanelKind` (ADR-046).
 */
export type SidePanelKind = 'Audit' | 'Timeline' | 'Comments' | 'Documents' | 'Activities';

/**
 * One detail-view section. Mirrors
 * `Granit.Entities.Endpoints.Dtos.EntityDetailSectionManifest`.
 *
 * `inheritsFromFormVariant` and `fields` are mutually exclusive — when set,
 * the section reuses a form variant's structure in read mode.
 */
export interface EntityDetailSectionManifest {
  /** Stable section key. */
  readonly key: string;
  /** i18n key for the section header. */
  readonly labelKey: string | null;
  /** Display order (lower first). */
  readonly order: number;
  /** Form variant whose structure this section inherits in read mode. */
  readonly inheritsFromFormVariant: string | null;
  /** Free-form list of property names — used when not inheriting. */
  readonly fields: readonly string[] | null;
}

/**
 * One side panel in the detail's right rail. Mirrors
 * `Granit.Entities.Endpoints.Dtos.EntityDetailSidePanelManifest`.
 */
export interface EntityDetailSidePanelManifest {
  readonly kind: SidePanelKind;
  /** Display order within the rail. */
  readonly order: number;
}

/**
 * One detail-view variant. Mirrors
 * `Granit.Entities.Endpoints.Dtos.EntityDetailManifest`.
 */
export interface EntityDetailManifest {
  /** Variant name, unique per entity. */
  readonly name: string;
  readonly sections: readonly EntityDetailSectionManifest[];
  readonly sidePanels: readonly EntityDetailSidePanelManifest[];
}
