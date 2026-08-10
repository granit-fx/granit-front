# @granit/react-ui-authorization

Admin **UI feature kit** for the Granit **authorization** module — the role /
permission management panel (toggle permissions per role), the permission-grant
and role-metadata discovery tables, the permission-side (`Host` / `Tenant` /
`Both`) badge, plus a permission gate and a 403 page. This is the **rendering**
layer: it composes the headless [`@granit/react-authorization`](../react-authorization)
(provider + hooks) with the foundation UI packages
([`@granit/react-ui`](../react-ui), [`@granit/react-ui-admin-kit`](../react-ui-admin-kit)
`QueryDataTable`) and pulls available roles from
[`@granit/react-identity`](../react-identity). It owns no DTOs, HTTP calls, or
query keys — those live one and two layers down.

The split is three packages over the same .NET `Granit.Authorization` backend
(contract: `contracts/openapi/authorization.json`):

- [`@granit/authorization`](../authorization) — framework-agnostic core: DTOs +
  Axios functions (`getMyPermissions`, `queryPermissionGrants`, …).
- [`@granit/react-authorization`](../react-authorization) — React Query hooks +
  `AuthorizationProvider`; headless.
- `@granit/react-ui-authorization` (this package) — admin UI kit: pages,
  panel, badge, guard, and i18n bundles.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/react-authorization` — headless provider + hooks this kit renders.
- `@granit/authorization` — core DTOs (`PermissionGrant`, `RoleMetadata`,
  `PermissionMultiTenancySide`, …) used in column and badge types.
- `@granit/react-api-client` — `useGranitClient`, resolving the Axios client for
  the role-metadata page from a `GranitClientProvider` in the host tree.
- `@granit/react-identity` — `useRoles` for the role-selector options.
- `@granit/react-ui` — foundation primitives (`Card`, `Select`, `Switch`,
  `Badge`, `Input`, `Spinner`, `Button`).
- `@granit/react-ui-admin-kit` — `QueryDataTable` for the discovery tables.
- `@granit/react-localization` — `useTranslation` / `useDateFormatter`.
- `@granit/query-engine` — `SortEntry` and the paged query surface types.
- `@tanstack/react-table` (`^9.0`), `lucide-react` (`^1.21`).
- `react` and `react-dom` (`^19`).

## Quick start

Register the i18n bundle once, mount the headless `AuthorizationProvider`
(from [`@granit/react-authorization`](../react-authorization)) above the host
tree, then route to the pages. The Axios client is resolved from a
`GranitClientProvider` — no client is baked in.

```tsx
import {
  PermissionListPage,
  PermissionGrantsPage,
  RoleMetadataPage,
  authorizationTranslationsEn,
} from '@granit/react-ui-authorization';

// Flat keys under the default "translation" namespace; the host owns Common.* keys.
i18n.addResourceBundle('en', 'translation', authorizationTranslationsEn, true, true);

// Host app:   role/permission panel shows every side (Host + Tenant + Both).
<Route path="/authorization/permissions" element={<PermissionListPage />} />;
// Tenant app: isTenant hides Host-only permissions the backend would reject.
<Route path="/authorization/permissions" element={<PermissionListPage isTenant />} />;

<Route path="/authorization/grants" element={<PermissionGrantsPage />} />;
<Route path="/authorization/roles" element={<RoleMetadataPage />} />;
```

Gate any control with `PermissionGuard` (deny-by-default while loading), and use
`AccessDeniedPage` for a full-screen 403 — both stay app-agnostic, so the host
injects the user email and the sign-out action:

```tsx
import { PermissionGuard, AccessDeniedPage } from '@granit/react-ui-authorization';

<PermissionGuard permission="Authorization.Roles.ManagePermissions" fallback={<ReadOnlyView />}>
  <ManageButton />
</PermissionGuard>;

<AccessDeniedPage userEmail={user.email} onSignOut={() => auth.signOut()} />;
```

## Public API

| Symbol                        | Kind      | Purpose                                                             |
| ----------------------------- | --------- | ------------------------------------------------------------------- |
| `PermissionListPage`          | component | Page wrapping `RolePermissionsPanel`; `isTenant` scopes visibility  |
| `PermissionGrantsPage`        | component | `GET .../grants` discovery table (search, sort, paginate)           |
| `RoleMetadataPage`            | component | `GET .../role-metadata` discovery table; resolves client itself     |
| `RolePermissionsPanel`        | component | Role selector + per-permission `Switch` grant/revoke matrix         |
| `PermissionSideBadge`         | component | `Host` / `Tenant` / `Both` badge for a `PermissionMultiTenancySide` |
| `PermissionGuard`             | component | Renders children only if `hasPermission`; `null` while loading      |
| `AccessDeniedPage`            | component | Full-screen 403 with optional email + sign-out (host-injected)      |
| `PermissionListPageProps`     | type      | `{ isTenant?: boolean }`                                            |
| `RolePermissionsPanelProps`   | type      | `{ isTenant?: boolean }`                                            |
| `AccessDeniedPageProps`       | type      | `{ userEmail?: string; onSignOut?: () => void }`                    |
| `authorizationTranslationsEn` | const     | English i18next bundle (flat keys, `translation` ns)                |
| `authorizationTranslationsFr` | const     | French i18next bundle (same key set)                                |
| `AuthorizationTranslations`   | type      | Shape of the bundle (`typeof authorizationTranslationsEn`)          |

`PermissionGrantsPage` and `PermissionListPage` read the Axios client implicitly
through the hooks' provider; `RoleMetadataPage` resolves it explicitly via
`useGranitClient` and threads it into `useRoleMetadata` / `useRoleMetadataMeta`.

## Injection points

- **API client** — resolved from a `GranitClientProvider` /
  `AuthorizationProvider` higher in the tree. No client is baked in; the
  role-metadata page reads it via `useGranitClient`.
- **Scope** — `isTenant` (default `false`) hides `Host`-only permissions in
  tenant-scoped admins. This is a per-page prop, not an app-level flag: the same
  build serves Host and Tenant admins. The backend still rejects a Host-only
  grant at the tenant level — hiding it just avoids the dead toggle.
- **i18n** — ships its `Auth.*` / `Permissions.*` / `PermissionGrants.*` /
  `RoleMetadata.*` strings; the host registers the bundle. `Common.*` keys
  (`SearchPlaceholder`, `Yes`, `No`) are app-global and expected to already exist.
- **Auth context** — `AccessDeniedPage` takes `userEmail` / `onSignOut` as props
  so it carries no `useAuth` dependency; the app owns its auth context.

## Security model

> **Client-side permission checks are a UX hint, not a security boundary.**
> `PermissionGuard` and the panel toggles help apps hide controls the current
> user cannot use; they do not — and cannot — stop a user from issuing the
> underlying API call. Every endpoint MUST re-check authorization on the .NET
> backend.

- `PermissionGuard` is **deny-by-default**: it renders `null` while permissions
  are loading, then the `fallback` (default `null`) when the permission is
  absent. Use it to hide controls, not to protect data — anything the browser
  fetched is reachable from DevTools.
- Do **not** fetch sensitive data and then hide it with a guard; skip the fetch
  instead. See [`@granit/react-authorization`](../react-authorization)'s security
  model for the full client-side posture.

## Out of scope

- **Hooks, DTOs, HTTP transport** — owned by
  [`@granit/react-authorization`](../react-authorization) (hooks + provider) and
  [`@granit/authorization`](../authorization) (DTOs + Axios). This package only
  renders them.
- **Enforcement** — the authoritative permission check is `Granit.Authorization`
  on the backend; this kit is UX gating only.
- **Authentication** — issuing/refreshing tokens is `@granit/authentication` and
  the BFF; `AccessDeniedPage` only displays the already-known user email.

## License

Apache-2.0
</content>
</invoke>
