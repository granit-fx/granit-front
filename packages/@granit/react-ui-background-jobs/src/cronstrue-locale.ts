/**
 * Maps BCP 47 language tags to cronstrue locale file names.
 * cronstrue uses underscores for regional variants (pt_BR, zh_CN, zh_TW).
 * Tags without a dedicated cronstrue file fall back to their base language (es-MX → es).
 * hi (Hindi) has no cronstrue locale — falls back to 'en' via the ?? 'en' default.
 */
const LOCALE_MAP: Record<string, string> = {
  af: 'af',
  ar: 'ar',
  be: 'be',
  bg: 'bg',
  ca: 'ca',
  cs: 'cs',
  da: 'da',
  de: 'de',
  en: 'en',
  'en-GB': 'en',
  es: 'es',
  'es-MX': 'es',
  fa: 'fa',
  fi: 'fi',
  fr: 'fr',
  'fr-CA': 'fr',
  he: 'he',
  hr: 'hr',
  hu: 'hu',
  id: 'id',
  it: 'it',
  ja: 'ja',
  ko: 'ko',
  my: 'my',
  nb: 'nb',
  nl: 'nl',
  pl: 'pl',
  pt: 'pt_PT',
  'pt-BR': 'pt_BR',
  ro: 'ro',
  ru: 'ru',
  sk: 'sk',
  sl: 'sl',
  sr: 'sr',
  sv: 'sv',
  sw: 'sw',
  th: 'th',
  tr: 'tr',
  uk: 'uk',
  vi: 'vi',
  zh: 'zh_CN',
  'zh-TW': 'zh_TW',
};

const loaded = new Set<string>();

/**
 * Explicit static `import()` specifiers per cronstrue locale, so Vite resolves
 * the bare package paths at build time — a templated `import()` of a
 * node_modules path would not be statically analyzable.
 */
const LOCALE_LOADERS: Record<string, () => Promise<unknown>> = {
  af: () => import('cronstrue/locales/af'),
  ar: () => import('cronstrue/locales/ar'),
  be: () => import('cronstrue/locales/be'),
  bg: () => import('cronstrue/locales/bg'),
  ca: () => import('cronstrue/locales/ca'),
  cs: () => import('cronstrue/locales/cs'),
  da: () => import('cronstrue/locales/da'),
  de: () => import('cronstrue/locales/de'),
  en: () => import('cronstrue/locales/en'),
  es: () => import('cronstrue/locales/es'),
  fa: () => import('cronstrue/locales/fa'),
  fi: () => import('cronstrue/locales/fi'),
  fr: () => import('cronstrue/locales/fr'),
  he: () => import('cronstrue/locales/he'),
  hr: () => import('cronstrue/locales/hr'),
  hu: () => import('cronstrue/locales/hu'),
  id: () => import('cronstrue/locales/id'),
  it: () => import('cronstrue/locales/it'),
  ja: () => import('cronstrue/locales/ja'),
  ko: () => import('cronstrue/locales/ko'),
  my: () => import('cronstrue/locales/my'),
  nb: () => import('cronstrue/locales/nb'),
  nl: () => import('cronstrue/locales/nl'),
  pl: () => import('cronstrue/locales/pl'),
  pt_PT: () => import('cronstrue/locales/pt_PT'),
  pt_BR: () => import('cronstrue/locales/pt_BR'),
  ro: () => import('cronstrue/locales/ro'),
  ru: () => import('cronstrue/locales/ru'),
  sk: () => import('cronstrue/locales/sk'),
  sl: () => import('cronstrue/locales/sl'),
  sr: () => import('cronstrue/locales/sr'),
  sv: () => import('cronstrue/locales/sv'),
  sw: () => import('cronstrue/locales/sw'),
  th: () => import('cronstrue/locales/th'),
  tr: () => import('cronstrue/locales/tr'),
  uk: () => import('cronstrue/locales/uk'),
  vi: () => import('cronstrue/locales/vi'),
  zh_CN: () => import('cronstrue/locales/zh_CN'),
  zh_TW: () => import('cronstrue/locales/zh_TW'),
};

/** Returns the cronstrue locale name for a given BCP 47 language tag. */
export function getCronstrueLocale(language: string): string {
  const base = language.split('-')[0] ?? language;
  return LOCALE_MAP[language] ?? LOCALE_MAP[base] ?? 'en';
}

/** Lazily imports a cronstrue locale file. No-ops if already loaded. */
export async function loadCronstrueLocale(language: string): Promise<void> {
  const locale = getCronstrueLocale(language);
  if (loaded.has(locale)) return;
  loaded.add(locale);
  await LOCALE_LOADERS[locale]?.();
}
