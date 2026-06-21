# @granit/react-ui-authorization

Admin UI for the **Authorization** module — the role / permission management
panel (toggle permissions per role) plus the permission-grant and role-metadata
discovery tables and the permission-side (`Host` / `Tenant` / `Both`) badge.

The **visual** layer for authorization: it composes the headless
[`@granit/react-authorization`](../react-authorization) (provider + hooks, with
roles from [`@granit/react-identity`](../react-identity)) and the foundation UI
packages ([`@granit/react-ui`](../react-ui),
[`@granit/react-ui-admin-kit`](../react-ui-admin-kit) `QueryDataTable`).

## Usage

```tsx
import { PermissionListPage, authorizationTranslationsEn } from '@granit/react-ui-authorization';

i18n.addResourceBundle('en', 'translation', authorizationTranslationsEn, true, true);

// Host app:   <Route path="/authorization/permissions" element={<PermissionListPage />} />
// Tenant app: <Route path="/authorization/permissions" element={<PermissionListPage isTenant />} />
```

## Injection

- **API client** — resolved from a `GranitClientProvider` /
  `AuthorizationProvider` higher in the tree (the role-metadata page reads the
  client via `useGranitClient`). No client is baked in.
- **Scope** — `isTenant` (default `false`) hides Host-only permissions in
  tenant-scoped admins, instead of an app-level flag.
- **i18n** — ships its `Permissions.*` / `PermissionGrants.*` / `RoleMetadata.*`
  strings; the host registers them. `Common.*` keys are app-global.
