# @granit/ui-theme

Granit admin **design tokens** — the foundation stylesheet (`base.css`) of
semantic CSS custom properties shared by every Granit admin application, plus a
tiny TypeScript barrel that keeps the colour-theme list and swatch colours in
sync with the CSS palettes.

This is a **tooling / design-token** package, not a component or React layer. Its
primary artifact is the `@granit/ui-theme/base.css` stylesheet imported after
Tailwind v4; the `index.ts` barrel exports only the constants a theme switcher
needs (`COLOR_THEMES`, `COLOR_THEME_SWATCHES`, …) so the palettes defined in CSS
and the TypeScript theme union can never drift apart. It has no backend
counterpart and no `react-ui-theme` admin kit — the React binding lives one layer
up: the framework-agnostic store is [`@granit/shell-core`](../shell-core)
(`createColorThemeStore`), its React provider is
[`@granit/react-shell-core`](../react-shell-core) (`ColorThemeStoreProvider`),
and the user-facing colour/mode menu is `NavUserThemeMenu` in
[`@granit/react-ui-shell-admin`](../react-ui-shell-admin).

Tokens are semantic: components (`@granit/react-ui`, the `@granit/react-ui-*`
domain kits) consume `bg-primary`, `text-foreground`, `bg-sidebar`, … rather than
raw colours, so redefining a CSS variable in a consuming app re-brands the whole
UI without touching component code.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. This package has **no
runtime dependencies and no peer dependencies**: the stylesheet only requires
Tailwind CSS v4 in the consuming app (so its `@theme` / `@custom-variant` /
`@layer` directives are processed), and the TypeScript barrel is pure constants.

To wire the reactive colour-theme axis you additionally pull in the sibling
packages [`@granit/shell-core`](../shell-core) and
[`@granit/react-shell-core`](../react-shell-core); dark/light mode is toggled by
adding the `.dark` class to `<html>` (typically via `next-themes`).

## Quick start

Import the base stylesheet **after** `tailwindcss` in your global stylesheet so
Tailwind v4 inlines it and processes its directives:

```css
@import 'tailwindcss';
@import '@granit/ui-theme/base.css';
```

Re-brand the app by redefining any token in your own stylesheet — the change
cascades to every component:

```css
:root {
  --color-primary: #ff0000;
}
```

The stylesheet ships five built-in colour themes selected via a `data-theme`
attribute on `<html>` (`blue` (default), `teal`, `rose`, `amber`, `slate`), each
with a dark-mode variant under `.dark`. Drive that axis from TypeScript using the
exported constants as the single source of truth for a theme switcher — the
swatch colours are literal values (not `var(--color-primary)`, which would
resolve to the *active* theme for every dot):

```tsx
import { COLOR_THEMES, COLOR_THEME_SWATCHES } from '@granit/ui-theme';
import { useColorThemeStore } from '@granit/react-shell-core';

function ColorThemePicker() {
  const colorTheme = useColorThemeStore((s) => s.colorTheme);
  const setColorTheme = useColorThemeStore((s) => s.setColorTheme);

  return COLOR_THEMES.map((theme) => (
    <button key={theme} type="button" onClick={() => setColorTheme(theme)}>
      <span style={{ backgroundColor: COLOR_THEME_SWATCHES[theme] }} />
      {theme}
      {colorTheme === theme && ' ✓'}
    </button>
  ));
}
```

`setColorTheme` (from the `@granit/shell-core` store) writes the choice to
`<html data-theme>`, which activates the matching `[data-theme=…]` palette block
in `base.css`. Type the app's theme union from `ColorTheme` so the CSS and the
TypeScript list cannot diverge.

## Public API

The `index.ts` barrel exports four symbols; the CSS surface (the actual tokens)
lives in `base.css`, reached via the `@granit/ui-theme/base.css` subpath.

| Symbol                 | Kind  | Purpose                                                          |
| ---------------------- | ----- | ---------------------------------------------------------------- |
| `COLOR_THEMES`         | const | The shipped theme names (`blue`/`teal`/`rose`/`amber`/`slate`)   |
| `ColorTheme`           | type  | Union of `COLOR_THEMES` — type an app's theme state from this    |
| `DEFAULT_COLOR_THEME`  | const | Theme applied when no `data-theme` attribute is present (`blue`) |
| `COLOR_THEME_SWATCHES` | const | `Record<ColorTheme, string>` of literal preview colours per dot  |

`@granit/ui-theme/base.css` — the foundation stylesheet. It defines the admin
accent / alert / success / warning palettes, the shadcn/ui semantic tokens
(`--color-primary`, `--color-background`, `--color-foreground`, `--color-card`,
`--color-border`, …), typography (`--font-sans`, `--font-mono`), shadows, border
radius, the `.dark` overrides for every token, the five `[data-theme=…]` colour
palettes (each with a `.dark` variant), the `card-shadow` / `header-shadow`
utilities, and the `--sidebar-*` variables that follow the active colour theme.

## Out of scope / caveats

- **Tokens only.** This package contains palettes, dark mode, the per-app colour
  themes and the sidebar variables — nothing else. App- and feature-specific CSS
  (font loading, `flag-icons`, the `data-granit-*` entity/gallery component
  styles, the reaction-bar glyphs, the scrollbar utility) stays in the consuming
  app's own stylesheet.
- **Import order matters.** `base.css` must be imported *after*
  `@import 'tailwindcss'`; the `@theme`, `@custom-variant` and `@layer`
  directives are Tailwind v4 constructs and are only meaningful once Tailwind
  inlines the file.
- **No React, no reactive state.** The barrel is pure constants. The reactive
  theme store (persistence to `localStorage`, `<html data-theme>` reflection)
  lives in [`@granit/shell-core`](../shell-core) and its provider in
  [`@granit/react-shell-core`](../react-shell-core); the swatches are kept here,
  beside the palettes, only so a switcher's preview dots can never drift from the
  CSS.
- **Two orthogonal axes.** Light/dark/system is the `.dark` class (owned by the
  app, e.g. via `next-themes`); the colour theme is the `data-theme` attribute
  (owned by the colour-theme store). They compose: `.dark[data-theme='teal']`.
- **Swatches are literal by design.** `COLOR_THEME_SWATCHES` holds hard-coded hex
  values rather than `var(--color-primary)` so a switcher can render every dot in
  its own theme colour; a `var()` reference would resolve to the single *active*
  theme for all dots.

## License

Apache-2.0
