# @granit/react-ui-openiddict-admin

Admin **UI feature kit** for the OpenIddict module — the OIDC server
administration screens plus the two public OIDC flow pages (end-user consent
prompt and RFC 8628 device verification). This is the **react-ui** layer: it
renders shadcn/ui surfaces and composes the headless
[`@granit/react-openiddict-admin`](../react-openiddict-admin) hooks; it owns no
HTTP transport and no query logic.

The split is three packages over the same .NET `Granit.OpenIddict` backend
(contract: `contracts/openapi/openiddict.json`):

- [`@granit/openiddict-admin`](../openiddict-admin) — framework-agnostic core:
  DTOs, Axios calls, and the `OpenIddictPermissions` constants.
- [`@granit/react-openiddict-admin`](../react-openiddict-admin) — React Query
  hooks + `OpenIddictAdminProvider`.
- `@granit/react-ui-openiddict-admin` (this package) — the visual admin kit:
  application / scope / authorization CRUD pages (zod-validated dialog forms)
  and the consent / device flow pages.

The five pages map onto the admin surface:

- **Applications** (`OidcApplicationsPage`) — register, edit and delete OIDC
  client applications (redirect URIs, permissions, consent type, signing key).
- **Scopes** (`OidcScopesPage`) — manage the OIDC scopes available to clients.
- **Authorizations** (`OidcAuthorizationsPage`) — grant consent on behalf of a
  subject and revoke individual or all-user authorizations.
- **Consent** (`ConsentPage`) — the end-user authorization prompt reached from
  the `/connect/authorize` flow.
- **Device** (`DevicePage`) — the RFC 8628 device-verification form.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/openiddict-admin` — core DTOs + the `OpenIddictPermissions` constants
  the admin pages gate on.
- `@granit/react-openiddict-admin` — the hooks/provider this kit composes.
- `@granit/react-authorization` — `usePermissions`, gating the mutating admin
  actions.
- `@granit/react-ui` — the foundation shadcn/ui components (`Button`, `Dialog`,
  `Form`, `Select`, `Alert`, `Input`, `toast`, …).
- `@granit/react-localization` — `useTranslation`; this package ships only the
  `OpenIddict.*` strings, the host registers them.
- `@granit/api-client` — the `AxiosError` type used in mutation error handling.
- `@granit/logger` — `createLogger` for failure logging.
- `react` / `react-dom` (`^19`) and `react-router` (`^8`) — the pages read
  `useSearchParams`; mount them under a router.
- `react-hook-form` (`^7`), `@hookform/resolvers` (`^5`) and `zod` (`^4`) — the
  dialog forms and their schemas.
- `lucide-react` (`^1`) — icons.

## Quick start

Mount the admin pages under an `OpenIddictAdminProvider` (resolves the Axios
client + base path) and an `AuthorizationProvider` (drives `usePermissions`).
The public flow pages are headless of those concerns — inject the host's public
layout, and for consent the current subject.

```tsx
import {
  OidcApplicationsPage,
  OidcScopesPage,
  OidcAuthorizationsPage,
  ConsentPage,
  DevicePage,
  openIddictAdminTranslationsEn,
} from '@granit/react-ui-openiddict-admin';
import { OpenIddictAdminProvider } from '@granit/react-openiddict-admin';
import { AuthorizationProvider } from '@granit/react-authorization';
import { useGranitClient } from '@granit/react-api-client';
import { Route, Routes } from 'react-router';

// Register the bundled OpenIddict.* strings once, at app boot.
i18n.addResourceBundle('en', 'translation', openIddictAdminTranslationsEn, true, true);

function OpenIddictAdminRoutes({ PublicLayout, sub }: AdminProps) {
  const client = useGranitClient();
  return (
    <OpenIddictAdminProvider config={{ client }}>
      <AuthorizationProvider config={{ client }}>
        <Routes>
          {/* Admin CRUD — manage actions hidden unless the user is permitted. */}
          <Route path="/openiddict/applications" element={<OidcApplicationsPage />} />
          <Route path="/openiddict/scopes" element={<OidcScopesPage />} />
          <Route path="/openiddict/authorizations" element={<OidcAuthorizationsPage />} />

          {/* Public flows — host injects the auth shell + (consent) subject. */}
          <Route
            path="/consent"
            element={<ConsentPage layout={PublicLayout} currentUser={{ sub }} />}
          />
          <Route path="/device" element={<DevicePage layout={PublicLayout} />} />
        </Routes>
      </AuthorizationProvider>
    </OpenIddictAdminProvider>
  );
}
```

`ConsentPage` reads `returnUrl` from the query string, resolves the requesting
application via `useConsentApplication`, and binds the grant to
`currentUser.sub`; the Allow button stays disabled until a subject is present.
`DevicePage` seeds its input from the `user_code` query parameter and submits
through `useDeviceVerification`.

## Public API

| Symbol                          | Kind      | Purpose                                                       |
| ------------------------------- | --------- | ------------------------------------------------------------- |
| `OidcApplicationsPage`          | component | OIDC client CRUD page; create/edit/delete dialog forms (zod)  |
| `OidcScopesPage`                | component | OIDC scope CRUD page; create/edit/delete dialog forms (zod)   |
| `OidcAuthorizationsPage`        | component | Grant consent for a subject; revoke single / all-user grants  |
| `ConsentPage`                   | component | End-user `/connect/authorize` consent prompt (Allow / Deny)   |
| `DevicePage`                    | component | RFC 8628 device-verification form (user-code entry)           |
| `openIddictAdminTranslationsEn` | const     | English `OpenIddict.*` i18n bundle; host registers it         |
| `openIddictAdminTranslationsFr` | const     | French `OpenIddict.*` i18n bundle; host registers it          |
| `ConsentPageProps`              | type      | `{ layout?, currentUser? }` for `ConsentPage`                 |
| `ConsentCurrentUser`            | type      | `{ sub?: string }` — subject claim the consent grant binds to |
| `DevicePageProps`               | type      | `{ layout? }` for `DevicePage`                                |

## Injection

The admin pages bake in no client, permissions, or strings — everything is
resolved from context or props:

- **API client** — resolved by the `@granit/react-openiddict-admin` hooks from
  an `OpenIddictAdminProvider` (or a `GranitClientProvider`) higher in the tree.
- **Permissions** — `usePermissions` from `@granit/react-authorization` gates
  the manage / create / revoke actions against the `OpenIddictPermissions`
  constants (`OpenIddict.Applications.Manage`, `OpenIddict.Scopes.Manage`,
  `OpenIddict.Authorizations.Create` / `.Revoke`). When the user lacks a
  permission the corresponding control is simply not rendered.
- **Layout** (public flows) — `ConsentPage` and `DevicePage` take an optional
  `layout` prop (`ComponentType<{ children }>`) for the host's public auth
  shell; it defaults to a passthrough so the pages render standalone in tests
  and stories.
- **Current user** (consent) — `ConsentPage` takes an optional `currentUser`
  prop (`{ sub?: string }`); the host passes the subject from its own auth so
  the consent grant binds to the right user.
- **Routing** — every page reads `useSearchParams` (`returnUrl` on consent,
  `user_code` on device); mount them under a `react-router` router.
- **i18n** — the package ships only its `OpenIddict.*` strings; the host
  registers `openIddictAdminTranslationsEn` / `Fr` into its i18next instance.

## Security model

> **Client-side permission checks are a UX hint, not a security boundary.**
> The `usePermissions` gating here hides controls the user cannot use; it does
> not — and cannot — stop a request. The `Granit.OpenIddict` backend MUST
> re-check authorization on every endpoint.

OIDC client secrets and signing keys are write-only from this UI: the
applications grid surfaces only a `hasSigningKey` boolean, never the key
material, and the create / edit forms send a JWK / secret one way. Do not add
display of those values — they must not round-trip to the browser.

## Out of scope

- **HTTP transport and query logic** — owned by
  [`@granit/react-openiddict-admin`](../react-openiddict-admin) (hooks) over
  [`@granit/openiddict-admin`](../openiddict-admin) (DTOs + Axios). This package
  only renders them.
- **Authentication** — issuing / refreshing tokens is `@granit/authentication`
  and the BFF; these pages consume the already-authenticated Axios client. The
  consent and device pages drive the OIDC _authorization_ sub-flows, not login.
- **User administration** — listing and impersonating users lives in the hooks
  layer and `@granit/react-identity`, not in this kit.

## License

Apache-2.0
