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

function applyHideDelta(meta: Map<string, EffectiveField>, fieldName: string): void {
  const current = meta.get(fieldName)!;
  meta.set(fieldName, { ...current, hidden: true });
}

function applyRegroupDelta(
  meta: Map<string, EffectiveField>,
  fieldName: string,
  groupKey: string
): void {
  const current = meta.get(fieldName)!;
  meta.set(fieldName, { ...current, group: groupKey });
}

function applyReorderDelta(
  order: string[],
  delta: Extract<LayoutDelta, { $type: 'reorder' }>
): void {
  const fromIdx = order.indexOf(delta.fieldName);
  if (fromIdx === -1) return;
  const anchor = delta.beforeFieldName ?? delta.afterFieldName;
  if (anchor === null) return;
  const anchorIdx = order.indexOf(anchor);
  if (anchorIdx === -1 || anchor === delta.fieldName) return;
  order.splice(fromIdx, 1);
  const reAnchor = order.indexOf(anchor);
  const targetIdx = delta.beforeFieldName === null ? reAnchor + 1 : reAnchor;
  order.splice(targetIdx, 0, delta.fieldName);
}

/**
 * Apply a list of deltas to the schema fields and return the effective
 * layout. Pure function — same inputs always yield the same output, which
 * keeps the editor predictable and testable without React.
 *
 * Resolution semantics (mirrors backend, ADR-053 §4):
 *  - Deltas apply in order; later deltas override earlier ones for the
 *    same field (e.g. two `hide` deltas idempotent; `reorder` then
 *    `reorder` keeps the latter).
 *  - `reorder.beforeFieldName` and `reorder.afterFieldName` are honored
 *    only if the anchor exists in the current order. Unknown anchors
 *    are silently ignored — backend rejects on PUT, so the editor
 *    never persists an invalid delta.
 *  - `regroup` overrides `defaultGroup`.
 *  - `hide` flips `hidden` to true (no `show` delta — un-hiding means
 *    removing the hide delta from the list).
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
    if (delta.$type === 'hide') {
      applyHideDelta(meta, delta.fieldName);
    } else if (delta.$type === 'regroup') {
      applyRegroupDelta(meta, delta.fieldName, delta.groupKey);
    } else if (delta.$type === 'reorder') {
      applyReorderDelta(order, delta);
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
  return [
    ...deltas,
    { $type: 'reorder', fieldName, beforeFieldName: previous.name, afterFieldName: null },
  ];
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
  return [
    ...deltas,
    { $type: 'reorder', fieldName, beforeFieldName: null, afterFieldName: next.name },
  ];
}

/**
 * Flip a field's visibility. Adding a hide appends a `hide` delta;
 * un-hiding strips every `hide` delta for that field (deltas remain a
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
    return deltas.filter((d) => !(d.$type === 'hide' && d.fieldName === fieldName));
  }
  return [...deltas, { $type: 'hide', fieldName }];
}

/**
 * Move a field into a group. Empty `groupKey` removes any `regroup` delta
 * (the field falls back to its schema default).
 */
export function setFieldGroup(
  deltas: readonly LayoutDelta[],
  fieldName: string,
  groupKey: string
): readonly LayoutDelta[] {
  const stripped = deltas.filter((d) => !(d.$type === 'regroup' && d.fieldName === fieldName));
  if (groupKey.length === 0) return stripped;
  return [...stripped, { $type: 'regroup', fieldName, groupKey }];
}
