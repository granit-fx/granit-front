# @granit/react-hostnames

React hooks + provider for the Granit **hostnames** module — managing custom
domains end-to-end: registration, DNS ownership verification, TLS certificate
status, and the per-owner canonical (primary) flag. This is the **React hooks
layer**: it wraps the framework-agnostic Axios calls and DTOs from
[`@granit/hostnames`](../hostnames) in TanStack Query hooks behind a shared
`HostnamesProvider` for client/base-path configuration. It holds no rendering —
tables, badges, and dialogs live one layer up.

The split is three packages over the same .NET `Granit.Hostnames` backend
(contract: `contracts/openapi/hostnames.json`):

- [`@granit/hostnames`](../hostnames) — framework-agnostic core: DTOs, Axios
  functions (`listHostnames`, `createHostname`, `verifyNow`, …), OpenAPI-derived
  validation constraints, and the `HostnamesPermissions` catalog.
- `@granit/react-hostnames` (this package) — React Query hooks + provider.
- [`@granit/react-ui-hostnames`](../react-ui-hostnames) — admin UI kit:
  `HostnamesPage`, status/cert badges, the DNS-record details panel, and the
  add-hostname dialog.

A separate, CMS-scoped family wraps the same shape for site domains:
[`@granit/cms-hostnames`](../cms-hostnames),
[`@granit/react-cms-hostnames`](../react-cms-hostnames), and
[`@granit/react-ui-cms-hostnames`](../react-ui-cms-hostnames) — use those for
CMS sites; this package is the owner-agnostic variant.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/hostnames` — core DTOs + Axios calls this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors).
- `@granit/react-api-client` — `useOptionalGranitClient`, the context fallback
  for the Axios client when `config.client` is omitted.
- `@granit/types` — shared base types (e.g. the branded `ISODateString`).
- `@tanstack/react-query` (`^5`) and `react` (`^19`).
- `msw` (`^2.12`, **optional**) — only for the `@granit/react-hostnames/testing`
  subpath.

## Quick start

Wire the provider once (it resolves the Axios client and base path; the client
falls back to the nearest `<GranitClientProvider>`), then call the hooks
anywhere below it.

```tsx
import { HostnamesProvider, useHostnames } from '@granit/react-hostnames';
import { useGranitClient } from '@granit/react-api-client';

function App({ children }: { children: React.ReactNode }) {
  // `client` may be omitted if a <GranitClientProvider> is already mounted.
  return (
    <HostnamesProvider config={{ client: useGranitClient(), basePath: '/api/hostnames' }}>
      {children}
    </HostnamesProvider>
  );
}

function HostnameList({ ownerId }: { ownerId: string }) {
  // ownerType + ownerId are required; the query stays disabled until both are set.
  const { data: hostnames = [] } = useHostnames({ ownerType: 'cms.site', ownerId });

  return (
    <ul>
      {hostnames.map((h) => (
        <li key={h.id}>
          {h.host} — {h.status}
          {h.isPrimary ? ' (primary)' : ''}
        </li>
      ))}
    </ul>
  );
}
```

Mutations resolve the same config and invalidate the affected queries on
success — `useVerifyNow` and `useSetPrimary`/`useClearPrimary` invalidate the
single hostname plus the lists; `useCreateHostname`/`useDeleteHostname`
invalidate the lists.

```tsx
import {
  useCheckAvailability,
  useCreateHostname,
  useSetPrimary,
  useVerifyNow,
} from '@granit/react-hostnames';

function AddHostname({ ownerId }: { ownerId: string }) {
  const { data: availability } = useCheckAvailability('app.example.com');
  const { mutateAsync: create } = useCreateHostname();
  const { mutate: setPrimary } = useSetPrimary();
  const { mutate: recheck } = useVerifyNow();

  async function onAdd() {
    if (!availability?.isAvailable) return;
    const created = await create({
      host: 'app.example.com',
      ownerType: 'cms.site',
      ownerId,
    });
    setPrimary(created.id); // make it the owner's canonical hostname
    recheck(created.id); // trigger immediate DNS re-verification
  }

  return <button type="button" onClick={onAdd}>Add</button>;
}
```

## Public API

| Symbol                    | Kind     | Purpose                                                                 |
| ------------------------- | -------- | ----------------------------------------------------------------------- |
| `HostnamesProvider`       | provider | Supplies the resolved Axios client + base path to all hooks below it    |
| `useHostnamesConfig`      | hook     | Read the resolved config; throws outside a provider                     |
| `useHostnames`            | hook     | `GET {basePath}?ownerType=&ownerId=` — owner's hostname list            |
| `useHostname`             | hook     | `GET {basePath}/{id}` — single hostname; disabled when `id` is empty    |
| `useCheckAvailability`    | hook     | `GET {basePath}/availability?host=` — is the host unclaimed             |
| `useCreateHostname`       | hook     | `POST {basePath}` mutation — register a hostname (returns the record)   |
| `useSetPrimary`           | hook     | `POST {basePath}/{id}/primary` mutation — mark canonical                |
| `useClearPrimary`         | hook     | `DELETE {basePath}/{id}/primary` mutation — unset canonical             |
| `useDeleteHostname`       | hook     | `DELETE {basePath}/{id}` mutation                                       |
| `useVerifyNow`            | hook     | `POST {basePath}/{id}/verify-now` mutation — force DNS re-check         |
| `hostnamesKeys`           | const    | Query-key factory (`all`, `lists`, `list`, `hostname`, `availability`)  |
| `HostnamesConfig`         | type     | Provider input — optional `client` / `basePath`                         |
| `ResolvedHostnamesConfig` | type     | Provider output with the required `client` + `basePath` resolved        |
| `HostnamesProviderProps`  | type     | `{ config, children }`                                                  |

DTOs (`ManagedHostnameResponse`, `CreateManagedHostnameRequest`,
`ListHostnamesParams`, `HostnameAvailabilityResponse`, the `HostnameStatus` /
`CertificateStatus` / `DnsConflictType` enums, …) are re-exported from
[`@granit/hostnames`](../hostnames) — import them from there, not from this
package.

### `./testing` subpath

Requires the optional `msw` peer.

```ts
import { createHostnamesHandlers, mockHostnames, S, C } from '@granit/react-hostnames/testing';

const handlers = createHostnamesHandlers('/api/hostnames', { seed: mockHostnames });
```

`createHostnamesHandlers(baseUrl?, { seed? })` returns stateful MSW handlers
backed by an in-memory store (list / availability / create / get / set + clear
primary / delete / verify-now / certificate-status). `mockHostnames` is the
default seed fixture; `S` and `C` are short aliases for the `HostnameStatus` and
`CertificateStatus` enums for terse fixture authoring.

## Caveats

- **Owner-scoped listing.** `useHostnames` requires both `ownerType` and
  `ownerId`; the query is disabled (no fetch) until both are non-empty. There is
  no tenant-wide "list all hostnames" hook — listing is always per owner.
- **No certificate-status hook.** `POST {basePath}/{id}/certificate-status` is a
  host-level webhook receiver (`reportCertificateStatus` in
  [`@granit/hostnames`](../hostnames), gated by
  `Hostnames.Certificates.Report`), called by the certificate provider — not by
  the browser. It is intentionally not surfaced as a React hook here, though the
  MSW handlers do stub the route.
- **Headless.** No rendering — `HostnamesPage`, the status/cert badges, the DNS
  details panel, and the add dialog live in
  [`@granit/react-ui-hostnames`](../react-ui-hostnames).

## License

Apache-2.0
