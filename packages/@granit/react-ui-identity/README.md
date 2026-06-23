# @granit/react-ui-identity

Admin UI for the **Identity** module — users (list, detail, create, password,
groups, sessions, devices, attributes), roles, groups, and the identity cache.
Pairs with the headless `@granit/react-identity` data layer (`IdentityProvider`
plus its `useProviderUsers` / `useRoles` / `useGroups` / `useUserSessions` /
`useIdentityCacheStats` / … hooks).

## Usage

The host app supplies the providers; the pages here only consume the hooks. The
pages are provider-agnostic, so wrap them in:

- `IdentityProvider` (`@granit/react-identity`) — resolves the Axios client.
- `AuthorizationProvider` (`@granit/react-authorization`) — backs `usePermissions`,
  which gates the create/assign/manage actions.
- `DataExchangeProvider` is wrapped internally by `UserListPage` for the
  user export/import dialogs.

```tsx
import { IdentityProvider } from '@granit/react-identity';
import { UserListPage, UserDetailPage } from '@granit/react-ui-identity';

<IdentityProvider config={{ client }}>
  <UserListPage />
</IdentityProvider>;
```

### Host-owned activity aside

`UserDetailPage` keeps the user-detail layout but delegates the right-hand
activity panel to the host (the entity timeline, mentions and auth context are
showcase-owned). Supply it via a render-prop:

```tsx
<UserDetailPage
  activityAsideTitle={t('Timeline.Title')}
  renderActivityAside={(userId) => <EntityTimeline entityType="User" entityId={userId} />}
/>
```

## Shared cards

`DevicesCard` / `SessionsCard` / `SessionRiskIndicator` (with their `useDevicesCardLabels`
/ `useSessionsCardLabels` / `useRiskLabelStrings` helpers) are presentational and
data-agnostic — the package's admin user-detail cards wrap them, and the showcase
self-service `account` feature consumes them directly.

## i18n

Ships flat `Identity.*`, `Users.*` and `Sessions.*` keys in the `translation`
namespace via `identityAdminTranslationsEn` / `identityAdminTranslationsFr`.
Register them in the host i18n instance with
`addResourceBundle(lng, 'translation', bundle, true, true)`. The names are
distinct from the headless `@granit/react-identity` `identityTranslationsEn/Fr`
(`identity` namespace) to avoid collisions. The host owns `Common.*`,
`DataExchange.*`, `Pagination.*` and `Timeline.*`.
