# @granit/react-cms-hostnames

React Query hooks + provider for the Granit **CMS site-scoped hostnames** module
— listing a site's managed hostnames, pre-checking availability, and adding /
removing / re-verifying them. This is the **React hooks layer**: it wraps the
framework-agnostic Axios calls and DTOs from
[`@granit/cms-hostnames`](../cms-hostnames) in TanStack Query hooks behind a
shared `CmsHostnamesProvider` for client / base-path / query-key configuration.
It holds no rendering — forms, tables, and badges live one layer up.

The split is three packages over the same .NET `Granit.Cms.Hostnames` backend
(contract: `contracts/openapi/cms-hostnames.json`):

- [`@granit/cms-hostnames`](../cms-hostnames) — framework-agnostic core: DTOs +
  Axios functions (`listSiteHostnames`, `checkSiteHostnameAvailability`,
  `addSiteHostname`, …) + generated validation constraints.
- `@granit/react-cms-hostnames` (this package) — React Query hooks + provider.
- [`@granit/react-ui-cms-hostnames`](../react-ui-cms-hostnames) — admin UI kit:
  the per-site hostname page, add-hostname form, status badge, verify / remove
  actions.

These are the **site-scoped CMS** hostnames — distinct from the top-level,
owner-scoped managed hostnames in [`@granit/hostnames`](../hostnames) /
[`@granit/react-hostnames`](../react-hostnames) /
[`@granit/react-ui-hostnames`](../react-ui-hostnames). Different DTOs, different
routes; do not cross the two.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/cms-hostnames` — core DTOs + Axios calls this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors).
- `@granit/react-api-client` — `useOptionalGranitClient`, the context fallback
  for the Axios client when `config.client` is omitted.
- `@granit/types` — shared base types (`ISODateString` on the re-exported DTOs).
- `@tanstack/react-query` (`^5`) and `react` (`^19`).
- `msw` (`^2.12`, **optional**) — only for the `@granit/react-cms-hostnames/testing`
  subpath.

## Quick start

Wire the provider once (it resolves the Axios client, base path, and an optional
query-key prefix), then call the hooks anywhere below it. If a
`<GranitClientProvider>` is already mounted, `config.client` may be omitted.

```tsx
import {
  CmsHostnamesProvider,
  useSiteHostnames,
  useAddSiteHostname,
} from '@granit/react-cms-hostnames';
import { useGranitClient } from '@granit/react-api-client';

function App({ children }: { children: React.ReactNode }) {
  return (
    <CmsHostnamesProvider config={{ client: useGranitClient(), basePath: '' }}>
      {children}
    </CmsHostnamesProvider>
  );
}

function HostnameList({ siteId }: { siteId: string }) {
  // `useSiteHostnames` returns a BARE ARRAY, not a paged envelope.
  const { data, isLoading } = useSiteHostnames(siteId);
  const add = useAddSiteHostname(siteId);

  if (isLoading) return null;
  return (
    <>
      <ul>
        {data?.map((h) => (
          <li key={h.id}>
            {h.host} — {h.status}
            {h.isPrimary ? ' (primary)' : ''}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => add.mutate({ host: 'www.acme.com', isPrimary: true })}
      >
        Add hostname
      </button>
    </>
  );
}
```

Before submitting, gate the add control on an availability pre-check. The
availability query is short-lived (`staleTime: 10s`, `gcTime: 30s`) and disabled
on empty input, so it is debounce-friendly while typing:

```tsx
import { useSiteHostnameAvailability } from '@granit/react-cms-hostnames';

function AvailabilityHint({ siteId, host }: { siteId: string; host: string }) {
  const { data } = useSiteHostnameAvailability(siteId, host);
  if (!data) return null;
  return <span>{data.available ? 'Available' : 'Already taken'}</span>;
}
```

The remove and verify-now mutations key off the hostname id and reconcile the
list cache on success (`useRemoveSiteHostname` drops the detail entry and
invalidates the list; `useVerifySiteHostname` writes the returned hostname into
the detail cache and invalidates the list).

## Public API

| Symbol                             | Kind     | Purpose                                                           |
| ---------------------------------- | -------- | ----------------------------------------------------------------- |
| `CmsHostnamesProvider`             | provider | Resolves client, base path, query-key prefix for all hooks below  |
| `useCmsHostnamesConfig`            | hook     | Read the resolved config; throws outside the provider             |
| `useSiteHostnames`                 | hook     | `GET .../sites/{siteId}/hostnames` — bare array of hostnames      |
| `useSiteHostnameAvailability`      | hook     | `GET .../hostnames/availability?host=` — short-lived pre-check    |
| `useAddSiteHostname`               | hook     | `POST .../hostnames` mutation; invalidates the list on success    |
| `useRemoveSiteHostname`            | hook     | `DELETE .../hostnames/{id}` mutation; drops detail + list cache   |
| `useVerifySiteHostname`            | hook     | `POST .../hostnames/{id}/verify-now` mutation; primes detail      |
| `cmsHostnamesKeys`                 | const    | Query-key factory: `all`/`list`/`detail`/`availability` by prefix |
| `CmsHostnamesConfig`               | type     | Provider input (optional client / basePath / queryKeyPrefix)      |
| `ResolvedCmsHostnamesConfig`       | type     | Provider output with the resolved required client + basePath      |
| `CmsHostnamesProviderProps`        | type     | `{ config, children }`                                            |
| `SiteHostnameResponse`             | type     | A managed hostname (host, status, primary, DNS records, cert)     |
| `SiteHostnameCreateRequest`        | type     | `POST` body — `{ host, isPrimary? }`                              |
| `SiteHostnameAvailabilityResponse` | type     | `{ host, available }` pre-check result                            |
| `SiteHostnameDnsRecordResponse`    | type     | A DNS record the owner must configure (`recordType`/`name`/value) |
| `SiteHostnameDnsRecordType`        | type     | `'A' \| 'Aaaa' \| 'Cname' \| 'Txt'`                               |

The five DTO `type` re-exports above are pass-throughs from
[`@granit/cms-hostnames`](../cms-hostnames) — import them from either package.

`./testing` subpath (requires the optional `msw` peer):
`createCmsHostnamesHandlers(baseUrl = '/api/cms')` — stateful MSW handlers for
the collection (list / availability / add / remove / verify-now; there is **no**
`/primary` endpoint) — plus the `mockHostnames` fixture and the
`CORPORATE_SITE_ID` constant.

## Caveats

- **List is a bare array, not a paged envelope.** `useSiteHostnames` resolves to
  `readonly SiteHostnameResponse[]`; do not reach for a `data.items` /
  `PagedResult` shape.
- **No primary-hostname endpoint.** Primacy is set at creation time via
  `SiteHostnameCreateRequest.isPrimary`; this layer exposes no "make primary"
  mutation, and the testing handlers deliberately omit a `/primary` route.
- **Backend enforces authorization.** Reads (`useSiteHostnames`,
  `useSiteHostnameAvailability`) require `Cms.Sites.Read`; mutations
  (`useAddSiteHostname`, `useRemoveSiteHostname`, `useVerifySiteHostname`)
  require `Cms.Sites.Manage`. Client-side gating is a UX hint only — every call
  is re-checked on the .NET backend.
- **Empty inputs short-circuit the query.** Both query hooks stay disabled until
  `siteId` (and, for availability, `host`) are non-empty, so it is safe to mount
  them with provisional state.

## Out of scope

- **Rendering** — the per-site page, add form, status badge, and verify / remove
  actions live in
  [`@granit/react-ui-cms-hostnames`](../react-ui-cms-hostnames). This package is
  headless.
- **DTOs, HTTP transport, and validation** — owned by
  [`@granit/cms-hostnames`](../cms-hostnames) (mirror of `Granit.Cms.Hostnames`,
  including the generated `cmsHostnamesConstraints`); hooks here only adapt them
  to React Query.
- **Owner-scoped managed hostnames** — a separate module
  ([`@granit/react-hostnames`](../react-hostnames)) with its own DTOs and routes;
  do not mix it with the CMS site-scoped contract.

## License

Apache-2.0
