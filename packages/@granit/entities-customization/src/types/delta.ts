/**
 * Closed catalog of layout deltas — mirrors `Granit.EntitiesCustomization.LayoutDelta`
 * (ADR-053 Layer 1). Adding a new delta kind requires an ADR amendment +
 * coordinated backend/front change; new shapes never appear "by convention".
 *
 * The `$type` discriminator and its lowercase values are the wire format used
 * by the backend (`System.Text.Json` polymorphic serialization).
 */
export type LayoutDeltaKind = 'reorder' | 'regroup' | 'hide';

/**
 * Move a field relative to a sibling. Exactly one of `beforeFieldName` or
 * `afterFieldName` must be non-null; the other must be null. Setting both
 * non-null is a backend 422.
 */
export interface ReorderDelta {
  readonly $type: 'reorder';
  readonly fieldName: string;
  readonly beforeFieldName: string | null;
  readonly afterFieldName: string | null;
}

/** Move a field into a group (created on the fly if it doesn't exist yet). */
export interface RegroupDelta {
  readonly $type: 'regroup';
  readonly fieldName: string;
  readonly groupKey: string;
}

/** Hide a field from the current layout; backend keeps it in the schema. */
export interface HideDelta {
  readonly $type: 'hide';
  readonly fieldName: string;
}

export type LayoutDelta = ReorderDelta | RegroupDelta | HideDelta;
