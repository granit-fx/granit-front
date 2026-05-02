import type { WidgetActionDispatchContext } from './widget-action-handler.js';

/**
 * Regex matching `${expression}` placeholders. Expressions may contain
 * letters, digits, dots, and underscores — covers `${currentCustomer}`,
 * `${row.customerId}`, `${row.invoice_number}` patterns.
 */
const PLACEHOLDER = /\$\{([A-Za-z][A-Za-z0-9_.]*)\}/g;

/**
 * Resolves a placeholder expression against the dispatch context.
 *
 * Convention:
 * - `row.field` — looks up `context.row[field]`. Nested keys are
 *   intentionally NOT supported in v1 (`row.customer.id` only resolves
 *   if `row['customer.id']` exists). Apps wanting nested access flatten
 *   before dispatch.
 * - bare name — looks up `context.aliases[name]` (entity alias).
 *
 * Returns `null` when the lookup fails — the caller decides whether
 * to leave the placeholder verbatim or substitute an empty string.
 */
function resolvePlaceholder(
  expression: string,
  context: Pick<WidgetActionDispatchContext, 'row' | 'aliases'>
): string | null {
  if (expression.startsWith('row.')) {
    const key = expression.slice(4);
    const value = context.row?.[key];
    if (value === undefined || value === null) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
      return value.toString();
    }
    return JSON.stringify(value);
  }
  return context.aliases?.[expression] ?? null;
}

/**
 * Expands `${row.field}` and `${aliasName}` placeholders in a single
 * string value. Unknown placeholders are left verbatim so the
 * upstream consumer (or backend, in cases where the resolved string
 * is sent to the server) can take a second pass.
 */
export function expandActionPlaceholders(
  value: string,
  context: Pick<WidgetActionDispatchContext, 'row' | 'aliases'>
): string {
  return value.replaceAll(PLACEHOLDER, (match, expression: string) => {
    const resolved = resolvePlaceholder(expression, context);
    return resolved ?? match;
  });
}

/**
 * Resolves an action's `params` map by expanding every value's
 * `${...}` placeholders against the dispatch context. Pure function
 * — used by the framework's default handlers, exported so custom
 * handlers reuse the same substitution rules.
 */
export function expandActionParams(
  params: Readonly<Record<string, string>> | null | undefined,
  context: Pick<WidgetActionDispatchContext, 'row' | 'aliases'>
): Readonly<Record<string, string>> {
  if (!params) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    out[key] = expandActionPlaceholders(value, context);
  }
  return out;
}

/**
 * Resolves an action's `target` + `params` together. The `target`
 * goes through the same `${...}` substitution rules so route
 * templates like `/customers/${row.customerId}` work without a
 * separate plumbing.
 */
export function expandActionTargetAndParams(
  target: string,
  params: Readonly<Record<string, string>> | null | undefined,
  context: Pick<WidgetActionDispatchContext, 'row' | 'aliases'>
): { readonly target: string; readonly params: Readonly<Record<string, string>> } {
  return {
    target: expandActionPlaceholders(target, context),
    params: expandActionParams(params, context),
  };
}
