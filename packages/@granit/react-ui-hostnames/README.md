# @granit/react-ui-hostnames

Admin **UI feature kit** for the managed **Hostnames** module — an owner-scoped
hostname list (status / certificate badges, collapsible DNS details, last-check
tooltip, row actions) plus the add-hostname dialog (availability check, primary
flag). This is the **rendering** layer: it composes the headless
[`@granit/react-hostnames`](../react-hostnames) (provider + hooks) with the
foundation UI packages ([`@granit/react-ui`](../react-ui)), derives the create
form from spec constraints via [`@granit/react-validation`](../react-validation),
and gates management actions with [`@granit/react-authorization`](../react-authorization)
`usePermissions`. It owns no DTOs, HTTP calls, or query keys — those live one and
two layers down.

The split is three packages over the same .NET `Granit.Hostnames` backend
(contract: `contracts/openapi/hostnames.json`):

- [`@granit/hostnames`](../hostnames) — framework-agnostic core: DTOs
  (`ManagedHostnameResponse`), enums (`HostnameStatus`, `CertificateStatus`),
  spec-derived `hostnamesConstraints`, and Axios functions.
- [`@granit/react-hostnames`](../react-hostnames) — React Query hooks +
  `HostnamesProvider`; headless.
- `@granit/react-ui-hostnames` (this package) — admin UI kit: page, badges,
  dialog, row actions, and i18n bundles.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/react-hostnames` — headless provider + hooks this kit renders
  (`useHostnames`, `useCheckAvailability`, `useCreateHostname`, the primary /
  verify / delete mutations).
- `@granit/hostnames` — core enums (`HostnameStatus`, `CertificateStatus`), the
  `ManagedHostnameResponse` DTO, and `hostnamesConstraints` for the create form.
- `@granit/react-authorization` — `usePermissions` gates the manage actions
  (`Hostnames.Hostnames.Manage`).
- `@granit/react-ui` — foundation primitives (`Table`, `Badge`, `Dialog`,
  `AlertDialog`, `Form`, `Collapsible`, `Select`, `toast`, …).
- `@granit/react-localization` — `useTranslation` / `useDateFormatter`.
- `@granit/react-validation` — `createConstraintsResolver` for the create form.
- `react-hook-form` (`^7.80`) — the add-hostname dialog form.
- `react-router-dom` (`^7.18`) — owner filter via `useSearchParams`.
- `lucide-react` (`^1.21`), `react` / `react-dom` (`^19`).

## Quick start

Register the i18n bundle once, mount the headless `HostnamesProvider`
(from [`@granit/react-hostnames`](../react-hostnames)) above the host tree, then
route to `HostnamesPage`. The Axios client is resolved from a
`GranitClientProvider` through the provider — no client is baked in.

```tsx
import { HostnamesProvider } from '@granit/react-hostnames';
import { HostnamesPage, hostnamesTranslationsEn } from '@granit/react-ui-hostnames';
import { Route, Routes } from 'react-router-dom';

// Flat keys under the default "translation" namespace; deep-merge into the host.
i18n.addResourceBundle('en', 'translation', hostnamesTranslationsEn, true, true);

function HostnamesArea() {
  return (
    // HostnamesProvider resolves the Axios client / base path from the host tree.
    <HostnamesProvider config={{}}>
      <Routes>
        {/* Page reads ?ownerType=&ownerId= from the URL; ownerless = empty state. */}
        <Route path="/hostnames" element={<HostnamesPage />} />
      </Routes>
    </HostnamesProvider>
  );
}
```

`HostnamesPage` drives the whole feature: an owner selector (`ownerType` /
`ownerId`, persisted to the query string), the hostname table, and the
add-hostname dialog. The manage actions (add, set / clear primary, verify-now,
delete) only render when `usePermissions().hasPermission('Hostnames.Hostnames.Manage')`
is `true`. The individual building blocks are exported for bespoke layouts:

```tsx
import {
  HostnameStatusBadge,
  CertStatusBadge,
  DnsDetails,
  RowActions,
} from '@granit/react-ui-hostnames';
import type { ManagedHostnameResponse } from '@granit/hostnames';

function HostnameRow({ hostname }: { hostname: ManagedHostnameResponse }) {
  return (
    <tr>
      <td className="font-mono">{hostname.host}</td>
      <td>
        <HostnameStatusBadge status={hostname.status} />
      </td>
      <td>
        <CertStatusBadge status={hostname.certificateStatus} />
      </td>
      <td>
        <DnsDetails hostname={hostname} />
      </td>
      <td>
        {/* RowActions renders null unless canManage; wire it to your gate. */}
        <RowActions hostname={hostname} canManage />
      </td>
    </tr>
  );
}
```

## Public API

| Symbol                    | Kind      | Purpose                                                                  |
| ------------------------- | --------- | ------------------------------------------------------------------------ |
| `HostnamesPage`           | component | Full admin page: owner filter, table, badges, row actions, add dialog    |
| `HostnameStatusBadge`     | component | Localized status badge (`Active` / `Verifying` / `Error` / …) for a host |
| `CertStatusBadge`         | component | Localized certificate badge (`Secured` / `Provisioning` / `Error` / …)   |
| `DnsDetails`              | component | Collapsible panel: expected DNS records, conflicts, token, cert expiry   |
| `RowActions`              | component | Set / clear primary, verify-now, delete; null unless `canManage`         |
| `AddHostnameDialog`       | component | Create form with availability check, FQDN guard, and primary flag        |
| `hostnamesTranslationsEn` | const     | English i18next bundle (flat `Hostnames.*` keys, `translation` ns)       |
| `hostnamesTranslationsFr` | const     | French i18next bundle (flat `Hostnames.*` keys, `translation` ns)        |
| `HostnamesTranslations`   | type      | Key shape of the bundles (typed from the English source)                 |

`AddHostnameDialog` is rendered internally by `HostnamesPage`; it is exported for
hosts that drive the add flow from their own toolbar. Its create form is derived
from `hostnamesConstraints.CreateManagedHostnameRequest` via
`createConstraintsResolver`, layered with a client-only FQDN regex (see caveats).

## Security model

> **Client-side permission checks are a UX hint, not a security boundary.**
> The `Hostnames.Hostnames.Manage` gate hides the add / set-primary / verify /
> delete controls; it does **not** stop a crafted request. Every mutating
> endpoint **MUST** re-check authorization on the .NET `Granit.Hostnames`
> backend. See [`@granit/react-authorization`](../react-authorization) for the
> full UX-gating-vs-enforcement posture.

## Caveats

- **Client-only FQDN guard.** The create form augments the spec-derived
  constraints (the contract carries only `maxLength` on `host`) with a local FQDN
  regex purely for UX. The .NET endpoint runs the authoritative hostname check;
  drop the regex once the backend exposes the pattern in
  `contracts/openapi/hostnames.json`.
- **Validation messages are owned by the backend.** `Validation:Builtin:*` keys
  resolved by `createConstraintsResolver` ship with the host app's
  `Granit.Validation` bundle, not this package.
- **i18n bundles are flat-key, `translation` namespace.** Register them with
  `deep`/`overwrite` (`addResourceBundle(lng, 'translation', bundle, true, true)`)
  so they merge alongside the host's own `Hostnames.*` and `Common.*` keys.
- **Owner is required.** `HostnamesPage` shows an empty prompt until both
  `ownerType` and `ownerId` are present in the query string; no list is fetched
  before an owner is chosen.

## Out of scope

- **DTOs, enums, constraints, and HTTP transport** — owned by
  [`@granit/hostnames`](../hostnames) (mirror of `Granit.Hostnames`).
- **React Query hooks, the `HostnamesProvider`, and query keys** — owned by
  [`@granit/react-hostnames`](../react-hostnames); this kit only renders them.
- **Authentication and the Axios client** — supplied by a `GranitClientProvider`
  in the host tree and consumed already-authenticated.

## License

Apache-2.0
