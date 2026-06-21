# @granit/react-ui-shell-admin

The Granit **admin app shell** (chrome): the back-office frame shared by every
Granit admin application — sidebar + topbar + content + right rail.

- **AppShell** — the visual frame (sidebar provider, AppSidebar, header, content
  area, right sidebar) with responsive collapse.
- **AppSidebar** — workspace-driven navigation (falls back to a static nav model).
- **User menu, command palette, workspace switcher/content nav, header.**

App-specific data — auth (user/logout/impersonation), the navigation model,
languages, logger — is injected via **`ShellChromeProvider`**, so the chrome
stays decoupled from how each app resolves them. Feature widgets (notification
bell, search, …) are passed as header slots. Styled via the
[`@granit/ui-theme`](../ui-theme) tokens; built on [`@granit/react-ui`](../react-ui)
and the [`@granit/react-shell-core`](../react-shell-core) /
[`@granit/shell-core`](../shell-core) substrate.

A future mobile/site shell is a sibling package with different chrome, sharing
the same substrate + tokens.

## Consumption

Source-direct in the Granit monorepo and the showcases (pnpm `link:` + Vite
alias → `src/`).
