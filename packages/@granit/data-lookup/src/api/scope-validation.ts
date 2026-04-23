import type { LookupDescriptor } from '../types/index.js';

/**
 * Checks that every key declared in `descriptor.scopeKeys` is present and non-empty
 * in the provided `scope` object. Returns the missing key name when incomplete,
 * otherwise `null`.
 *
 * This is the **Empty Scope Trap** guard: when a scoped lookup is mounted on a
 * form whose parent field has not yet been filled (e.g., `meters` scoped by
 * `tenantId` on a blank creation form), we must NOT fire an unscoped request
 * — the backend returns 400, and the worst case would be a multi-tenant leak
 * if validation were bypassed.
 */
export function findMissingScopeKey(
  descriptor: LookupDescriptor,
  scope: Readonly<Record<string, string | null | undefined>> | undefined
): string | null {
  const required = descriptor.scopeKeys ?? [];
  if (required.length === 0) {
    return null;
  }

  for (const key of required) {
    const value = scope?.[key];
    if (value === null || value === undefined || value === '') {
      return key;
    }
  }

  return null;
}

/** Returns `true` when the descriptor is ready to emit a request. */
export function isScopeSatisfied(
  descriptor: LookupDescriptor,
  scope: Readonly<Record<string, string | null | undefined>> | undefined
): boolean {
  return findMissingScopeKey(descriptor, scope) === null;
}
