// Loose i18next TFunction shape — keeps the helper free of `react-i18next`
// peer typings so non-React callers (and headless code) can use it too.
type TranslateFn = (key: string) => string;

/**
 * Resolves a backend display key (e.g. `AuditingEndpoints:Workspace.Item`) to a
 * human label. With a `t` function, i18next is consulted first; otherwise (or
 * on a miss) it falls back to the last segment of the key, then to `fallback`.
 *
 * Apps configured with `nsSeparator: false; keySeparator: false` resolve
 * `t(displayKey)` as a literal lookup against the flat bundle — the
 * last-segment fallback only matters before the backend translations load.
 *
 * Shared by the workspace chrome (`@granit/react-ui-shell-admin`) and any host
 * that wires a manifest-driven `ResolveLabel` (e.g. for `@granit/react-entities`).
 */
export function resolveLabel(displayKey: string | null, fallback: string, t?: TranslateFn): string {
  if (!displayKey) return fallback;
  if (t) {
    const translated = t(displayKey);
    if (translated && translated !== displayKey) return translated;
  }
  const lastSegment = displayKey.split(/[.:]/).pop();
  return lastSegment && lastSegment.length > 0 ? lastSegment : fallback;
}
