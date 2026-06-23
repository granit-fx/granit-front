# @granit/react-ui-multi-tenancy

Admin UI for the **Multi-Tenancy** module — a query-driven tenant list (smart
filters, sortable columns, export, per-row activate / deactivate), the tenant
create form, and the tenant edit view with a host-injected activity aside.

The **visual** layer for tenant administration: it composes the headless
[`@granit/react-multi-tenancy`](../react-multi-tenancy) (provider + hooks) with
the foundation UI packages ([`@granit/react-ui`](../react-ui),
[`@granit/react-ui-admin-kit`](../react-ui-admin-kit),
[`@granit/react-ui-data-exchange`](../react-ui-data-exchange)) and gates
management actions with [`@granit/react-authorization`](../react-authorization)
`usePermissions`.

## Usage

```tsx
import {
  TenantListPage,
  TenantCreatePage,
  TenantEditPage,
  multiTenancyTranslationsEn,
} from '@granit/react-ui-multi-tenancy';

i18n.addResourceBundle('en', 'translation', multiTenancyTranslationsEn, true, true);

// Mount under a GranitClientProvider (the pages wrap their own TenantAdminProvider):
<Route path="/tenants" element={<TenantListPage />} />;
<Route path="/tenants/new" element={<TenantCreatePage />} />;
<Route
  path="/tenants/:id/edit"
  element={<TenantEditPage renderActivityAside={renderTimeline} />}
/>;
```

## Injection

- **API client** — the pages wrap a `TenantAdminProvider config={{}}` which
  resolves the Axios client from a `GranitClientProvider` higher in the tree. No
  client is baked in.
- **Permissions** — `usePermissions` from `@granit/react-authorization` gates the
  create / update / manage actions (`MultiTenancy.Tenants.*`, `Hostnames.Hostnames.Read`).
- **Routing** — `react-router-dom` (`Link` / `useParams` / `useNavigate`) for the
  list / create / edit navigation.
- **Activity aside (host slot)** — `TenantEditPage` exposes
  `renderActivityAside?: (tenantId: string) => React.ReactNode`. The host owns the
  activity feed (e.g. an `EntityTimeline` wired to its auth context and
  `@`-mention picker) and injects it; the package never depends on the app's auth
  feature or timeline component. `activityAsideTitle` overrides the panel title
  (defaults to the `Timeline.Title` key).
- **i18n** — ships its `Tenants.*` strings (`multiTenancyTranslationsEn/Fr`); the
  host registers them.
