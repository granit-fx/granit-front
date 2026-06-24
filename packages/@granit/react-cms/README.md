# @granit/react-cms

React layer for the Granit **CMS** — the renderer-side block kit (presentational
block components + a Puck visual-editor `Config` generator) **and** the admin
React Query hooks (sites, pages, menus, releases, editing presence). It wraps the
framework-agnostic Axios calls and DTOs from [`@granit/cms`](../cms) in TanStack
Query hooks behind a shared `CmsProvider`, and ships the React components that
render the backend block catalog inside `@puckeditor/core`.

The split is layered over the .NET `Granit.Cms.*` backend (contract:
`contracts/openapi/cms.json`, routes under `/api/cms/...`):

- [`@granit/cms`](../cms) — framework-agnostic core: wire DTOs + Axios functions
  (`listSites`, `getPage`, `searchPages`, `resolveMenu`, the block catalog, …).
- `@granit/react-cms` (this package) — block components, the Puck config
  generator, the `CmsMenuNav` renderer, and the admin React Query hooks.
- Admin UI feature kits, one per CMS surface:
  [`@granit/react-ui-cms-sites`](../react-ui-cms-sites),
  [`@granit/react-ui-cms-pages`](../react-ui-cms-pages),
  [`@granit/react-ui-cms-menus`](../react-ui-cms-menus),
  [`@granit/react-ui-cms-releases`](../react-ui-cms-releases). Redirects, SEO and
  custom hostnames are separate CMS domains with their own packages
  ([`@granit/react-cms-redirects`](../react-cms-redirects),
  [`@granit/react-cms-seo`](../react-cms-seo),
  [`@granit/react-cms-hostnames`](../react-cms-hostnames) and their `react-ui-*`
  kits).

Two extra entry points sit alongside the default barrel:

- `@granit/react-cms/server` — the subset safe to import from React Server
  Components: `catalogToConfig`, its option types, `CmsMenuNav`, and the
  `ResolvedAsset` type. No admin hooks, no provider.
- `@granit/react-cms/testing` — in-memory MSW handlers + fixtures (optional `msw`
  peer).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/cms` — core DTOs + Axios calls this layer wraps, plus the block
  catalog / menu-resolution types the renderer reads.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors). **optional** peer: only the hooks need it, not the renderer
  surface.
- `@granit/react-api-client` — `useOptionalGranitClient`, the context fallback
  for the Axios client when `config.client` is omitted. **optional** peer.
- `@granit/query-engine` — `PagedResult` for the list hooks.
- `@granit/logger`, `@granit/types`, `@granit/utils` — logging, branded
  `ISODateString`, and the URL-safety helpers behind `CmsMenuNav`.
- `@puckeditor/core` (`^0.21`) — the visual editor `catalogToConfig` targets.
- `lucide-react` (`^1`) — icons used by the block components.
- `react` (`^19`) and `@tanstack/react-query` (`^5`).
- `msw` (`^2.12`, **optional**) — only for the `@granit/react-cms/testing` subpath.

`isomorphic-dompurify` is a direct dependency (not a peer): the rich-text block
sanitizes editor HTML at SSR and in the browser.

## Quick start

### Render a published page (renderer / `@granit/react-cms/server`)

`catalogToConfig` is the only place the backend `BlockFieldKind` → Puck-field
mapping lives. Pass `resolveBlockData` so data-bound blocks fetch live content at
SSR time, and `fetchDocuments` to wire the editor-side document picker for
`DocumentReference` fields.

```tsx
import { catalogToConfig } from '@granit/react-cms/server';
import { Render, resolveAllData } from '@puckeditor/core';

// `catalog` is a BlockCatalogResponse fetched via @granit/cms.
const config = catalogToConfig(catalog, {
  siteId,
  culture, // BCP-47, forwarded to the data resolver
  resolveBlockData: async ({ dataSourceKey, query, siteId, culture }) => {
    const { data, consumedContentKeys } = await fetchBlockData(/* … */);
    return { data, consumedContentKeys };
  },
});

const resolved = await resolveAllData(pageData, config);
return <Render config={config} data={resolved} />;
```

Blocks absent from `BLOCK_COMPONENTS` are silently skipped — the catalog may lag
behind or lead the frontend registry. Use `BLOCK_COMPONENTS` directly when you
render outside Puck.

### Admin hooks (sites / pages / menus / releases)

Wire `CmsProvider` once (it resolves the Axios client, base path, and an optional
query-key prefix), then call the hooks anywhere below it. With
`DEFAULT_BASE_PATH = ''`, calls hit `/api/cms/...` on the client's `baseURL`.

```tsx
import { CmsProvider, usePageTree, usePublishPage } from '@granit/react-cms';
import { useGranitClient } from '@granit/react-api-client';

function CmsAdmin({ children }: { children: React.ReactNode }) {
  // `client` may be omitted if a <GranitClientProvider> is already mounted.
  return <CmsProvider config={{ client: useGranitClient() }}>{children}</CmsProvider>;
}

function PageTree({ siteId }: { siteId: string }) {
  const { data: tree } = usePageTree(siteId);
  const publish = usePublishPage(); // invalidates the page + its versions on success

  return tree?.map((node) => (
    <button key={node.id} type="button" onClick={() => publish.mutate(node.id)}>
      {node.slugSegment}
    </button>
  ));
}
```

### Render a resolved menu

```tsx
import { CmsMenuNav } from '@granit/react-cms';

// `menu` is a ResolvedMenu from @granit/cms (e.g. resolveMenu()).
<CmsMenuNav menu={menu} className="site-nav" />;
```

## Public API

### Renderer surface

| Symbol | Kind | Purpose |
| --- | --- | --- |
| Block components | component | 13 presentational blocks: `HeroBlock`, `CtaBlock`, `FeaturesBlock`, `ImageTextBlock`, `LogosBlock`, `MapBlock`, `PricingBlock`, `StatsBlock`, `StepsBlock`, `TestimonialsBlock`, `TimelineBlock`, `TrustBannerBlock`, `VideoBlock` |
| `BLOCK_COMPONENTS` | const | `Record<blockName, ComponentType>` — every registered block (incl. layout/content primitives) keyed by backend catalog name |
| `catalogToConfig` | fn | `BlockCatalogResponse` → Puck `Config`; the sole `BlockFieldKind` → field mapping; optional `resolveData` + document picker |
| `CmsMenuNav` | component | Renders a `ResolvedMenu` as a semantic `<nav>`; `javascript:`/`data:` hrefs neutralised to inert text |
| `CatalogConfigOptions` | type | `catalogToConfig` options (`resolveBlockData`, `siteId`, `culture`, `fetchDocuments`) |
| `ResolveBlockDataFn` | type | Renderer callback that fetches live data for a data-bound block |
| `FetchDocumentsFn` | type | Editor callback that searches documents for `DocumentReference` fields |
| `DocumentPickerItem` | type | `{ id, title, mimeType? }` returned by the picker |
| `ResolvedAsset` | type | Render-ready asset descriptor from publish-time `_resolved_<field>` siblings |
| `*BlockProps` | type | Per-block prop shapes mirroring the backend block schema |

### Admin provider + hooks

| Symbol | Kind | Purpose |
| --- | --- | --- |
| `CmsProvider` | provider | Supplies client, base path, query-key prefix to all hooks below it |
| `useCmsConfig` | hook | Read the resolved config; throws outside a provider |
| `cmsKeys` | const | Query-key factory (prefix-aware) for sites/pages/menus/releases/search |
| `useSites` / `useSite` | hook | `GET /sites` (paged) / `GET /sites/{id}` |
| `useCreateSite` / `useUpdateSite` / `useDeleteSite` | hook | Site mutations (invalidate the sites list) |
| `usePages` / `usePage` / `usePageTree` / `usePageVersions` | hook | Page list (paged), detail, structure tree, version history |
| `useCreatePage` / `useUpdatePage` / `useUpdatePageTranslation` | hook | Create / update a page or one of its culture translations |
| `useMovePage` / `useDeletePage` | hook | Reparent / delete a page (re-fetch the affected tree) |
| `useSaveDraft` / `usePublishPage` / `useUnpublishPage` / `useRollbackPage` | hook | Draft + lifecycle mutations (invalidate versions/detail) |
| `useSearchPages` / `useSearchPagesAdmin` | hook | Public site-scoped search (`X-Granit-Site` header) / tenant-wide admin search |
| `usePageEditingPresence` / `usePageEditingHeartbeat` / `useLeavePageEditing` | hook | Editing-room presence (poll), heartbeat, leave |
| `useMenus` / `useMenu` | hook | `GET /menus` (paged) / `GET /menus/{id}` |
| `useCreateMenu` / `useUpdateMenu` / `useDeleteMenu` | hook | Menu mutations (invalidate the menus list) |
| `useReleases` / `useRelease` | hook | `GET /releases` (paged) / `GET /releases/{id}` |
| `useCreateRelease` / `useUpdateRelease` / `useCancelRelease` | hook | Release CRUD + cancel |
| `useScheduleRelease` / `usePublishRelease` | hook | Schedule (local time + IANA zone) / publish a release |
| `useAddReleaseAction` / `useRemoveReleaseAction` | hook | Add / remove an action on a release |
| `CmsConfig` / `ResolvedCmsConfig` / `CmsProviderProps` | type | Provider input (optional client/basePath/queryKeyPrefix), resolved output, props |

All list/detail hooks accept `{ enabled }`; detail/tree/search hooks self-disable
on empty ids or empty `q`/`culture`. Mutations are typed `UseMutationResult` and
own their own cache invalidation.

### `./testing` subpath

Requires the optional `msw` peer. Stateful in-memory handler factories —
`createSitesHandlers`, `createPagesHandlers`, `createMenusHandlers`,
`createReleasesHandlers` (each takes a collection base URL, default
`/api/cms/<collection>`) — plus the `mockSites`, `mockPageTree`, `mockMenus`,
`mockReleases` fixtures and the `CORPORATE_SITE_ID` seed.

## Security and caveats

> CMS content is authored by **lower-trust editors**; treat every editor-supplied
> string (link hrefs, rich-text HTML, media `src`) as untrusted on the public
> render path.

- **Link hrefs are scheme-filtered.** `CmsMenuNav` runs every item href through
  `safeLinkHref` (built on `isSafeUrl` + `LINK_URL_SCHEMES` from `@granit/utils`):
  only `http(s)`, `mailto:`, `tel:` and
  same-origin relative paths pass; `javascript:` / `data:` / `vbscript:` URLs are
  dropped and the item renders as inert text. Stored XSS via a menu link is
  blocked here (security audit VULN-100 / VULN-101). External links additionally
  get `target="_blank"` + `rel="noopener noreferrer"`.
- **Rich-text HTML is sanitized.** `TextBlock` injects its `content` via
  `dangerouslySetInnerHTML` only after `DOMPurify.sanitize` (isomorphic — runs at
  SSR and in the client editor). Do not bypass it by rendering raw block HTML
  yourself.
- **Document references are resolved server-side.** A `DocumentReference` field
  stores a `DocumentPickerItem` id at edit time; the backend injects the
  render-ready `ResolvedAsset` as a `_resolved_<field>` sibling at publish time.
  The editor picker runs `fetchDocuments` through a **server-proxied** route — the
  Bearer token never reaches the browser.
- **Block-data resolution never crashes the page.** A failing `resolveBlockData`
  is logged via `@granit/logger` and the block falls back to its editor props.
- **No CSP `/csp` subpath.** This package writes to a script sink
  (`dangerouslySetInnerHTML` in `TextBlock`) but the value is DOMPurify-sanitized
  inline, so no Trusted Types policy is exposed. If you tighten CSP to
  `require-trusted-types-for 'script'`, register a policy that returns the
  already-sanitized string for React's `dangerouslySetInnerHTML` sink.

## Out of scope

- **DTOs and HTTP transport** — owned by [`@granit/cms`](../cms) (mirror of
  `Granit.Cms.*`); hooks here only adapt them to React Query.
- **Admin screens** — site/page/menu/release management UIs live in the
  `@granit/react-ui-cms-*` feature kits; this package is headless apart from the
  block components and `CmsMenuNav`.
- **Redirects, SEO, custom hostnames** — separate CMS domains
  (`@granit/cms-redirects`, `@granit/cms-seo`, `@granit/cms-hostnames` and their
  React/UI layers), not handled here.
- **Authentication** — this package consumes the already-authenticated Axios
  client; it never issues or refreshes tokens.

## License

Apache-2.0
