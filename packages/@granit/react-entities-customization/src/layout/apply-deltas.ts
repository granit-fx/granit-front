import type { LayoutDelta } from '@granit/entities-customization';

/** A field declared by the underlying schema/manifest, before deltas apply. */
export interface SchemaField {
  readonly name: string;
  /** Default group key from the schema (e.g. `'general'`). May be undefined. */
  readonly defaultGroup?: string;
  /** Optional human label — passed through unchanged on the effective view. */
  readonly label?: string;
}

/** A field after deltas apply: order is significant, and `hidden`/`group` reflect overrides. */
export interface EffectiveField {
  readonly name: string;
  readonly label?: string;
  readonly group?: string;
  readonly hidden: boolean;
}

/**
 * Apply a list of deltas to the schema fields and return the effective
 * layout. Pure function — same inputs always yield the same output, which
 * keeps the editor predictable and testable without React.
 *
 * Resolution semantics (mirrors backend, ADR-053 §4):
 *  - Deltas apply in order; later deltas override earlier ones for the
 *    same field (e.g. two `Hide` deltas idempotent; `Reorder` then
 *    `Reorder` keeps the latter).
 *  - `Reorder.beforeFieldName` and `Reorder.afterFieldName` are honored
 *    only if the anchor exists in the current order. Unknown anchors
 *    are silently ignored — backend rejects on PUT, so the editor
 *    never persists an invalid delta.
 *  - `Regroup` overrides `defaultGroup`.
 *  - `Hide` flips `hidden` to true (no `Show` delta — un-hiding means
 *    removing the Hide delta from the list).
 */
export function applyDeltas(
  fields: readonly SchemaField[],
  deltas: readonly LayoutDelta[]
): readonly EffectiveField[] {
  const order: string[] = fields.map((f) => f.name);
  const meta = new Map<string, EffectiveField>();
  for (const f of fields) {
    meta.set(f.name, { name: f.name, label: f.label, group: f.defaultGroup, hidden: false });
  }

  for (const delta of deltas) {
    if (!meta.has(delta.fieldName)) continue;
    if (delta.kind === 'Hide') {
      const current = meta.get(delta.fieldName)!;
      meta.set(delta.fieldName, { ...current, hidden: true });
    } else if (delta.kind === 'Regroup') {
      const current = meta.get(delta.fieldName)!;
      meta.set(delta.fieldName, { ...current, group: delta.groupKey });
    } else if (delta.kind === 'Reorder') {
      const fromIdx = order.indexOf(delta.fieldName);
      if (fromIdx === -1) continue;
      const anchor = delta.beforeFieldName ?? delta.afterFieldName;
      if (anchor === undefined) continue;
      const anchorIdx = order.indexOf(anchor);
      if (anchorIdx === -1 || anchor === delta.fieldName) continue;
      order.splice(fromIdx, 1);
      const reAnchor = order.indexOf(anchor);
      const targetIdx = delta.beforeFieldName !== undefined ? reAnchor : reAnchor + 1;
      order.splice(targetIdx, 0, delta.fieldName);
    }
  }

  return order.map((name) => meta.get(name)!);
}

/**
 * Move a field one slot earlier in the effective order. Returns the next
 * `deltas` list (or the same reference if already at the top).
 */
export function moveFieldUp(
  fields: readonly SchemaField[],
  deltas: readonly LayoutDelta[],
  fieldName: string
): readonly LayoutDelta[] {
  const effective = applyDeltas(fields, deltas);
  const idx = effective.findIndex((f) => f.name === fieldName);
  if (idx <= 0) return deltas;
  const previous = effective[idx - 1];
  if (previous === undefined) return deltas;
  return [...deltas, { kind: 'Reorder', fieldName, beforeFieldName: previous.name }];
}

/**
 * Move a field one slot later in the effective order. Returns the next
 * `deltas` list (or the same reference if already at the bottom).
 */
export function moveFieldDown(
  fields: readonly SchemaField[],
  deltas: readonly LayoutDelta[],
  fieldName: string
): readonly LayoutDelta[] {
  const effective = applyDeltas(fields, deltas);
  const idx = effective.findIndex((f) => f.name === fieldName);
  if (idx === -1 || idx >= effective.length - 1) return deltas;
  const next = effective[idx + 1];
  if (next === undefined) return deltas;
  return [...deltas, { kind: 'Reorder', fieldName, afterFieldName: next.name }];
}

/**
 * Flip a field's visibility. Adding a hide appends a `Hide` delta;
 * un-hiding strips every `Hide` delta for that field (deltas remain a
 * historical/append log on the wire, but the editor's view is
 * declarative).
 */
export function toggleFieldHidden(
  fields: readonly SchemaField[],
  deltas: readonly LayoutDelta[],
  fieldName: string
): readonly LayoutDelta[] {
  const effective = applyDeltas(fields, deltas);
  const target = effective.find((f) => f.name === fieldName);
  if (target === undefined) return deltas;
  if (target.hidden) {
    return deltas.filter((d) => !(d.kind === 'Hide' && d.fieldName === fieldName));
  }
  return [...deltas, { kind: 'Hide', fieldName }];
}

/**
 * Move a field into a group. Empty `groupKey` removes any `Regroup` delta
 * (the field falls back to its schema default).
 */
export function setFieldGroup(
  deltas: readonly LayoutDelta[],
  fieldName: string,
  groupKey: string
): readonly LayoutDelta[] {
  const stripped = deltas.filter((d) => !(d.kind === 'Regroup' && d.fieldName === fieldName));
  if (groupKey.length === 0) return stripped;
  return [...stripped, { kind: 'Regroup', fieldName, groupKey }];
}
