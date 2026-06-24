# @granit/react-ui-workspaces

Admin **workspaces UI kit** for Granit apps — the workspace landing page that
pairs with the headless [`@granit/react-workspaces`](../react-workspaces). This
is the **react-ui feature layer**: it renders the "you are here" welcome screen
reached from the launcher or the workspace switcher, looking the workspace up in
the tree and showing its icon, title and a short subtitle. The headless package
owns the _data_ (`useWorkspaces`, route helpers); this package owns the _pages_.

The split is three packages over the same .NET `Granit.Workspaces` backend
(contract: `contracts/openapi/workspaces.json`):

- [`@granit/workspaces`](../workspaces) — framework-agnostic core: DTOs + Axios
  calls (`getWorkspaceTree`, `getLandingRoute`, …) and the URL/route helpers.
- [`@granit/react-workspaces`](../react-workspaces) — React Query hooks +
  providers (`useWorkspaces`, `useLandingRoute`, `FeatureRouteTableProvider`).
- `@granit/react-ui-workspaces` (this package) — admin UI: the `WorkspacePage`
  landing screen plus its `Workspace.*` translations.

The page is app-agnostic: it takes the route's workspace name and an icon-render
slot as props, so it stays router-free and carries no icon-rendering dependency.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/react-workspaces` — supplies `useWorkspaces`, the workspace-tree hook
  this page reads (which in turn needs a mounted Granit Query/client context).
- `@granit/react-ui` — the shadcn/ui primitives (`Skeleton`) and Tailwind theme
  tokens the page renders with.
- `@granit/react-localization` — `useTranslation` / `resolveLabel` for the
  workspace title and the `Workspace.*` subtitle strings.
- `react` and `react-dom` (`^19`).

## Quick start

`WorkspacePage` is router-free: the host route reads the workspace name from the
router and injects an icon renderer. The showcase passes shell-admin's
`WorkspaceIcon`, so the package itself stays free of any icon dependency.
Register the bundled translations in your i18n instance once at startup.

```tsx
import { WorkspaceIcon } from '@granit/react-ui-shell-admin';
import { WorkspacePage } from '@granit/react-ui-workspaces';
import { useParams } from 'react-router-dom';

function WorkspacePageRoute() {
  // `/w/:workspace` — pass the param straight through; the page looks it up in
  // the workspace tree (`useWorkspaces`) and shows its icon, title, subtitle.
  const { workspace } = useParams<{ workspace: string }>();

  return (
    <WorkspacePage
      workspaceName={workspace}
      renderIcon={(name, className) => <WorkspaceIcon name={name} className={className} />}
    />
  );
}
```

`renderIcon` receives the workspace's backend icon name (a kebab-case lucide
name, or `null`) and an optional class; the host maps it to its own icon
component. While the tree is loading the page shows a skeleton; an unknown
`workspaceName` renders a localized "workspace not found" state.

Register the strings with your i18n instance (flat `Workspace.*` keys in the
`translation` namespace, looked up verbatim with key separators disabled):

```ts
import { workspacesTranslationsEn, workspacesTranslationsFr } from '@granit/react-ui-workspaces';

i18n.addResourceBundle('en', 'translation', workspacesTranslationsEn, true, true);
i18n.addResourceBundle('fr', 'translation', workspacesTranslationsFr, true, true);
```

## Public API

| Symbol                    | Kind      | Purpose                                                       |
| ------------------------- | --------- | ------------------------------------------------------------- |
| `WorkspacePage`           | component | Workspace landing screen (icon + title + subtitle from tree)  |
| `WorkspacePageProps`      | type      | `{ workspaceName: string \| undefined, renderIcon }`          |
| `workspacesTranslationsEn`| const     | English `Workspace.*` strings for the `translation` namespace |
| `workspacesTranslationsFr`| const     | French `Workspace.*` strings for the `translation` namespace  |

## Out of scope / caveats

- **Data, hooks and routing** — the workspace tree, landing-route resolution,
  the sidebar nav and route helpers live in
  [`@granit/react-workspaces`](../react-workspaces); DTOs and Axios transport in
  [`@granit/workspaces`](../workspaces). This package only renders the landing
  page from the tree the hook already fetched.
- **Routing is the host's job.** `WorkspacePage` takes `workspaceName` as a prop
  rather than reading `useParams`, so it stays router-agnostic and renders
  standalone in stories and tests; the host wires it to its router.
- **Icon rendering is injected.** The package carries no icon dependency — the
  host supplies `renderIcon` (the showcase injects shell-admin's
  `WorkspaceIcon`). The page never imports `lucide-react` itself.
- **Workspace items are not listed here.** A workspace's entities, links and
  sub-workspaces are surfaced in the sidebar nav, not on this page — the landing
  screen is intentionally a "you are here" welcome, not a navigation index.

## License

Apache-2.0
