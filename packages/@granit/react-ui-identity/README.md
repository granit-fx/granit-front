# @granit/react-ui-identity

Admin **UI feature kit** for the Granit **Identity** module — routed pages and
shared cards for users (list, detail, create, password, groups, sessions,
devices, attributes), roles, groups, and the identity cache. This is the
**react-ui** layer: it composes the headless data layer from
[`@granit/react-identity`](../react-identity) (the `IdentityProvider` and its
`useProviderUsers` / `useRoles` / `useGroups` / `useUserSessions` /
`useIdentityCacheStats` / … hooks) with the foundation UI packages
(`@granit/react-ui`, `@granit/react-ui-kit`, `@granit/react-ui-data-exchange`)
into drop-in screens. It owns rendering only — no Axios calls, no DTOs.

The split is three packages over the same .NET `Granit.Identity` backend
(contract: `contracts/openapi/identity.json`):

- [`@granit/identity`](../identity) — framework-agnostic core: DTOs + Axios
  functions (`getIdentityCapabilities`, `searchUsers`, `assignRole`, …).
- [`@granit/react-identity`](../react-identity) — React Query hooks + provider.
- `@granit/react-ui-identity` (this package) — the admin UI kit.

The pages are **provider-agnostic**: the host app mounts `IdentityProvider`
(which resolves an Axios client via `GranitClientProvider`),
`AuthorizationProvider` (backing `usePermissions`, which gates the
create/assign/manage actions) and `DataExchangeProvider`; these pages only call
the hooks. The shared `DevicesCard` / `SessionsCard` cards are presentational and
data-agnostic, so the showcase self-service `account` feature consumes them
directly alongside the admin user-detail cards.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/react-identity` — the headless `IdentityProvider` + hooks the pages call.
- `@granit/identity` — core DTOs (`UserSessionResponse`, `UserDeviceResponse`,
  `DeviceKind`, `IdentityUser`, `IdentityPermissions`, `composeDeviceLabel`, …).
- `@granit/react-authorization` — `usePermissions`, gating the manage actions.
- `@granit/react-data-exchange` — `DataExchangeProvider` for user export/import.
- `@granit/react-localization` — `useTranslation` / `useDateFormatter`.
- `@granit/react-ui` — the shadcn-based primitives (`Card`, `Table`, `Command`, …).
- `@granit/react-ui-kit` — `DetailAsideLayout` for the user-detail layout.
- `@granit/react-ui-data-exchange` — the export/import buttons and dialogs.
- `@granit/types` — branded ids (`UserId`, `toEntityId`).
- `@granit/utils` — the `cn` class helper.
- `@granit/logger` — `createLogger` for the pages' error logging.
- `react` (`^19`), `react-dom` (`^19`), `react-router-dom` (`^7`) — the pages
  read route params (`useParams`) and navigate (`useNavigate`).
- `lucide-react` (`^1.21`) — the icon set.

`@tanstack/react-query` and the `i18next` / `react-i18next` stack come in
transitively through `@granit/react-identity` and `@granit/react-localization`.

## Quick start

Mount the providers once at the host, register the i18n bundles, then route to
the pages. The pages own their internal dialogs and pagination.

```tsx
import i18next from 'i18next';
import { AuthorizationProvider } from '@granit/react-authorization';
import { IdentityProvider } from '@granit/react-identity';
import {
  UserListPage,
  UserDetailPage,
  RoleListPage,
  GroupListPage,
  IdentityCachePage,
  identityAdminTranslationsEn,
} from '@granit/react-ui-identity';
import { Route, Routes } from 'react-router-dom';

// Flat Identity.*/Users.*/Sessions.* keys live in the `translation` namespace.
i18next.addResourceBundle('en', 'translation', identityAdminTranslationsEn, true, true);

function IdentityArea({ client }: { client: AxiosInstance }) {
  return (
    <IdentityProvider config={{ client }}>
      <AuthorizationProvider config={{ client }}>
        <Routes>
          <Route path="users" element={<UserListPage />} />
          <Route path="users/:id" element={<UserDetailPage />} />
          <Route path="roles" element={<RoleListPage />} />
          <Route path="groups" element={<GroupListPage />} />
          <Route path="cache" element={<IdentityCachePage />} />
        </Routes>
      </AuthorizationProvider>
    </IdentityProvider>
  );
}
```

`UserDetailPage` keeps the user-detail layout but delegates the right-hand
activity panel to the host (the entity timeline, mentions and auth context are
showcase-owned). Supply it via a render-prop:

```tsx
<UserDetailPage
  activityAsideTitle={t('Timeline.Title')}
  renderActivityAside={(userId) => <EntityTimeline entityType="User" entityId={userId} />}
/>
```

The shared cards are presentational — fetch the data yourself and pass labels via
the scope hooks:

```tsx
import { SessionsCard, useSessionsCardLabels } from '@granit/react-ui-identity';
import { useUserSessions, useRevokeSession } from '@granit/react-identity';

function MySessions({ userId }: { userId: UserId }) {
  const { data, isLoading } = useUserSessions(userId);
  const revoke = useRevokeSession();
  return (
    <SessionsCard
      sessions={data}
      isLoading={isLoading}
      labels={useSessionsCardLabels('self')} // 'self' | 'admin'
      onRevoke={(id) => revoke.mutate(id)}
      allowRevokeCurrent={false} // self-service can't kill its own session
    />
  );
}
```

## Public API

| Symbol                        | Kind      | Purpose                                                               |
| ----------------------------- | --------- | --------------------------------------------------------------------- |
| `UserListPage`                | component | Searchable, paginated user table + create/export/import dialogs       |
| `UserDetailPage`              | component | User profile, status, password, groups, sessions, devices, attributes |
| `UserDetailPageProps`         | type      | `{ renderActivityAside?, activityAsideTitle? }` — host-owned aside    |
| `AdminUser`                   | type      | Showcase admin user shape (all `IdentityUser` fields required)        |
| `RoleListPage`                | component | Provider role table, navigates to a role by name                      |
| `RoleDetailPage`              | component | Role members table + assign/remove via `UserSearchCombobox`           |
| `GroupListPage`               | component | Group hierarchy tree (expand/collapse), navigates to a group          |
| `GroupDetailPage`             | component | Group detail + member management                                      |
| `IdentityCachePage`           | component | Cache stats + provider sync (sync one / all / stale) admin surface    |
| `UserSearchCombobox`          | component | Debounced user picker (`useProviderUsers`) for assign/add flows       |
| `DevicesCard`                 | component | Presentational per-device list (session count, location, last seen)   |
| `DevicesCardLabels`           | type      | Translated strings for `DevicesCard`                                  |
| `DevicesCardProps`            | type      | `{ devices, isLoading, labels }`                                      |
| `SessionsCard`                | component | Presentational session list with risk indicator + per-row/bulk revoke |
| `SessionsCardLabels`          | type      | Translated strings for `SessionsCard` (optional bulk-revoke label)    |
| `SessionsCardProps`           | type      | `{ sessions, isLoading, labels, onRevoke, allowRevokeCurrent?, … }`   |
| `SessionRiskIndicator`        | component | Graded warning glyph for `Low`/`Medium`/`High` sessions (tooltip)     |
| `SessionRiskIndicatorProps`   | type      | `{ level, reasons, labels }`                                          |
| `useDevicesCardLabels`        | hook      | Resolve `DevicesCardLabels` from `Users.Devices.*` per `DevicesScope` |
| `DevicesScope`                | type      | `'self' \| 'admin'`                                                   |
| `useSessionsCardLabels`       | hook      | Resolve `SessionsCardLabels` from `Sessions.*` per `SessionsScope`    |
| `SessionsScope`               | type      | `'self' \| 'admin'`                                                   |
| `useDeviceLabelStrings`       | hook      | Build `DeviceLabelStrings` for `composeDeviceLabel` from i18n keys    |
| `useRiskLabelStrings`         | hook      | Localized risk title/level/reason strings (humanized fallback)        |
| `RiskLabelStrings`            | type      | Shape returned by `useRiskLabelStrings`                               |
| `parseUserAgent`              | fn        | Best-effort UA → `{ kind, operatingSystem, browser }` or `null`       |
| `isHandheldUserAgent`         | fn        | Whether a parsed UA should render with the phone icon                 |
| `identityAdminTranslationsEn` | const     | English `translation`-namespace resource bundle (flat keys)           |
| `identityAdminTranslationsFr` | const     | French `translation`-namespace resource bundle (flat keys)            |
| `IdentityAdminTranslations`   | type      | Shape of the resource bundles                                         |

## i18n

Ships flat `Identity.*`, `Users.*` and `Sessions.*` keys in the `translation`
namespace via `identityAdminTranslationsEn` / `identityAdminTranslationsFr`.
Register them in the host i18n instance with
`addResourceBundle(lng, 'translation', bundle, true, true)`. The names are
deliberately distinct from the headless `@granit/react-identity`
`identityTranslationsEn` / `identityTranslationsFr` bundle (the `identity`
namespace) to avoid a collision. The host owns `Common.*`, `DataExchange.*`,
`Pagination.*` and `Timeline.*`.

## Security model

Client-side permission checks here are **UX gating, not enforcement**. Pages call
`usePermissions().hasPermission('Identity.Users.Manage')` /
`'Identity.Cache.Manage'` / `IdentityPermissions.Roles.Manage` to hide the
create / assign / sync / erase controls — every underlying mutation is still
re-authorized on the `Granit.Identity` backend. See
[`@granit/react-authorization`](../react-authorization) for the full client-side
authorization posture.

The user-detail "danger zone" exposes RGPD cache erasure (`useIdentityRgpd().erase`,
Art. 17) behind `Identity.Cache.Manage` and a typed confirmation step. Treat the
cached identity directory as PII: do not log or surface more of it than a screen
needs.

## Out of scope / caveats

- **Data fetching, DTOs and HTTP transport** — owned by
  [`@granit/react-identity`](../react-identity) and
  [`@granit/identity`](../identity). The `SessionsCard` / `DevicesCard` props take
  already-fetched data and emit intents (`onRevoke`); they never call an endpoint.
- **The activity aside is host-owned.** `UserDetailPage` renders no timeline,
  mentions or auth context itself — supply them via `renderActivityAside`.
- **`parseUserAgent` is presentation-only, best-effort.** It maps a raw
  `User-Agent` to a friendly "Chrome on Windows" label for the icon and row title;
  the raw string stays the source of truth (kept as a tooltip). It returns `null`
  for unrecognizable agents so callers fall back to their "unknown device" label.
- **`SessionRiskIndicator` requires a `TooltipProvider` ancestor** and only renders
  for elevated levels (`Low` / `Medium` / `High`); `None` / `null` render nothing.
  Risk reason codes are backend-defined and open-ended — unknown codes fall back to
  a humanized form via `useRiskLabelStrings`.
- **Pagination is provider-shaped.** `UserListPage` works around Keycloak's
  list endpoint (which returns `max` rows when more pages remain) by bumping the
  page count so a "next" link appears; it is not a true total count.

## License

Apache-2.0
</content>
</invoke>
