/**
 * Closed catalog of layout deltas — mirrors `Granit.EntitiesCustomization.LayoutDelta`
 * (ADR-053 Layer 1). Adding a new delta kind requires an ADR amendment +
 * coordinated backend/front change; new shapes never appear "by convention".
 */
export type LayoutDeltaKind = 'Reorder' | 'Regroup' | 'Hide';

/**
 * Move a field relative to a sibling. Exactly one of `beforeFieldName` or
 * `afterFieldName` must be defined; setting both is a backend 422.
 */
export interface ReorderDelta {
  readonly kind: 'Reorder';
  readonly fieldName: string;
  readonly beforeFieldName?: string;
  readonly afterFieldName?: string;
}

/** Move a field into a group (created on the fly if it doesn't exist yet). */
export interface RegroupDelta {
  readonly kind: 'Regroup';
  readonly fieldName: string;
  readonly groupKey: string;
}

/** Hide a field from the current variant; backend keeps it in the schema. */
export interface HideDelta {
  readonly kind: 'Hide';
  readonly fieldName: string;
}

export type LayoutDelta = ReorderDelta | RegroupDelta | HideDelta;
