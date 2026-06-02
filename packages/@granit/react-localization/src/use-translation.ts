import {
  type FallbackNs,
  type UseTranslationOptions,
  type UseTranslationResponse,
  useTranslation as useReactI18NextTranslation,
} from 'react-i18next';

import type { FlatNamespace, KeyPrefix, Namespace } from 'i18next';

/**
 * Re-exports `react-i18next`'s `useTranslation` with one bridge:
 * when the consumer passes an explicit non-default namespace, the
 * returned `t` function applies the standard separators (`:` for
 * namespace, `.` for nested keys) per call.
 *
 * Why: Granit framework packages (e.g. `@granit/react-workflow`,
 * `@granit/react-parties`) ship NESTED resource bundles meant to be
 * traversed via the `.` key separator. Consumer apps that also load
 * flat backend-shipped bundles (Granit Localization API, with literal
 * `:` and `.` characters inside keys like `Dashboard:X.Description`)
 * typically disable both separators globally via
 * `i18n.options.nsSeparator = false` and `i18n.options.keySeparator = false`.
 *
 * With separators disabled globally, framework lookups against nested
 * bundles fail — the key string is returned verbatim because i18next
 * cannot find a literal flat key matching the nested path. This hook
 * detects the situation (custom ns + global separators disabled) and
 * passes `keySeparator: '.'` / `nsSeparator: ':'` overrides at call
 * time, so the framework bundle resolves correctly without forcing the
 * app to re-enable separators globally.
 *
 * Default-namespace calls (`useTranslation()`) keep the app's global
 * configuration untouched — backend flat bundles continue to resolve
 * against literal keys.
 */
export function useTranslation<
  Ns extends FlatNamespace | readonly [FlatNamespace?, ...FlatNamespace[]] = 'translation',
  KPrefix extends KeyPrefix<FallbackNs<Ns>> = undefined,
>(
  ns?: Ns,
  options?: UseTranslationOptions<KPrefix>
): UseTranslationResponse<FallbackNs<Ns>, KPrefix> {
  const result = useReactI18NextTranslation(ns as Namespace, options);
  const { t, i18n } = result;

  const defaultNs = i18n.options?.defaultNS;
  const usesCustomNs =
    ns !== undefined &&
    (Array.isArray(ns)
      ? !ns.every((entry) => entry === undefined || entry === defaultNs)
      : ns !== defaultNs);

  const separatorsDisabled =
    i18n.options?.nsSeparator === false || i18n.options?.keySeparator === false;

  if (!usesCustomNs || !separatorsDisabled) {
    return result;
  }

  // i18next's `t` has many overloads (key+options, key+defaultValue+options, …).
  // Forward all args verbatim and inject the separator overrides into the
  // options object on whichever position holds it. The `t` function carries
  // a unique brand (`$TFunctionBrand`) that direct casts can't reproduce, so
  // we route through `unknown` both for the underlying call and the result.
  const separators = { keySeparator: '.' as const, nsSeparator: ':' as const };
  const rawT = t as unknown as (...a: unknown[]) => unknown;
  const wrappedT = function wrappedT(...args: unknown[]) {
    const lastIndex = args.length - 1;
    const last = args[lastIndex];
    if (typeof last === 'object' && last !== null) {
      args[lastIndex] = { ...separators, ...last };
    } else {
      args.push(separators);
    }
    return rawT(...args);
  } as unknown as typeof t;

  return { ...result, t: wrappedT };
}
