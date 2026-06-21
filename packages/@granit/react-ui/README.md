# @granit/react-ui

Granit's React primitive component library — the lowest UI layer shared by every
Granit app. Headless-first [shadcn/ui](https://ui.shadcn.com) primitives (Radix UI

- Tailwind, styled through [`@granit/utils`](../utils) `cn`), re-exported as a
  single `@granit/*` package so apps and higher-level kits depend on one stable
  barrel instead of copying components in.

Provides:

- **Form controls** — `Button`, `Input`, `Textarea`, `Checkbox`, `RadioGroup`,
  `Select`, `Switch`, `Label`, `Form`.
- **Overlays** — `Dialog`, `AlertDialog`, `Sheet`, `Popover`, `Tooltip`,
  `DropdownMenu`, `Command`.
- **Layout & navigation** — `Sidebar`, `Tabs`, `Breadcrumb`, `Separator`, `Card`,
  `Table`.
- **Feedback** — `Alert`, `Badge`, `Avatar`, `Spinner`, `Skeleton`, `Sonner`
  toasts.

Composed by [`@granit/react-ui-admin-kit`](../react-ui-admin-kit) and the app
shells. Deviations from upstream shadcn are documented inline at the call site
(e.g. the `Sidebar` `sidebar_state` cookie removal for RGPD compliance) — preserve
them across any `shadcn add` regeneration.
