import { enUS } from 'date-fns/locale';
import { useEffect, useState } from 'react';

import { logger } from './logger';

import type { Locale } from 'date-fns/locale';

/** Alias for i18n codes that don't have a matching date-fns locale file. */
const LOCALE_ALIAS: Record<string, string> = {
  en: 'en-US',
  zh: 'zh-CN',
};

const DEFAULT_LOCALE = enUS;
const cache = new Map<string, Locale>();
cache.set('en', DEFAULT_LOCALE);
cache.set('en-US', DEFAULT_LOCALE);

/**
 * Lazy loader map — each entry returns a dynamic `import()` for one date-fns locale.
 * Using explicit keys avoids Vite's limitation with template-string dynamic imports
 * (date-fns exports map doesn't allow subpath patterns).
 */
const LOCALE_LOADERS: Record<string, () => Promise<Record<string, Locale>>> = {
  af: () => import('date-fns/locale/af') as Promise<Record<string, Locale>>,
  ar: () => import('date-fns/locale/ar') as Promise<Record<string, Locale>>,
  be: () => import('date-fns/locale/be') as Promise<Record<string, Locale>>,
  bg: () => import('date-fns/locale/bg') as Promise<Record<string, Locale>>,
  ca: () => import('date-fns/locale/ca') as Promise<Record<string, Locale>>,
  cs: () => import('date-fns/locale/cs') as Promise<Record<string, Locale>>,
  cy: () => import('date-fns/locale/cy') as Promise<Record<string, Locale>>,
  da: () => import('date-fns/locale/da') as Promise<Record<string, Locale>>,
  de: () => import('date-fns/locale/de') as Promise<Record<string, Locale>>,
  el: () => import('date-fns/locale/el') as Promise<Record<string, Locale>>,
  'en-AU': () => import('date-fns/locale/en-AU') as Promise<Record<string, Locale>>,
  'en-CA': () => import('date-fns/locale/en-CA') as Promise<Record<string, Locale>>,
  'en-GB': () => import('date-fns/locale/en-GB') as Promise<Record<string, Locale>>,
  'en-IN': () => import('date-fns/locale/en-IN') as Promise<Record<string, Locale>>,
  'en-NZ': () => import('date-fns/locale/en-NZ') as Promise<Record<string, Locale>>,
  'en-US': () => import('date-fns/locale/en-US') as Promise<Record<string, Locale>>,
  'en-ZA': () => import('date-fns/locale/en-ZA') as Promise<Record<string, Locale>>,
  es: () => import('date-fns/locale/es') as Promise<Record<string, Locale>>,
  et: () => import('date-fns/locale/et') as Promise<Record<string, Locale>>,
  fi: () => import('date-fns/locale/fi') as Promise<Record<string, Locale>>,
  fr: () => import('date-fns/locale/fr') as Promise<Record<string, Locale>>,
  'fr-CA': () => import('date-fns/locale/fr-CA') as Promise<Record<string, Locale>>,
  'fr-CH': () => import('date-fns/locale/fr-CH') as Promise<Record<string, Locale>>,
  he: () => import('date-fns/locale/he') as Promise<Record<string, Locale>>,
  hr: () => import('date-fns/locale/hr') as Promise<Record<string, Locale>>,
  hu: () => import('date-fns/locale/hu') as Promise<Record<string, Locale>>,
  id: () => import('date-fns/locale/id') as Promise<Record<string, Locale>>,
  is: () => import('date-fns/locale/is') as Promise<Record<string, Locale>>,
  it: () => import('date-fns/locale/it') as Promise<Record<string, Locale>>,
  ja: () => import('date-fns/locale/ja') as Promise<Record<string, Locale>>,
  ko: () => import('date-fns/locale/ko') as Promise<Record<string, Locale>>,
  lt: () => import('date-fns/locale/lt') as Promise<Record<string, Locale>>,
  lv: () => import('date-fns/locale/lv') as Promise<Record<string, Locale>>,
  nb: () => import('date-fns/locale/nb') as Promise<Record<string, Locale>>,
  nl: () => import('date-fns/locale/nl') as Promise<Record<string, Locale>>,
  'nl-BE': () => import('date-fns/locale/nl-BE') as Promise<Record<string, Locale>>,
  pl: () => import('date-fns/locale/pl') as Promise<Record<string, Locale>>,
  pt: () => import('date-fns/locale/pt') as Promise<Record<string, Locale>>,
  'pt-BR': () => import('date-fns/locale/pt-BR') as Promise<Record<string, Locale>>,
  ro: () => import('date-fns/locale/ro') as Promise<Record<string, Locale>>,
  ru: () => import('date-fns/locale/ru') as Promise<Record<string, Locale>>,
  sk: () => import('date-fns/locale/sk') as Promise<Record<string, Locale>>,
  sl: () => import('date-fns/locale/sl') as Promise<Record<string, Locale>>,
  sr: () => import('date-fns/locale/sr') as Promise<Record<string, Locale>>,
  sv: () => import('date-fns/locale/sv') as Promise<Record<string, Locale>>,
  th: () => import('date-fns/locale/th') as Promise<Record<string, Locale>>,
  tr: () => import('date-fns/locale/tr') as Promise<Record<string, Locale>>,
  uk: () => import('date-fns/locale/uk') as Promise<Record<string, Locale>>,
  vi: () => import('date-fns/locale/vi') as Promise<Record<string, Locale>>,
  'zh-CN': () => import('date-fns/locale/zh-CN') as Promise<Record<string, Locale>>,
  'zh-TW': () => import('date-fns/locale/zh-TW') as Promise<Record<string, Locale>>,
};

async function loadLocale(code: string): Promise<Locale> {
  const cached = cache.get(code);
  if (cached) return cached;

  const dateFnsCode = LOCALE_ALIAS[code] ?? code;
  const loader = LOCALE_LOADERS[dateFnsCode];
  if (!loader) {
    cache.set(code, DEFAULT_LOCALE);
    return DEFAULT_LOCALE;
  }
  try {
    const mod = await loader();
    const locale = mod.default ?? Object.values(mod).find((v) => v?.code != null);
    if (!locale) throw new Error(`No locale found for ${dateFnsCode}`);
    cache.set(code, locale);
    return locale;
  } catch (err: unknown) {
    logger.warn('Failed to load date-fns locale; falling back to default', { code, err });
    cache.set(code, DEFAULT_LOCALE);
    return DEFAULT_LOCALE;
  }
}

/**
 * Hook that dynamically loads a date-fns Locale matching the given i18n code.
 * Returns the default locale (en-US) until the import resolves, then re-renders.
 */
export function useDateLocale(locale: string): Locale {
  const [resolved, setResolved] = useState<Locale>(() => cache.get(locale) ?? DEFAULT_LOCALE);

  useEffect(() => {
    let cancelled = false;
    loadLocale(locale).then((loc) => {
      if (!cancelled) setResolved(loc);
    });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  return resolved;
}
