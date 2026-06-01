// ---------------------------------------------------------------------------
// Filter operator utilities
// ---------------------------------------------------------------------------

import type { FilterOperator } from '../types/query-params';

/** Operators available for string fields. */
export const STRING_OPERATORS: readonly FilterOperator[] = [
  'Eq',
  'Contains',
  'StartsWith',
  'EndsWith',
  'In',
];

/** Operators available for numeric fields (int, decimal, double). */
export const NUMBER_OPERATORS: readonly FilterOperator[] = [
  'Eq',
  'Gt',
  'Gte',
  'Lt',
  'Lte',
  'In',
  'Between',
];

/** Operators available for date/time fields. */
export const DATE_OPERATORS: readonly FilterOperator[] = [
  'Eq',
  'Gt',
  'Gte',
  'Lt',
  'Lte',
  'Between',
];

/** Operators available for boolean fields. */
export const BOOLEAN_OPERATORS: readonly FilterOperator[] = ['Eq'];

/** Operators available for enum and GUID fields. */
export const ENUM_OPERATORS: readonly FilterOperator[] = ['Eq', 'In'];

/** CLR type names that map to numeric operators. */
const NUMERIC_TYPES = new Set(['Int32', 'Int64', 'Decimal', 'Double', 'Single', 'Float']);

/** CLR type names that map to date operators. */
const DATE_TYPES = new Set(['DateTime', 'DateTimeOffset', 'DateOnly']);

/**
 * Infer available filter operators from a CLR type name.
 *
 * Mirrors the backend operator inference logic in
 * `Granit.QueryEngine.Filtering.OperatorInference`.
 */
export function inferOperators(clrType: string): readonly FilterOperator[] {
  if (clrType === 'String') return STRING_OPERATORS;
  if (NUMERIC_TYPES.has(clrType)) return NUMBER_OPERATORS;
  if (DATE_TYPES.has(clrType)) return DATE_OPERATORS;
  if (clrType === 'Boolean') return BOOLEAN_OPERATORS;
  if (clrType === 'Guid') return ENUM_OPERATORS;
  // Enum types and unknown types default to Eq + In
  return ENUM_OPERATORS;
}

/** Human-readable labels for filter operators. */
export const OPERATOR_LABELS: Readonly<Record<FilterOperator, string>> = {
  Eq: '=',
  Contains: 'contains',
  StartsWith: 'starts with',
  EndsWith: 'ends with',
  Gt: '>',
  Gte: '>=',
  Lt: '<',
  Lte: '<=',
  In: 'in',
  Between: 'between',
};
