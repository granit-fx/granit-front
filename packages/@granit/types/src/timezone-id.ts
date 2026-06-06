/**
 * Branded type for IANA timezone identifiers (e.g. `"Europe/Brussels"`, `"America/New_York"`).
 *
 * Provides compile-time distinction between timezone strings and arbitrary strings.
 * Incorrect IANA strings fail silently at runtime (TZDate falls back to UTC);
 * this brand makes the error detectable at call sites.
 */
export type TimeZoneId = string & { readonly __brand: 'TimeZoneId' };

/**
 * Casts a plain string to {@link TimeZoneId}.
 *
 * No runtime validation — the caller is responsible for ensuring the value
 * is a valid IANA timezone identifier.
 *
 * @example
 * ```ts
 * const tz = toTimeZoneId('Europe/Brussels');
 * ```
 */
export function toTimeZoneId(value: string): TimeZoneId {
  return value as TimeZoneId;
}

/**
 * Returns `true` when `value` is a non-empty string (structural guard only).
 *
 * Does not validate that the string is a real IANA timezone identifier —
 * use this at system boundaries to assert the value is at least a non-empty
 * string before branding it with {@link toTimeZoneId}.
 */
export function isTimeZoneId(value: unknown): value is TimeZoneId {
  return typeof value === 'string' && value.length > 0;
}
