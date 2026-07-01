import type {
  ClassifiedMergeError,
  FieldConflict,
  MergeErrorKind,
  MergeFieldChoices,
  WinnerSide,
} from './types/index';

/**
 * Generate a fresh idempotency key for a merge submission. Prefers
 * `crypto.randomUUID()` when available; falls back to a Web Crypto
 * `getRandomValues`-based UUID v4 for older runtimes (RFC 4122).
 */
export function generateMergeIdempotencyKey(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Merge the recommended defaults from `conflicts` into an existing `choices`
 * map without clobbering manual edits. Returns the same reference when nothing
 * changed, so React callers can short-circuit redundant state updates.
 */
export function seedFieldChoices(
  conflicts: readonly FieldConflict[],
  previous: MergeFieldChoices
): MergeFieldChoices {
  if (conflicts.length === 0) return previous;
  let next: Record<string, WinnerSide> | null = null;
  for (const conflict of conflicts) {
    if (!(conflict.fieldPath in previous)) {
      next ??= { ...previous };
      next[conflict.fieldPath] = conflict.default;
    }
  }
  return next ?? previous;
}

/**
 * Resolve the effective winner for a conflict given the current choices — the
 * explicit override if present, otherwise the recommended default.
 */
export function resolveWinner(conflict: FieldConflict, choices: MergeFieldChoices): WinnerSide {
  return choices[conflict.fieldPath] ?? conflict.default;
}

/**
 * Classify a failed merge (Axios error or otherwise) into a stable
 * {@link MergeErrorKind} plus the server-provided ProblemDetails `detail`.
 * UI layers own the i18n — this stays framework- and locale-agnostic.
 *
 * - `409` → `conflict` (already merged / idempotency-key reuse / concurrent race)
 * - `422` → `domain` (invariant violation: tenant / kind / currency mismatch, …)
 * - `404` → `notFound` (survivor or loser missing)
 * - `400` → `validation`
 * - anything else → `unknown`
 */
export function classifyMergeError(error: unknown): ClassifiedMergeError {
  const response = (
    error as {
      response?: { status?: number; data?: { detail?: string; title?: string } };
    } | null
  )?.response;
  const status = response?.status ?? null;
  const detail = response?.data?.detail ?? response?.data?.title ?? null;

  let kind: MergeErrorKind;
  switch (status) {
    case 409:
      kind = 'conflict';
      break;
    case 422:
      kind = 'domain';
      break;
    case 404:
      kind = 'notFound';
      break;
    case 400:
      kind = 'validation';
      break;
    default:
      kind = 'unknown';
  }

  return { kind, detail, status };
}
