# @granit/react-ui-openiddict-admin

Admin UI for the **OpenIddict** module — OIDC server administration plus the
public OIDC flow pages:

- **Applications** (`OidcApplicationsPage`) — register, edit and delete OIDC
  client applications (redirect URIs, permissions, consent type, signing key)
  with zod-validated dialog forms.
- **Scopes** (`OidcScopesPage`) — manage the OIDC scopes available to clients.
- **Authorizations** (`OidcAuthorizationsPage`) — grant consent on behalf of a
  subject and revoke individual or all-user authorizations.
- **Consent** (`ConsentPage`) — the end-user authorization prompt reached from
  the `/connect/authorize` flow.
- **Device** (`DevicePage`) — the RFC 8628 device-verification form.

The **visual** layer for OpenIddict: it composes the headless
[`@granit/react-openiddict-admin`](../react-openiddict-admin) (provider + hooks)
with the foundation UI package ([`@granit/react-ui`](../react-ui)) and gates the
admin mutating actions with
[`@granit/react-authorization`](../react-authorization) `usePermissions`.

## Usage

```tsx
import {
  OidcApplicationsPage,
  ConsentPage,
  DevicePage,
  openIddictAdminTranslationsEn,
} from '@granit/react-ui-openiddict-admin';

i18n.addResourceBundle('en', 'translation', openIddictAdminTranslationsEn, true, true);

// Admin pages — mount under an OpenIddictAdminProvider + AuthorizationProvider:
<Route path="/openiddict/applications" element={<OidcApplicationsPage />} />;

// Public flows — inject the host public layout (and current user for consent):
<Route
  path="/consent"
  element={<ConsentPage layout={PublicLayout} currentUser={{ sub: user?.sub }} />}
/>;
<Route path="/device" element={<DevicePage layout={PublicLayout} />} />;
```

## Injection

- **API client** — resolved from a `GranitClientProvider` /
  `OpenIddictAdminProvider` higher in the tree (via the
  `@granit/react-openiddict-admin` hooks). No client baked in.
- **Permissions** — `usePermissions` from `@granit/react-authorization` gates
  the application / scope / authorization manage actions
  (`OpenIddict.Applications.Manage`, `OpenIddict.Scopes.Manage`,
  `OpenIddict.Authorizations.Create` / `.Revoke`).
- **Layout** (public flows) — `ConsentPage` and `DevicePage` take an optional
  `layout` prop (`ComponentType<{ children }>`) for the host's public auth
  shell; it defaults to a passthrough.
- **Current user** (consent) — `ConsentPage` takes an optional `currentUser`
  prop (`{ sub?: string }`); the host passes the subject from its own auth so
  the consent grant binds to the right user.
- **Routing** — all pages use `react-router-dom`
  (`useSearchParams` on consent / device); mount them under a router.
- **i18n** — ships its `OpenIddict.*` strings
  (`openIddictAdminTranslationsEn/Fr`); the host registers them.
