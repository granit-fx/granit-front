import type { TFunction } from 'i18next';

/**
 * Resolves a widget's display title from its `titleLocalizationKey`.
 *
 * The key is first translated against the merged i18n bundle (the host-shipped
 * `Widget:*` / `Entity:*` keys). When it has no translation it is treated as a
 * **free-text literal** title — so a title typed in the editor shows verbatim —
 * UNLESS it looks like an unresolved `Namespace:…` localization key (e.g. the
 * composed `Widget:{Dashboard}.{Slug}.Title` default), which collapses to an
 * empty string so the widget renders without a header rather than a raw key.
 */
export function resolveWidgetTitle(t: TFunction, key: string | undefined): string {
  if (!key) return '';
  const resolved = t(key, { defaultValue: '' });
  if (resolved) return resolved;
  return /^[A-Za-z][\w.-]*:/.test(key) ? '' : key;
}
