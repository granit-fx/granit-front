# @granit/ui-themes

Granit's **opt-in full-theme catalogue** — complete, shadcn/tweakcn-style themes
layered on the [`@granit/ui-theme`](../ui-theme) token contract. Where
`@granit/ui-theme` ships the **mechanism** (the `--background`/`--primary`/…
variables, dark mode, the `@theme inline` bridge) plus a small set of **accent
themes**, this package is the growable **catalogue of full themes** an app can
opt into: each one re-skins colours, typography, radius, shadows and density, not
just the accent.

It is intentionally a separate package so the foundation stays lean and
app-agnostic — aesthetics live here, behind an explicit install.

## How it works

Each theme is a single `[data-theme='id']` (light + theme-level vars) plus a
`.dark[data-theme='id']` (dark colours) block in `themes.css`, scoped so many
themes coexist and the app switches by setting `<html data-theme>`. Because
`@granit/ui-theme` uses the shadcn variable names and an `@theme inline` bridge,
a theme exported by the **shadcn registry / tweakcn** drops in almost verbatim —
its `cssVars` map 1:1; the only transform is scoping them under `[data-theme]`.

## Usage

Import the stylesheet after Tailwind + the base contract, then offer the matching
descriptors in your theme store's subset:

```css
@import 'tailwindcss';
@import '@granit/ui-theme/base.css';
@import '@granit/ui-themes/themes.css';
```

```ts
import { COLOR_THEME_CATALOG } from '@granit/ui-theme';
import { UI_THEMES_CATALOG } from '@granit/ui-themes';
import { createColorThemeStore } from '@granit/shell-core';

// Offer the subset this app wants — base accents + the full themes you like.
const store = createColorThemeStore({
  storageKey: 'my-app-theme',
  defaultTheme: 'blue',
  themes: [...COLOR_THEME_CATALOG, ...UI_THEMES_CATALOG],
});
```

Each entry is a `{ id, label, swatch }` descriptor; `NavUserThemeMenu`
(`@granit/react-ui-shell-admin`) renders exactly the descriptors the store was
given, so the menu is self-curated — no central swatch registry.

## Caveats

- **Fonts are referenced, not bundled.** A theme may set
  `--font-sans: 'Antic', …` / `--font-serif: 'Signifier', …`; load those in the
  app (e.g. Antic via Google Fonts) or they fall back to the next family.
- **Density.** A full theme may override `--spacing` / `--radius`, rescaling
  spacing and corners app-wide while it is active — that is intentional.
- Blocks are converted verbatim from the source registry JSON; re-run the
  conversion (scope `cssVars.{theme,light}` → `[data-theme]`, `cssVars.dark` →
  `.dark[data-theme]`, prefix names with `--`) to add or refresh a theme.

## License

Apache-2.0
