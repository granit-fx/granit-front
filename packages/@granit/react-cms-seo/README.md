# @granit/react-cms-seo

React Query hooks + provider for the Granit CMS **SEO** module — per-content
metadata editing, site-level defaults, live SERP/OG/JSON-LD previews, the SEO
audit grid, and the SEO-AI suggestion inbox (suggest / apply / reject). This is
the **React hooks layer**: it wraps the framework-agnostic Axios calls and DTOs
from [`@granit/cms-seo`](../cms-seo) in TanStack Query hooks behind a shared
`CmsSeoProvider` (client / base-path / query-key configuration). It holds no
rendering — editors, grids, and inbox panels live one layer up.

The split is three packages over the same .NET `Granit.Cms.Seo` backend
(contract: `contracts/openapi/cms-seo.json`):

- [`@granit/cms-seo`](../cms-seo) — framework-agnostic core: DTOs + Axios
  functions (`getSeoMetadata`, `upsertSeoMetadata`, `listSeoMetadata`,
  `suggestSeo`, …) plus the public renderer surface (`getSitemap`, `getRobotsTxt`,
  `getManifest`) and validation constraints.
- `@granit/react-cms-seo` (this package) — React Query hooks + provider.
- [`@granit/react-ui-cms-seo`](../react-ui-cms-seo) — admin UI kit: SEO editor,
  defaults form, audit grid, and the AI suggestions inbox.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/cms-seo` — core DTOs + Axios calls this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors).
- `@granit/react-api-client` — `useOptionalGranitClient`, the context fallback for
  the Axios client when `config.client` is omitted.
- `@granit/types` — shared base types.
- `@tanstack/react-query` (`^5`) and `react` (`^19`).
- `msw` (`^2.12`, **optional**) — only for the `@granit/react-cms-seo/testing`
  subpath.

## Quick start

Wire the provider once (it resolves the Axios client, base path, and an optional
query-key prefix), then call the hooks anywhere below it. The base path defaults
to `''` (the API client's own base URL); routes are rooted at `/api/cms/seo`.

```tsx
import { CmsSeoProvider, useSeoMetadata, useUpsertSeoMetadata } from '@granit/react-cms-seo';
import type { SeoContentKey } from '@granit/react-cms-seo';
import { useGranitClient } from '@granit/react-api-client';

function App({ children }: { children: React.ReactNode }) {
  // `client` may be omitted if a <GranitClientProvider> is already mounted.
  return (
    <CmsSeoProvider config={{ client: useGranitClient() }}>
      {children}
    </CmsSeoProvider>
  );
}

// A metadata row is addressed by the full four-part content key. Queries stay
// disabled until every part is non-empty, so partial keys are safe to render.
function SeoEditor({ contentKey }: { contentKey: SeoContentKey }) {
  const { data, isLoading } = useSeoMetadata(contentKey);
  const { mutate: upsert, isPending } = useUpsertSeoMetadata();

  if (isLoading) return null;
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        upsert({ key: contentKey, request: { title: 'New title', description: null } })
      }
    >
      Save SEO
    </button>
  );
}
```

The SEO-AI inbox combines the suggestion query hooks with the apply/reject
mutations; applying a suggestion writes live metadata, so the mutation refreshes
the affected metadata rows, previews, and the audit grid for you:

```tsx
import {
  useSeoSuggestions,
  useSeoSuggestionDiff,
  useApplySeoSuggestion,
  useRejectSeoSuggestion,
} from '@granit/react-cms-seo';

function SuggestionInbox() {
  const { data: inbox } = useSeoSuggestions();
  const { mutate: apply } = useApplySeoSuggestion();
  const { mutate: reject } = useRejectSeoSuggestion();

  return inbox?.items.map((s) => (
    <div key={s.id}>
      {/* `fields` is the comma-joined flags string, intersected server-side. */}
      <button type="button" onClick={() => apply({ id: s.id, request: { fields: s.scope } })}>
        Apply
      </button>
      <button type="button" onClick={() => reject({ id: s.id })}>
        Reject
      </button>
    </div>
  ));
}
```

## Public API

| Symbol                   | Kind     | Purpose                                                               |
| ------------------------ | -------- | --------------------------------------------------------------------- |
| `CmsSeoProvider`         | provider | Supplies client, base path, query-key prefix to all hooks below it    |
| `useCmsSeoConfig`        | hook     | Read the resolved config; throws outside a provider                   |
| `useSeoMetadata`         | hook     | `GET .../metadata/{type}/{id}/{culture}` — raw row, `null` on 404     |
| `useEffectiveSeo`        | hook     | Cascade-resolved metadata (defaults + parents + row), seedable        |
| `useSeoDefaults`         | hook     | `GET .../sites/{siteId}/defaults` — site defaults, `null` on 404      |
| `useSeoMetadataAudit`    | hook     | `GET .../metadata` — paged/filterable/sortable SEO audit grid         |
| `useSerpPreview`         | hook     | `GET .../preview/serp` — Google SERP card model                       |
| `useOgCardPreview`       | hook     | `GET .../preview/og` — Open Graph / Twitter card model                |
| `useJsonLdPreview`       | hook     | `GET .../preview/jsonld` — raw JSON-LD `@graph` document (string)     |
| `useUpsertSeoMetadata`   | hook     | `PUT .../metadata/...` — write a row; refreshes row + previews + grid |
| `useDeleteSeoMetadata`   | hook     | `DELETE .../metadata/...` — remove a row; refreshes previews + grid   |
| `useUpdateSeoDefaults`   | hook     | `PUT .../sites/{siteId}/defaults` — write site defaults               |
| `useInvalidateSitemap`   | hook     | `POST .../sites/{siteId}/sitemap/invalidate` — rebuild on next read   |
| `useSeoSuggestions`      | hook     | `GET .../ai/suggestions` — paged AI suggestion inbox                  |
| `useSeoSuggestionDiff`   | hook     | `GET .../ai/suggestions/{id}/diff` — per-field current vs proposed    |
| `useSuggestSeo`          | hook     | `POST .../ai/suggest` — request a suggestion for a content item       |
| `useApplySeoSuggestion`  | hook     | `POST .../ai/suggestions/{id}/apply` — apply a subset of fields       |
| `useRejectSeoSuggestion` | hook     | `POST .../ai/suggestions/{id}/reject` — reject with optional reason   |
| `useTriggerBulkSeoAudit` | hook     | `POST` — kick off a site-wide bulk SEO audit                          |
| `cmsSeoKeys`             | const    | Query-key factory honoring the configured `queryKeyPrefix`            |
| `SeoContentKey`          | type     | The four-part `{ siteId, contentType, contentId, culture }` address   |
| `CmsSeoConfig`           | type     | Provider input (optional client / basePath / queryKeyPrefix)          |
| `ResolvedCmsSeoConfig`   | type     | Provider output with the resolved required client + basePath          |
| `CmsSeoProviderProps`    | type     | `{ config, children }`                                                |

All DTOs (`SeoMetadataRequest`/`Response`, `SiteSeoDefaultsRequest`/`Response`,
`EffectiveSeoResponse`, `SerpPreviewResponse`, `OgPreviewResponse`,
`SeoSuggestionResponse`, `SeoSuggestionDiff`, `OpenGraph`, `TwitterCard`,
`RobotsDirective`, `WebManifest`, the `SuggestionStatus` / `SeoReviewStatus` /
`SuggestionScope` enums, …) are re-exported unchanged from
[`@granit/cms-seo`](../cms-seo) for convenience — they are owned by the core
package, not redefined here.

### `./testing` subpath

Requires the optional `msw` peer. Exposes `createCmsSeoHandlers` (stateful MSW
handlers — default base `/api/cms/seo`, covering site defaults, the audit grid,
and the suggestions inbox plus apply/reject) and the `mockSeoDefaults`,
`mockSeoMetadataAudit`, and `mockSeoSuggestions` fixtures. Import these instead
of hand-rolling DTOs in app tests.

## Out of scope / caveats

- **Rendering** — the SEO editor, defaults form, audit grid, and AI inbox live in
  [`@granit/react-ui-cms-seo`](../react-ui-cms-seo). This package is headless.
- **DTOs and HTTP transport** — owned by [`@granit/cms-seo`](../cms-seo) (mirror
  of `Granit.Cms.Seo`); hooks here only adapt them to React Query.
- **Public renderer surface** — anonymous `getSitemap` / `getRobotsTxt` /
  `getManifest` and the `getEffectiveSeo` document calls are core functions for
  the SSR renderer, not admin hooks; they are not wrapped here.
- **`useApplySeoSuggestion` writes live metadata.** Apply intersects the
  requested `fields` flags with the suggestion's own `scope` server-side, then
  persists the result; the mutation invalidates the full metadata + audit query
  trees, so an applied suggestion shows up in the editor and grid without manual
  refetching.
- **Server-side authorization is authoritative.** Read paths require
  `Cms.Seo.Read`; writes require `Cms.Seo.Manage`; the AI surface requires the
  `Cms.Seo.AI.*` permissions. These hooks do not gate on permissions — hiding
  controls the current user cannot use is the UI layer's job, and the .NET
  backend re-checks every call regardless.

## License

Apache-2.0
