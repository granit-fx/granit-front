# @granit/shell-core

Framework-agnostic substrate shared by every Granit app shell (admin, mobile,
site) **and** any UI framework. Headless logic only — no React, no DOM-framework
coupling — so a future `@granit/angular-*` shell reuses it unchanged.

## Contents

- **`createColorThemeStore`** — a vanilla Zustand store that persists the active
  colour theme and reflects it onto `<html data-theme>` (so the
  [`@granit/ui-theme`](../ui-theme) `[data-theme=…]` palettes apply). Created per
  call (not a module singleton) so multiple apps on one page stay independent.
  Bind it to a framework at the edge — React via
  [`@granit/react-shell-core`](../react-shell-core).

_(Navigation model + permission filtering and the API/query-client factory
config land here in later steps of the foundation extraction.)_

## Consumption

Source-direct in the Granit monorepo and the showcases (pnpm `link:` + Vite
alias → `src/`).
