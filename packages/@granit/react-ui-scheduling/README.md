# @granit/react-ui-scheduling

Admin UI for the **Scheduling** module — a query-driven scheduled-actions list
(status badges, smart filters, sortable columns, per-row cancel / reschedule)
plus the action detail view with its cancel-confirmation and reschedule dialogs.

The **visual** layer for scheduling: it composes the headless
[`@granit/react-scheduling`](../react-scheduling) (provider + hooks) with the
foundation UI packages ([`@granit/react-ui`](../react-ui),
[`@granit/react-ui-admin-kit`](../react-ui-admin-kit)) and gates management
actions with [`@granit/react-authorization`](../react-authorization)
`usePermissions`.

## Usage

```tsx
import { SchedulingListPage, schedulingTranslationsEn } from '@granit/react-ui-scheduling';

i18n.addResourceBundle('en', 'translation', schedulingTranslationsEn, true, true);

// Mount under a GranitClientProvider (the pages wrap their own SchedulingProvider):
<Route path="/scheduling" element={<SchedulingListPage />} />;
<Route path="/scheduling/:id" element={<SchedulingDetailPage />} />;
```

## Injection

- **API client** — the pages wrap a `SchedulingProvider config={{}}` which
  resolves the Axios client from a `GranitClientProvider` higher in the tree
  (via `@granit/react-api-client`). No client is baked in.
- **Permissions** — `usePermissions` from `@granit/react-authorization` gates the
  cancel / reschedule actions (`SchedulingPermissions.Actions.Manage`).
- **Routing** — `react-router-dom` (`Link` / `useParams`) for the list-to-detail
  navigation and the back link.
- **i18n** — ships its `Scheduling.*` strings (`schedulingTranslationsEn/Fr`);
  the host registers them.
