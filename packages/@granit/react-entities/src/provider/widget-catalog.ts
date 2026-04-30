import type { EntityFormFieldManifest, SidePanelKind } from '@granit/entities';
import type { ReactNode } from 'react';

/**
 * Props passed to a form-widget renderer when `<EntityForm />` paints one
 * field. The renderer is fully controlled — `<EntityForm />` owns the
 * value via React Hook Form and just hands it down.
 */
export interface EntityFormWidgetProps {
  readonly field: EntityFormFieldManifest;
  readonly value: unknown;
  readonly onChange: (next: unknown) => void;
  readonly readOnly: boolean;
  /** First validation message for this field, when any. */
  readonly errorMessage?: string;
}

/** Renderer for one field in `<EntityForm />`. */
export type EntityFormWidget = (props: EntityFormWidgetProps) => ReactNode;

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

/**
 * Catalog mapping widget identifiers (the `field.widget` value from the
 * manifest) → renderers, plus the optional side-panel registry keyed by
 * `SidePanelKind`. Apps register the standard catalog plus any
 * `custom:`-namespaced widgets they own (per ADR-041).
 */
export interface EntityWidgetCatalog {
  /** Form-context widgets, keyed by `field.widget`. */
  readonly form: Readonly<Record<string, EntityFormWidget>>;
  /**
   * Side-panel renderers keyed by `SidePanelKind`. Optional — when a
   * side-panel kind is missing or the registry is absent, `<EntityDetail />`
   * falls back to an empty slot placeholder.
   */
  readonly sidePanels?: Partial<Readonly<Record<SidePanelKind, EntitySidePanel>>>;
}

/** Empty catalog — useful as a default and in tests. */
export const EMPTY_WIDGET_CATALOG: EntityWidgetCatalog = Object.freeze({
  form: Object.freeze({}),
});
