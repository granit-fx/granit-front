import { parsePhoneNumberFromString } from 'libphonenumber-js';

/**
 * Format an E.164 phone number for display in the user's spaced
 * international form (e.g. `+32479123456` → `+32 479 12 34 56`).
 *
 * E.164 is the storage format on the wire; this helper is for read-side
 * rendering only. Falls back to the input as-is when the number cannot be
 * parsed (legacy entries, unexpected formats) so display never breaks.
 */
export function formatPhoneInternational(value: string | null | undefined): string {
  if (!value) return '';
  return parsePhoneNumberFromString(value)?.formatInternational() ?? value;
}
