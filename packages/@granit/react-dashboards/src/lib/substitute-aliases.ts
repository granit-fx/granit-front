import type { DashboardAliasValues } from '../components/dashboard-alias-context';

/**
 * Regex matching `${aliasName}` placeholders. The alias name must
 * match the camel-case-with-dots convention the framework uses
 * (`currentCustomer`, `selectedDevice`). Loose enough to also handle
 * ad-hoc names; strict enough to refuse spaces / SQL-style injection.
 */
const PLACEHOLDER = /\$\{([A-Za-z][A-Za-z0-9_.]*)\}/g;

/**
 * Substitutes `${aliasName}` placeholders in a string with the
 * resolved alias value. Used by the filter-values plumbing to expand
 * clauses like `{ field: 'customer.id', op: 'Eq', value: '${currentCustomer}' }`
 * into a concrete request before sending.
 *
 * Unknown placeholders (no matching key in `aliases`) are left
 * verbatim — same behaviour as the backend's `IVariableSubstituter`,
 * which lets per-widget substitution downstream catch them. This
 * matches the principle that the frontend should be transparent: it
 * doesn't reject inputs it doesn't understand, just forwards them.
 *
 * Pass `null` / `undefined` for `aliases` to leave every placeholder
 * verbatim (useful for tests / callers without an alias provider).
 *
 * Pure function, no React deps.
 */
export function substituteAliases(
  value: string,
  aliases: DashboardAliasValues | null | undefined
): string {
  if (!aliases) return value;
  return value.replaceAll(PLACEHOLDER, (match, name: string) => aliases[name] ?? match);
}

/**
 * Recursively substitutes `${aliasName}` placeholders in every
 * string-valued entry of a `Record<string, string>` (the shape
 * `DashboardRenderRequest.filters` uses). Non-string values are left
 * untouched on the off-chance the caller passes a heterogeneous map.
 */
export function substituteAliasesInRecord(
  record: Readonly<Record<string, string>>,
  aliases: DashboardAliasValues | null | undefined
): Readonly<Record<string, string>> {
  if (!aliases || Object.keys(aliases).length === 0) return record;
  let mutated = false;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    const next = substituteAliases(value, aliases);
    if (next !== value) mutated = true;
    out[key] = next;
  }
  return mutated ? out : record;
}
