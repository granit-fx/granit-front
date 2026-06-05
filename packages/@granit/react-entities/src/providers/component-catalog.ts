import type { EntityFormFieldManifest, SidePanelKind } from '@granit/entities';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Form components
// ---------------------------------------------------------------------------

/**
 * Props passed to a form-component renderer when `<EntityForm />` paints
 * one field. The renderer is fully controlled — `<EntityForm />` owns the
 * value via React Hook Form and just hands it down.
 */
export interface EntityFormComponentProps {
  readonly field: EntityFormFieldManifest;
  readonly value: unknown;
  readonly onChange: (next: unknown) => void;
  readonly readOnly: boolean;
  /** First validation message for this field, when any. */
  readonly errorMessage?: string;
  /**
   * All current form values, keyed by property name. Lets a component read
   * sibling fields — used by the `lookup` component to resolve a cascading
   * source's scope (e.g. a meter picker scoped to the selected tenant). Most
   * components ignore it.
   */
  readonly formValues?: Readonly<Record<string, unknown>>;
}

/** Renderer for one field in `<EntityForm />`. */
export type EntityFormComponent = (props: EntityFormComponentProps) => ReactNode;

// ---------------------------------------------------------------------------
// Detail components (read-mode formatters)
// ---------------------------------------------------------------------------

/**
 * Props passed to a detail-component renderer when `<EntityDetail />`
 * paints one read-mode field. The field manifest is **only present in
 * inherited mode** (when the section reuses a form variant via
 * `inheritsFromFormVariant`); free-form sections (`section.fields:
 * string[]`) carry just the property name.
 */
export interface EntityDetailComponentProps {
  readonly propertyName: string;
  readonly value: unknown;
  /** Field manifest — present in inherited-mode rendering, undefined otherwise. */
  readonly field?: EntityFormFieldManifest;
}

/** Renderer for one read-mode field in `<EntityDetail />`. */
export type EntityDetailComponent = (props: EntityDetailComponentProps) => ReactNode;

// ---------------------------------------------------------------------------
// Side panels
// ---------------------------------------------------------------------------

/**
 * Props passed to a side-panel renderer mounted by `<EntityDetail />` in
 * one of the right-rail slots declared by the manifest. The kinds map to
 * existing Granit modules (Audit / Timeline / Comments / Documents /
 * Activities); apps that have those modules wired register the matching
 * components in the catalog.
 */
export interface EntitySidePanelProps {
  /** Wire identifier of the entity (e.g. `"Granit.Parties.Party"`). */
  readonly entityName: string;
  /** Id of the current entity instance. */
  readonly entityId: string;
}

/** Renderer for one side panel kind in `<EntityDetail />`. */
export type EntitySidePanel = (props: EntitySidePanelProps) => ReactNode;

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

/**
 * Catalog mapping component identifiers (the `field.component` value
 * from the manifest) → renderers, plus the optional side-panel registry
 * keyed by `SidePanelKind`, plus the optional read-mode detail registry.
 * Apps register the standard catalog plus any `custom:`-namespaced
 * components they own (per ADR-041).
 */
export interface EntityComponentCatalog {
  /** Form-context components, keyed by `field.component`. */
  readonly form: Readonly<Record<string, EntityFormComponent>>;
  /**
   * Side-panel renderers keyed by `SidePanelKind`. Optional — when a
   * side-panel kind is missing or the registry is absent, `<EntityDetail />`
   * falls back to an empty slot placeholder.
   */
  readonly sidePanels?: Partial<Readonly<Record<SidePanelKind, EntitySidePanel>>>;
  /**
   * Detail-context (read-mode) components keyed by component id — same
   * key namespace as `form`, so a component id like `'url'` or
   * `'currency'` reuses the same string in both contexts. Optional —
   * when a component isn't registered, `<EntityDetail />` falls back
   * to a default text formatter.
   */
  readonly detail?: Readonly<Record<string, EntityDetailComponent>>;
}

/** Empty catalog — useful as a default and in tests. */
export const EMPTY_COMPONENT_CATALOG: EntityComponentCatalog = Object.freeze({
  form: Object.freeze({}),
});
