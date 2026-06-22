/// <reference path="./cronstrue-locales.d.ts" />

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
  // Explicit static imports so Vite can resolve bare specifiers at build time.
  switch (locale) {
    case 'af':
      await import('cronstrue/locales/af');
      break;
    case 'ar':
      await import('cronstrue/locales/ar');
      break;
    case 'be':
      await import('cronstrue/locales/be');
      break;
    case 'bg':
      await import('cronstrue/locales/bg');
      break;
    case 'ca':
      await import('cronstrue/locales/ca');
      break;
    case 'cs':
      await import('cronstrue/locales/cs');
      break;
    case 'da':
      await import('cronstrue/locales/da');
      break;
    case 'de':
      await import('cronstrue/locales/de');
      break;
    case 'en':
      await import('cronstrue/locales/en');
      break;
    case 'es':
      await import('cronstrue/locales/es');
      break;
    case 'fa':
      await import('cronstrue/locales/fa');
      break;
    case 'fi':
      await import('cronstrue/locales/fi');
      break;
    case 'fr':
      await import('cronstrue/locales/fr');
      break;
    case 'he':
      await import('cronstrue/locales/he');
      break;
    case 'hr':
      await import('cronstrue/locales/hr');
      break;
    case 'hu':
      await import('cronstrue/locales/hu');
      break;
    case 'id':
      await import('cronstrue/locales/id');
      break;
    case 'it':
      await import('cronstrue/locales/it');
      break;
    case 'ja':
      await import('cronstrue/locales/ja');
      break;
    case 'ko':
      await import('cronstrue/locales/ko');
      break;
    case 'my':
      await import('cronstrue/locales/my');
      break;
    case 'nb':
      await import('cronstrue/locales/nb');
      break;
    case 'nl':
      await import('cronstrue/locales/nl');
      break;
    case 'pl':
      await import('cronstrue/locales/pl');
      break;
    case 'pt_PT':
      await import('cronstrue/locales/pt_PT');
      break;
    case 'pt_BR':
      await import('cronstrue/locales/pt_BR');
      break;
    case 'ro':
      await import('cronstrue/locales/ro');
      break;
    case 'ru':
      await import('cronstrue/locales/ru');
      break;
    case 'sk':
      await import('cronstrue/locales/sk');
      break;
    case 'sl':
      await import('cronstrue/locales/sl');
      break;
    case 'sr':
      await import('cronstrue/locales/sr');
      break;
    case 'sv':
      await import('cronstrue/locales/sv');
      break;
    case 'sw':
      await import('cronstrue/locales/sw');
      break;
    case 'th':
      await import('cronstrue/locales/th');
      break;
    case 'tr':
      await import('cronstrue/locales/tr');
      break;
    case 'uk':
      await import('cronstrue/locales/uk');
      break;
    case 'vi':
      await import('cronstrue/locales/vi');
      break;
    case 'zh_CN':
      await import('cronstrue/locales/zh_CN');
      break;
    case 'zh_TW':
      await import('cronstrue/locales/zh_TW');
      break;
  }
}
