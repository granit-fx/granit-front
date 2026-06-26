/**
 * The colour themes shipped by `base.css`, selected via a `data-theme` attribute
 * on `<html>` (each with a `.dark` variant). Single source of truth shared with
 * the theme store / switcher so the CSS palettes and the TypeScript catalogue can
 * never drift apart.
 *
 * This is the **base catalogue** (accent themes). A larger, opt-in catalogue of
 * full themes lives in `@granit/ui-themes`. An app assembles its offered list
 * from whichever catalogues it imports and passes the subset to the store.
 */

/**
 * A selectable theme as shown in a menu: `id` is the `data-theme` value, `swatch`
 * a literal preview-dot colour (NOT `var(--…)`, which would resolve to the active
 * theme for every dot). Structurally compatible with `ThemeDescriptor` from
 * `@granit/shell-core` (kept dependency-free here via structural typing).
 */
export interface ColorThemeDescriptor {
  readonly id: string;
  readonly label: string;
  readonly swatch: string;
}

/**
 * Base catalogue — the accent themes defined in `base.css`. Each `swatch` is the
 * light-mode `--primary` (blue: the `:root` default; others: their `-800` shade).
 */
export const COLOR_THEME_CATALOG = [
  { id: 'blue', label: 'Blue', swatch: 'oklch(42.4% 0.199 265.638)' }, // blue-800
  { id: 'teal', label: 'Teal', swatch: 'oklch(43.7% 0.078 188.216)' }, // teal-800
  { id: 'rose', label: 'Rose', swatch: 'oklch(45.5% 0.188 13.697)' }, // rose-800
  { id: 'amber', label: 'Amber', swatch: 'oklch(47.3% 0.137 46.201)' }, // amber-800
  { id: 'slate', label: 'Slate', swatch: 'oklch(27.9% 0.041 260.031)' }, // slate-800
  { id: 'mauve', label: 'Mauve', swatch: 'oklch(43.8% 0.218 303.724)' }, // purple-800
  { id: 'mist', label: 'Mist', swatch: 'oklch(44.3% 0.11 240.79)' }, // sky-800
] as const satisfies readonly ColorThemeDescriptor[];

export const COLOR_THEMES = COLOR_THEME_CATALOG.map((t) => t.id) as readonly ColorTheme[];

export type ColorTheme = (typeof COLOR_THEME_CATALOG)[number]['id'];

/** Applied when no `data-theme` attribute is present on `<html>`. */
export const DEFAULT_COLOR_THEME: ColorTheme = 'blue';

/** Derived id→swatch map (back-compat; prefer `COLOR_THEME_CATALOG`). */
export const COLOR_THEME_SWATCHES = Object.fromEntries(
  COLOR_THEME_CATALOG.map((t) => [t.id, t.swatch])
) as Record<ColorTheme, string>;
