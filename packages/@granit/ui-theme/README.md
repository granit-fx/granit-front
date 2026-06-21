# @granit/ui-theme

Granit admin design tokens. A single CSS stylesheet of semantic custom
properties — colour palettes, dark mode, per-app colour themes, typography,
shadows and sidebar variables — shared by every Granit admin application.

This is the **theme contract**: components (`@granit/react-ui`,
`@granit/react-admin-kit`, the `@granit/react-*` domain components) consume these
semantic tokens (`bg-primary`, `text-foreground`, …), so overriding a variable in
a consuming app re-brands the whole UI without touching component code.

## Usage

Import the base stylesheet **after** Tailwind so Tailwind v4 inlines it and
processes its `@theme` / `@custom-variant` / `@layer` directives:

```css
@import 'tailwindcss';
@import '@granit/ui-theme/base.css';
```

## Customising

### Light (just the colours)

Redefine the CSS variables in your own global stylesheet:

```css
:root {
  --color-primary: #ff0000;
}
```

### Per-app colour themes

The stylesheet ships five built-in colour themes selected via a `data-theme`
attribute on `<html>` (`blue` (default), `teal`, `rose`, `amber`, `slate`), each
with a dark-mode variant under `.dark`. Dark/light itself is toggled with the
`.dark` class (e.g. via `next-themes`).

## Scope

Tokens / palettes / dark mode / colour themes / sidebar variables **only**.
App- and feature-specific CSS (font loading, `flag-icons`, the `data-granit-*`
entity component styles, etc.) stays in the consuming app's own stylesheet.

## Consumption

Source-direct in the Granit monorepo and the showcases (pnpm `link:` + Vite
alias → `src/`). No build step. The `publishConfig` only serves publication to
GitHub Packages.
