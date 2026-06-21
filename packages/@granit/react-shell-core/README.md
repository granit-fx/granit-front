# @granit/react-shell-core

React bindings for [`@granit/shell-core`](../shell-core) — the shell-agnostic
substrate shared by every Granit **React** app shell (admin, mobile, site).
The chrome (sidebar/topbar vs tab-bar vs header-footer) lives in the per-shell
packages; this package holds what they all share.

## Contents

- **`ColorThemeStoreProvider` / `useColorThemeStore`** — inject a colour-theme
  store (from `createColorThemeStore`) into the React tree via context (not a
  module singleton) and read it with a selector.
- **`ThemeProvider`** — dark/light/system via `next-themes` (`class` attribute).
  Orthogonal to the colour theme: dark mode toggles `.dark`, the colour theme
  sets `<html data-theme>`; the ui-theme `.dark[data-theme=…]` palettes need both.

_(Navigation rendering helpers, auth context and router infra land here in later
steps of the foundation extraction.)_

## Consumption

Source-direct in the Granit monorepo and the showcases (pnpm `link:` + Vite
alias → `src/`).
