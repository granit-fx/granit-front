import type { ColorThemeDescriptor } from '@granit/ui-theme';

/**
 * Full-theme catalogue — descriptors for the themes shipped by
 * `@granit/ui-themes/themes.css`. Each `id` matches a `[data-theme='…']` block
 * there; `swatch` is the theme's light-mode `--primary`. An app picks the subset
 * it offers and passes the descriptors to `createColorThemeStore({ themes })`,
 * combined with the base catalogue from `@granit/ui-theme` and any local themes.
 */
export const UI_THEMES_CATALOG = [
  {
    id: 'sage-garden',
    label: 'Sage Garden',
    swatch: 'oklch(0.6333 0.0309 154.9039)', // light --primary (sage green)
  },
  {
    id: 'astrovista',
    label: 'AstroVista',
    swatch: 'oklch(0.6420 0.1691 38.5815)', // light --primary (warm orange)
  },
] as const satisfies readonly ColorThemeDescriptor[];

export type UiThemeId = (typeof UI_THEMES_CATALOG)[number]['id'];
