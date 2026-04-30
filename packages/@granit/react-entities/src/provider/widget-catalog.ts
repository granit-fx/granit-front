import type { EntityFormFieldManifest } from '@granit/entities';
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
 * Catalog mapping widget identifiers (the `field.widget` value from the
 * manifest) → renderers. Apps register the standard catalog plus any
 * `custom:`-namespaced widgets they own (per ADR-041).
 */
export interface EntityWidgetCatalog {
  /** Form-context widgets, keyed by `field.widget`. */
  readonly form: Readonly<Record<string, EntityFormWidget>>;
}

/** Empty catalog — useful as a default and in tests. */
export const EMPTY_WIDGET_CATALOG: EntityWidgetCatalog = Object.freeze({
  form: Object.freeze({}),
});
