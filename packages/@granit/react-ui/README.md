# @granit/react-ui

Granit's React **primitive component library** — the lowest UI layer shared by
every Granit admin app. Headless-first [shadcn/ui](https://ui.shadcn.com)
primitives (Radix UI + Tailwind, composed through [`@granit/utils`](../utils)
`cn`) styled against the [`@granit/ui-theme`](../ui-theme) design-token contract,
re-exported as a single `@granit/*` barrel so apps and higher-level kits depend
on one stable entrypoint instead of copying shadcn components in.

This is the **presentational** layer: components only render and emit events.
There is no data fetching, no React Query, no business logic, and no backend
counterpart — it sits below the `react-<module>` hook layers and the
`react-ui-<module>` admin feature kits. Those feature kits and the app shells
(notably [`@granit/react-ui-admin-kit`](../react-ui-admin-kit) and
[`@granit/react-ui-shell-admin`](../react-ui-shell-admin)) compose these
primitives; nothing here knows about a specific domain. Unlike the bulk of the
framework, this package is **published** (a `tsup` build with `dist/` +
`publishConfig` to `npm.pkg.github.com`) rather than source-direct, because the
primitive surface is consumed broadly and benefits from a bundled, typed entry.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
installed from a public registry for app consumption. A consumer must declare
these peers (all listed in `peerDependencies`):

- `@granit/utils` — supplies `cn` (the Tailwind class-merge helper) every
  component uses; not re-exported here, import it directly.
- `react` (`^19`) and `react-dom` (`^19`).
- `radix-ui` (`^1.6`) — the unstyled behavior primitives behind dialogs, menus,
  selects, tooltips, the sidebar, etc.
- `class-variance-authority` (`^0.7`) — variant maps for `Button`, `Badge`,
  `StatusBadge`, `Spinner`, and friends.
- `cmdk` (`^1.1`) — the command-palette engine behind `Command`.
- `lucide-react` (`^1.21`) — icon set used by spinners, toasts, the tree
  chevron, and trigger affordances.
- `react-hook-form` (`^7.80`) — backs `Form` and the `*Field` wrappers.
- `sonner` (`^2.0`) — the toast engine behind `Toaster` / `toast`.

Runtime theming is **not** a JS dependency: colors, radii, and the dark-mode
palette come from the `@granit/ui-theme` CSS custom properties (`--primary`,
`--popover`, `--radius`, the `success-/warning-/alert-/admin-/info-` token
scales). The host app must load that stylesheet for the components to pick up
brand colors.

## Quick start

Import primitives from the single barrel and compose them. `Toaster` mounts once
near the app root; `toast(...)` is then callable from anywhere.

```tsx
import { Button, Card, CardContent, CardHeader, CardTitle, Toaster, toast } from '@granit/react-ui';

function App() {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => toast.success('Saved')}>Save</Button>
        </CardContent>
      </Card>
      <Toaster />
    </>
  );
}
```

The `*Field` wrappers bind a primitive to a `react-hook-form` `Control`, wiring
label, control, and validation message in one node — the building block feature
forms reuse instead of re-deriving `FormField` boilerplate:

```tsx
import { useForm } from 'react-hook-form';
import { Button, CheckboxField, SelectField, TextField } from '@granit/react-ui';

interface Values {
  readonly email: string;
  readonly role: string;
  readonly active: boolean;
}

function MemberForm() {
  const { control, handleSubmit } = useForm<Values>();

  return (
    <form onSubmit={handleSubmit(() => undefined)} className="grid gap-4">
      <TextField control={control} name="email" label="Email" type="email"
        transform={(v) => v.toLowerCase()} />
      <SelectField control={control} name="role" label="Role"
        options={[{ value: 'admin', label: 'Admin' }, { value: 'member', label: 'Member' }]} />
      <CheckboxField control={control} name="active" label="Active" />
      <Button type="submit">Create</Button>
    </form>
  );
}
```

For app chrome, `SidebarProvider` owns expand/collapse state and exposes it via
`useSidebar()` to nested `Sidebar*` parts (the open/collapsed state is driven by
the app layout, never persisted to a cookie — see Caveats).

## Public API

Every export is a presentational component or its companion CVA variant map /
prop type. The table groups the large shadcn re-export families; each family
exports a `Root` plus the conventional shadcn sub-parts (`*Trigger`, `*Content`,
`*Header`, `*Item`, …).

| Symbol | Kind | Purpose |
| --- | --- | --- |
| `Button`, `buttonVariants` | component / fn | CVA button; adds `icon-xs`/`icon-sm`/`icon-lg` sizes for admin density |
| `Input`, `Textarea`, `Label`, `Checkbox`, `RadioGroup`, `Switch` | component | Stock form controls |
| `Select*` | component | Radix select (`Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, …) |
| `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage` | component | `react-hook-form` field scaffolding (memoized provider value) |
| `useFormField` | hook | Field state (`id`, `error`, message ids) inside a `FormField` |
| `TextField`, `SelectField`, `CheckboxField` | component | Typed `Control`-bound field wrappers (label + control + `FormMessage`) |
| `SelectFieldProps`, `SelectFieldOption`, `TextFieldProps`, `CheckboxFieldProps` | type | Generic field-wrapper props over `FieldValues` |
| `Dialog*`, `AlertDialog*`, `Sheet*`, `Popover*`, `Tooltip*` | component | Overlay/portal families |
| `DropdownMenu*` | component | Radix dropdown menu (items, checkbox/radio items, sub-menus) |
| `Command*`, `CommandDialog` | component | `cmdk` command palette / typeahead |
| `Sidebar*`, `useSidebar` | component / hook | App-shell sidebar; `SidebarProvider` holds the expand state |
| `Tabs*`, `Breadcrumb*`, `Separator`, `Card*`, `Table*` | component | Layout & navigation |
| `Tree`, `TreeItem`, `TreeGroup`, `TreeItemRow`, `TreeItemToggle`, `TreeItemSpacer` | component | Headless WAI-ARIA tree styling (data/expansion owned by the caller) |
| `Alert*`, `Badge`, `badgeVariants`, `Avatar*`, `Skeleton`, `Spinner` | component / fn | Feedback & status |
| `StatusBadge`, `statusBadgeVariants`, `StatusBadgeIntent` | component / fn / type | Semantic outcome pill (success/warning/danger/info/accent/neutral) |
| `Toaster`, `toast`, `ExternalToast` | component / fn / type | `sonner` toasts wired to Granit tokens + lucide icons |
| `Collapsible*` | component | Radix collapsible primitive |

`useIsMobile` (the `768px` viewport hook behind the sidebar) is intentionally
**internal** — it is not part of the barrel. Import `cn` from
[`@granit/utils`](../utils), not from this package.

## Caveats

- **Presentational only.** No fetching, no React Query, no domain logic. Feature
  behavior belongs one layer up in the `react-<module>` / `react-ui-<module>`
  packages. Keep this barrel domain-agnostic.
- **`Sidebar` cookie removed (RGPD).** Upstream shadcn persists the
  open/collapsed state in a `sidebar_state` cookie for SSR first paint. This is
  a Vite SPA with no SSR; the state is fully app-controlled and an undeclared
  cookie would violate the RGPD cookie registry / CMP (`AddGranitCookies`). The
  removal is deliberate — **re-apply it** after any `shadcn add sidebar`
  regeneration.
- **Intentional shadcn deviations — preserve on regeneration.** Each is
  documented inline at the call site: `Spinner` is a full CVA rewrite (`sm`/`md`/
  `lg` sizes + `text-primary`); `Sonner` drops `next-themes` (theme is passed via
  `ToasterProps`, default `'system'`), enables `richColors`, and maps lucide
  icons per level; `Form` wraps the `FormField` provider value in `useMemo`;
  `Button` adds `icon-xs`/`icon-sm`/`icon-lg`. Do not let a `shadcn add` sweep
  silently revert these.
- **Toast through the barrel.** Domain UI packages must call `toast` re-exported
  here, not import `sonner` directly — this keeps the shadcn stack confined to
  the UI tier (enforced by `no-restricted-imports`).
- **`StatusBadge` vs `Badge`.** `Badge` variants map to brand/structural roles;
  `StatusBadge` maps to semantic lifecycle *outcomes*. Map a domain status to a
  `StatusBadgeIntent` via your own `Record`, do not overload `Badge`.
- **`Tree` is headless of data.** It supplies container/row/indentation/chevron
  styling and the WAI-ARIA roles only; the consumer owns expansion state, lazy
  loading, and node content.

## License

Apache-2.0
