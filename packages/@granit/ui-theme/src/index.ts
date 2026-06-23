/**
 * The colour themes shipped by `base.css`, selected via a `data-theme`
 * attribute on `<html>` (each with a `.dark` variant). Single source of truth
 * shared with the theme store / switcher so the CSS palettes and the TypeScript
 * theme list can never drift apart.
 */
export const COLOR_THEMES = ['blue', 'teal', 'rose', 'amber', 'slate'] as const;

export type ColorTheme = (typeof COLOR_THEMES)[number];

/** Applied when no `data-theme` attribute is present on `<html>`. */
export const DEFAULT_COLOR_THEME: ColorTheme = 'blue';

/**
 * Representative swatch colour for each theme — the light-mode `--color-primary`
 * defined in `base.css` (blue: `@theme` default; the others: their `-800` shade).
 * A theme switcher renders these as static preview dots, so they must be literal
 * values, not `var(--color-primary)` (which would resolve to the *active* theme
 * for every dot). Kept here, beside the palette, so the dots can never drift from
 * the CSS the way a hand-maintained per-app map would.
 */
export const COLOR_THEME_SWATCHES: Record<ColorTheme, string> = {
  blue: '#1e40af', // blue-800
  teal: '#115e59', // teal-800
  rose: '#9f1239', // rose-800
  amber: '#92400e', // amber-800
  slate: '#1e293b', // slate-800
};
