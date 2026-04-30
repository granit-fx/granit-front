import type { VisibilityCondition } from '../types/visibility.js';

/**
 * Evaluate one {@link VisibilityCondition} against the current form values.
 * Pure function — no logging, no side effects, no I/O. Closed over the
 * eight `FieldOp` operators; throws on a malformed condition (e.g. `In`
 * with a non-array value) so misuse surfaces as a bug rather than a silent
 * "field is hidden" mystery.
 *
 * Equality is strict (`===`) — the wire form carries JSON literals, so
 * primitives are the realistic input. Deep equality on objects / arrays is
 * intentionally not supported; if you need it, branch on the field's CLR
 * type and resolve it server-side.
 *
 * @param condition - The rule from the manifest (`field.visibleIf`).
 * @param formValues - Current form values keyed by PascalCase property name.
 *                     Missing keys read as `undefined`.
 * @returns `true` when the field should be visible.
 */
export function evaluateVisibility(
  condition: VisibilityCondition,
  formValues: Readonly<Record<string, unknown>>
): boolean {
  const actual = formValues[condition.field];
  const expected = condition.value;

  switch (condition.op) {
    case 'Eq':
      return actual === expected;
    case 'NotEq':
      return actual !== expected;
    case 'In':
      return asArray(expected, condition.op).includes(actual);
    case 'NotIn':
      return !asArray(expected, condition.op).includes(actual);
    case 'Gt':
      return isComparable(actual) && isComparable(expected) && actual > expected;
    case 'Lt':
      return isComparable(actual) && isComparable(expected) && actual < expected;
    case 'IsNull':
      return actual == null;
    case 'IsNotNull':
      return actual != null;
    default: {
      const exhaustive: never = condition.op;
      throw new Error(`Unknown FieldOp: ${String(exhaustive)}`);
    }
  }
}

function asArray(value: unknown, op: 'In' | 'NotIn'): readonly unknown[] {
  if (!Array.isArray(value)) {
    throw new TypeError(
      `VisibilityCondition with op=${op} requires an array value, received ${typeof value}.`
    );
  }
  return value;
}

type Comparable = number | string | bigint;

function isComparable(value: unknown): value is Comparable {
  return typeof value === 'number' || typeof value === 'string' || typeof value === 'bigint';
}
