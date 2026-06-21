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
