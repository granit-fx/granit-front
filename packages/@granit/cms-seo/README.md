# @granit/cms-seo

Framework-agnostic **CMS SEO** SDK — the TypeScript counterpart of the .NET
`Granit.Cms.Seo` and `Granit.Cms.Seo.AI` modules
(`granit-dotnet/src/Granit.Cms.Seo*`). Contract mirrored from
`contracts/openapi/cms-seo.json`.

It exposes the wire-contract types, the public renderer/anonymous-document
client, the SEO admin client, the SEO-AI suggestion client, and the
spec-derived validation constraints. It holds **no** React, DOM or Node-only
dependency — every function takes an `AxiosInstance` and a `basePath`, so the
same calls drive a React admin, an SSR renderer, a CLI, or tests. The React
layers live in [`@granit/react-cms-seo`](../react-cms-seo) (React Query hooks +
provider + MSW fixtures) and [`@granit/react-ui-cms-seo`](../react-ui-cms-seo)
(the per-site SEO admin dashboard).

SEO is resolved by a **cascade**: per-content metadata overrides site defaults,
which seed the render-ready `EffectiveSeoResponse`. Admin edits target the raw
pre-cascade rows; the renderer reads the resolved `effective` projection. The
SEO-AI flow is suggest → review diff → apply a subset of fields → reject.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
installed from a registry. A consumer must declare these peers:

- `@granit/api-client` — the shared Axios client (CSRF, auth, tenant
  interceptors) passed to every call.
- `@granit/query-engine` — `serializeQueryRequest` + `PagedResult` /
  `QueryRequest` for the audit grid.
- `@granit/types` — branded `ISODateString` on timestamp fields.
- `@granit/validation` — `SchemaConstraints` shape for `cmsSeoConstraints`.

## Quick start

```ts
import {
  getEffectiveSeo,
  upsertSeoMetadata,
  suggestSeo,
  applySeoSuggestion,
  cmsSeoConstraints,
} from '@granit/cms-seo';

// `basePath` is the CMS API root; every helper appends `/api/cms/seo/...`.
const basePath = '/cms';
const target = { siteId, contentType: 'page', contentId, culture: 'en-US' };

// 1. Renderer: cascade-resolved, render-ready <head> payload (anonymous-safe).
const seo = await getEffectiveSeo(client, basePath, target);
document.title = seo.title;

// 2. Admin: upsert a content item's raw metadata. Unset fields fall through
//    the cascade; pass `concurrencyStamp` from the last read to guard writes.
await upsertSeoMetadata(client, basePath, target, {
  description: 'Hand-written meta description',
  canonicalUrl: 'https://example.com/page',
});

// 3. SEO-AI: request a suggestion, then apply a subset of its fields.
const { outcome, suggestion } = await suggestSeo(client, basePath, {
  ...target,
  contentTitle: 'Quarterly report',
  scope: 'Title, Description',
});
if (outcome === 'Succeeded' && suggestion) {
  await applySeoSuggestion(client, basePath, suggestion.id, { fields: 'Title' });
}

// 4. Validation: feed the spec-derived constraints to a form resolver.
const titleMax = cmsSeoConstraints.SeoMetadataRequest.title.maxLength; // 300
```

## Public API

### Public renderer & anonymous documents

| Symbol               | Kind | Purpose                                                   |
| -------------------- | ---- | --------------------------------------------------------- |
| `getEffectiveSeo`    | fn   | `GET .../{culture}/effective` — resolved render-ready SEO |
| `getSitemap`         | fn   | `GET .../sitemap.xml` — raw XML, conditional-GET aware    |
| `getSitemapFile`     | fn   | `GET .../sitemap/{file}` — a named child sitemap file     |
| `getRobotsTxt`       | fn   | `GET .../robots.txt` — raw text                           |
| `getManifest`        | fn   | `GET .../manifest.webmanifest` — raw PWA manifest         |
| `RawDocumentResult`  | type | Status + body + `ETag` / `Last-Modified` pass-through     |
| `RawDocumentOptions` | type | `ifNoneMatch` (conditional GET) + SSR `fetchOptions`      |

The four document readers expose the upstream `status`, `etag` and
`lastModified` so a server route can do a faithful conditional-GET pass-through
(`If-None-Match` → `304`); `body` is `null` on `304` and `404`.

### SEO admin

| Symbol              | Kind | Purpose                                               |
| ------------------- | ---- | ----------------------------------------------------- |
| `getSeoMetadata`    | fn   | `GET` raw pre-cascade metadata (`null` on 404)        |
| `upsertSeoMetadata` | fn   | `PUT` a content item's metadata                       |
| `deleteSeoMetadata` | fn   | `DELETE` a content item's metadata (`204`)            |
| `getSeoDefaults`    | fn   | `GET` a site's SEO defaults (`null` until first save) |
| `updateSeoDefaults` | fn   | `PUT` a site's SEO defaults                           |
| `listSeoMetadata`   | fn   | `GET /metadata` — the audit grid (`MapGranitQuery`)   |
| `invalidateSitemap` | fn   | `POST .../sitemap/invalidate` — rebuild on next read  |
| `getSerpPreview`    | fn   | `GET .../preview/serp` — Google-style preview         |
| `getOgCardPreview`  | fn   | `GET .../preview/og` — Open Graph share-card preview  |
| `getJsonLdPreview`  | fn   | `GET .../preview/jsonld` — raw JSON-LD `@graph` text  |

### SEO-AI

| Symbol                 | Kind | Purpose                                                 |
| ---------------------- | ---- | ------------------------------------------------------- |
| `suggestSeo`           | fn   | `POST /ai/suggest` — request a suggestion (idempotent)  |
| `listSeoSuggestions`   | fn   | `GET /ai/suggestions` — paged review inbox              |
| `getSeoSuggestionDiff` | fn   | `GET /ai/suggestions/{id}/diff` — current vs proposed   |
| `applySeoSuggestion`   | fn   | `POST .../apply` — apply a subset of fields             |
| `rejectSeoSuggestion`  | fn   | `POST .../reject` — reject (optional reason)            |
| `triggerBulkSeoAudit`  | fn   | `POST /ai/sites/{siteId}/audit` — bulk generate (`202`) |

### Validation

| Symbol              | Kind  | Purpose                                             |
| ------------------- | ----- | --------------------------------------------------- |
| `cmsSeoConstraints` | const | Spec-derived field constraints for the request DTOs |

### Types

| Symbol                                                | Kind | Purpose                                  |
| ----------------------------------------------------- | ---- | ---------------------------------------- |
| `EffectiveSeoResponse`                                | type | Render-ready resolved SEO                |
| `SeoMetadataRequest` / `SeoMetadataResponse`          | type | Admin upsert body / stored row           |
| `SeoMetadataListItem` / `SeoMetadataPage`             | type | Audit-grid row / page result             |
| `ListSeoMetadataParams` / `SeoAuditQuickFilter`       | type | Audit-grid query + quick-filter tokens   |
| `SiteSeoDefaultsRequest` / `SiteSeoDefaultsResponse`  | type | Site SEO defaults body / response        |
| `SerpPreviewResponse` / `OgPreviewResponse`           | type | SERP / Open Graph preview payloads       |
| `OpenGraph` / `OpenGraphArticle` / `OgImage`          | type | Open Graph value objects                 |
| `TwitterCard` / `Hreflang` / `RobotsDirective`        | type | Twitter card, alternate, crawler policy  |
| `RobotsTxtRule` / `WebManifest` / `WebManifestIcon`   | type | `robots.txt` group / PWA manifest pieces |
| `ImageDimensions` / `SeoReviewStatus`                 | type | Pixel size / editorial review state      |
| `SeoSuggestRequest` / `SeoSuggestResponse`            | type | SEO-AI suggest body / outcome            |
| `SeoSuggestionResponse` / `SeoSuggestionListResponse` | type | Suggestion projection / inbox page       |
| `SeoSuggestionDiff` / `SeoSuggestionFieldDiff`        | type | Per-field current-vs-proposed diff       |
| `SeoSuggestionApplyRequest`                           | type | Apply request body                       |
| `SeoSuggestionRejectRequest`                          | type | Reject request body                      |
| `ListSeoSuggestionsParams`                            | type | Suggestions-inbox query params           |
| `SuggestionStatus` / `SeoGenerationOutcome`           | type | Suggestion lifecycle / suggest outcome   |
| `SuggestionScope` / `SuggestionScopeFlag`             | type | `[Flags]` scope string / member name     |
| `PagedResult` / `QueryRequest`                        | type | Re-exported from `@granit/query-engine`  |

## Conventions & caveats

- **`SuggestionScope` is a string, not an array.** The backend `[Flags]
SuggestionScope` enum is serialized by `System.Text.Json` as a comma-joined
  member-name string (e.g. `"Title, Description"`). The `apply` request's
  `fields` is intersected server-side with the suggestion's own scope.
- **Optionality follows the C#-default rule, not nullability.** A request field
  is `?` only when its backend record parameter carries a C# default; otherwise
  the key is required on the wire with a possibly-`null` value. See the
  [contract-mirroring rules](../../../CLAUDE.md).
- **Optimistic concurrency** uses the body field `concurrencyStamp` (not
  `If-Match`); round-trip the value from the last read on every write.
- **`getEffectiveSeo` and the four document readers are anonymous-safe** (public
  renderer surface). The admin and SEO-AI calls require `Cms.Seo.*` /
  `Cms.Seo.AI.*` permissions, enforced by the backend — these helpers do not
  gate; permission gating lives in the UI layers.
- **`cmsSeoConstraints` is generated** from `contracts/openapi/cms-seo.json` by
  `scripts/generate-front-constraints.mjs`. Do not edit it by hand.

## Out of scope

- **React Query hooks, provider and MSW fixtures** — see
  [`@granit/react-cms-seo`](../react-cms-seo).
- **The per-site SEO admin dashboard** (defaults form, audit table,
  AI-suggestion inbox) — see [`@granit/react-ui-cms-seo`](../react-ui-cms-seo).
- **Sitemap / robots / manifest generation** — the backend builds these; this
  package only relays the rendered documents (with conditional-GET support).

## License

Apache-2.0
