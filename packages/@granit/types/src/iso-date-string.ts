/**
 * Branded type for ISO 8601 date strings (e.g. `"2024-12-31T23:59:59Z"`).
 *
 * Provides compile-time distinction between date strings and arbitrary strings
 * with zero runtime overhead — the brand is erased during compilation.
 */
export type ISODateString = string & { readonly __brand: 'ISODateString' };

/**
 * Casts a plain string to {@link ISODateString}.
 *
 * Use this in application code when constructing dates from user input
 * or `new Date().toISOString()`. No runtime validation is performed —
 * the caller is responsible for ensuring the value is a valid ISO 8601 string.
 *
 * @example
 * ```ts
 * const now = toISODateString(new Date().toISOString());
 * ```
 */
export function toISODateString(value: string): ISODateString {
  return value as ISODateString;
}
