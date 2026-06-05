import type { FilterEntry } from '@granit/query-engine';

/**
 * Derives a data-lookup `scope` map from the currently active filters, wiring
 * cascading lookups (e.g. a "meter" picker scoped to the selected "tenant")
 * WITHOUT coupling the SmartFilter to a form library.
 *
 * For each declared scope key, the value is taken from an active equality
 * (`Eq`) filter on the matching field. Backend scope keys are camelCase
 * (`tenantId`) while filterable field names are PascalCase (`TenantId`), so the
 * match is case-insensitive. A key with no satisfying filter maps to
 * `undefined`, which `useLookup`'s Empty Scope Trap reads as "scope incomplete —
 * do not fire".
 *
 * @example
 * deriveLookupScope(['tenantId'], [{ field: 'TenantId', operator: 'Eq', value: 'acme' }])
 * // → { tenantId: 'acme' }
 */
export function deriveLookupScope(
  scopeKeys: readonly string[] | undefined,
  filters: readonly FilterEntry[]
): Readonly<Record<string, string | undefined>> {
  const scope: Record<string, string | undefined> = {};
  if (!scopeKeys || scopeKeys.length === 0) return scope;
  for (const key of scopeKeys) {
    const lowerKey = key.toLowerCase();
    const match = filters.find((f) => f.operator === 'Eq' && f.field.toLowerCase() === lowerKey);
    scope[key] = match?.value;
  }
  return scope;
}
