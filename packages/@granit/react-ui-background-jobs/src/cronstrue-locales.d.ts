// cronstrue ships its locale files under `cronstrue/locales/*` (e.g. `cronstrue/locales/fr`)
// without bundled type declarations. `loadCronstrueLocale` dynamic-imports them for their
// registration side effect only, so a wildcard ambient module declaration is enough.
declare module 'cronstrue/locales/*';
