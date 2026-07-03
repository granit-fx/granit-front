import type { EntityFormComponent } from '../providers/component-catalog';
import type { EntityFormFieldManifest } from '@granit/entities';

/**
 * Component ids the backend emits as the CLR-type default (mirrors
 * `FieldBuilder.ChooseDefaultComponent()`). A field still carrying one of
 * these was never given an explicit `.Component(...)`, so a `valueKind` hint
 * is allowed to upgrade it. Anything else (`textarea`, `money`, `url`, a
 * `custom:` id, …) is an explicit choice that always wins.
 */
const CLR_DEFAULT_COMPONENTS: ReadonlySet<string> = new Set([
  'text',
  'integer',
  'decimal',
  'boolean',
  'date',
  'time',
  'datetime',
  'select',
  'multiselect',
]);

/**
 * `valueKind` → edit form-component id. Deliberately separate from the
 * data-table cell map (`@granit/react-query-engine`): the same semantic kind
 * maps to a mode-appropriate widget (e.g. `Bytes` displays "1.2 MB" in a grid
 * but edits as a raw number, so it has no entry here). Only kinds with a
 * richer input than their CLR default are listed; the rest keep the default.
 */
export const VALUE_KIND_FORM_COMPONENTS: Readonly<Record<string, string>> = Object.freeze({
  Currency: 'money',
  Url: 'url',
  Email: 'email',
  Phone: 'phone',
});

/**
 * Resolves the form-component id for a field, in descending priority:
 *   1. `lookup` — a declared data-lookup routes to the server-backed picker.
 *   2. `valueKind` upgrade — only when `component` is still the CLR default
 *      AND the mapped component is registered in the catalog (else it would
 *      render as a missing component).
 *   3. `component` — the manifest value as-is (explicit choice or CLR default).
 */
export function resolveFormComponentId(
  field: EntityFormFieldManifest,
  catalog: Readonly<Record<string, EntityFormComponent>>
): string {
  if (field.lookup) return 'lookup';

  const base = field.component;
  if (field.valueKind && CLR_DEFAULT_COMPONENTS.has(base)) {
    const mapped = VALUE_KIND_FORM_COMPONENTS[field.valueKind];
    if (mapped && catalog[mapped]) return mapped;
  }
  return base;
}
