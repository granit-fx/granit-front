# @granit/cms

Framework-agnostic TypeScript client for the Granit CMS HTTP API — the
front-end counterpart of the .NET `Granit.Cms.*` modules
(`granit-dotnet/src/Granit.Cms.*`). Contract source of truth:
[`contracts/openapi/cms.json`](../../../contracts/openapi/cms.json).

It exposes the wire-contract **types** and typed **Axios wrappers** for the
public renderer surface (page resolution, block catalog, block data, menu
resolution, public search, preview tokens) and the admin surface (sites, pages
with drafts/versions/translations/presence, menus, releases). It holds **no**
React, DOM or Node-only dependency — every function takes an `AxiosInstance`
from [`@granit/api-client`](../api-client) plus a `basePath`, and nothing is
stored globally. The React layer lives in [`@granit/react-cms`](../react-cms);
the admin feature kits live in [`@granit/react-ui-cms-pages`](../react-ui-cms-pages),
[`@granit/react-ui-cms-menus`](../react-ui-cms-menus),
[`@granit/react-ui-cms-sites`](../react-ui-cms-sites) and
[`@granit/react-ui-cms-releases`](../react-ui-cms-releases).

Redirects, SEO and custom hostnames are **separate** CMS domains with their own
core/react split — see [`@granit/cms-redirects`](../cms-redirects),
[`@granit/cms-seo`](../cms-seo) and [`@granit/cms-hostnames`](../cms-hostnames).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. Declare
these peers:

- [`@granit/api-client`](../api-client) — the centralized Axios instance
  (interceptors for CSRF, auth, tenant) and `RequestFetchOptions` for the fetch
  adapter (SSR caching hints).
- [`@granit/query-engine`](../query-engine) — `getPage` / `PagedResult` /
  `QueryRequest`; the admin list endpoints are QueryEngine grids.
- [`@granit/types`](../types) — branded `ISODateString` for timestamp fields.
- [`@granit/validation`](../validation) — `SchemaConstraints` backing the
  generated `cmsConstraints`.

## Quick start

```ts
import {
  getPageByPath,
  resolveMenu,
  getPublicBlockCatalog,
  listPages,
  saveDraft,
  publishPage,
} from '@granit/cms';
import type { AxiosInstance } from '@granit/api-client';

declare const client: AxiosInstance;
const basePath = 'https://api.example.com';
const siteId = '5f1c…';

// ── Public renderer (SSR) ──────────────────────────────────────────────────
// `getPageByPath` returns null on 404 (draft, archived, or unknown path).
const page = await getPageByPath(client, basePath, {
  siteId,
  culture: 'fr-BE',
  path: '/about',
});
const catalog = await getPublicBlockCatalog(client, basePath);
const menu = await resolveMenu(client, basePath, { siteId, key: 'main', culture: 'fr-BE' });

// ── Admin: list, edit draft, publish ───────────────────────────────────────
const pages = await listPages(client, basePath, { page: 1, pageSize: 20 });

const result = await saveDraft(client, basePath, pageId, 'fr-BE', {
  contentJson: JSON.stringify(puckData),
});
if (!result.ok) {
  // Concurrent edit — `result.conflict` carries { pageId, culture }.
} else {
  await publishPage(client, basePath, pageId);
}
```

## Public API

### Functions — public renderer

| Symbol                  | Kind | Purpose                                                             |
| ----------------------- | ---- | ------------------------------------------------------------------- |
| `getPageByPath`         | fn   | `GET /api/cms/pages/by-path` (+ `X-Granit-Site`); `null` on 404     |
| `mintPreviewToken`      | fn   | `POST /api/cms/pages/{id}/preview-token` (admin-gated)              |
| `resolvePreview`        | fn   | `GET /api/cms/preview/resolve?token=`; `null` on 401/404            |
| `getBlockCatalog`       | fn   | `GET /api/cms/blocks` (admin editor catalog)                        |
| `getPublicBlockCatalog` | fn   | `GET /api/cms/blocks/public` (anonymous SSR catalog)                |
| `resolveBlockData`      | fn   | `POST /api/cms/blocks/data`; returns `consumedContentKeys` for ISR  |
| `resolveMenu`           | fn   | `GET /api/cms/menus/resolve` (+ `X-Granit-Site`); `null` if missing |
| `searchPages`           | fn   | `GET /api/cms/search` (anonymous, site-scoped via `X-Granit-Site`)  |
| `searchPagesAdmin`      | fn   | `GET /api/cms/pages/search` (tenant-wide; `Cms.Pages.Read`)         |

### Functions — admin: sites

| Symbol       | Kind | Purpose                                                  |
| ------------ | ---- | -------------------------------------------------------- |
| `listSites`  | fn   | `GET /api/cms/sites` QueryEngine grid (`Cms.Sites.Read`) |
| `getSite`    | fn   | `GET /api/cms/sites/{id}`                                |
| `createSite` | fn   | `POST /api/cms/sites` (`Cms.Sites.Manage`)               |
| `updateSite` | fn   | `PUT /api/cms/sites/{id}`                                |
| `deleteSite` | fn   | `DELETE /api/cms/sites/{id}` → `204`                     |

### Functions — admin: pages

| Symbol                  | Kind | Purpose                                                          |
| ----------------------- | ---- | ---------------------------------------------------------------- |
| `getPageTree`           | fn   | `GET /api/cms/pages/tree` — flat tree-ordered nodes              |
| `listPages`             | fn   | `GET /api/cms/pages` QueryEngine grid (`Cms.Pages.Read`)         |
| `getPage`               | fn   | `GET /api/cms/pages/{id}`                                        |
| `createPage`            | fn   | `POST /api/cms/pages` (`Cms.Pages.Manage`)                       |
| `updatePage`            | fn   | `PUT /api/cms/pages/{id}` — rename slug (concurrency-stamped)    |
| `updatePageTranslation` | fn   | `PUT /api/cms/pages/{id}/translations/{culture}`                 |
| `movePage`              | fn   | `POST /api/cms/pages/{id}/move` — reparent (concurrency-stamped) |
| `deletePage`            | fn   | `DELETE /api/cms/pages/{id}` → `204`                             |
| `saveDraft`             | fn   | `PUT /api/cms/pages/{id}/draft/{culture}` → `SaveDraftResult`    |
| `listPageVersions`      | fn   | `GET /api/cms/pages/{id}/versions`                               |
| `publishPage`           | fn   | `POST /api/cms/pages/{id}/publish` (`Cms.Pages.Publish`)         |
| `unpublishPage`         | fn   | `POST /api/cms/pages/{id}/unpublish` (`Cms.Pages.Publish`)       |
| `rollbackPage`          | fn   | `POST /api/cms/pages/{id}/rollback/{versionId}` → fresh draft    |

### Functions — admin: page editing presence

| Symbol                     | Kind | Purpose                                                     |
| -------------------------- | ---- | ----------------------------------------------------------- |
| `sendPageEditingHeartbeat` | fn   | `POST /api/cms/pages/{id}/editing/heartbeat` — idempotent   |
| `getPageEditingPresence`   | fn   | `GET /api/cms/pages/{id}/editing` — active editors          |
| `leavePageEditing`         | fn   | `DELETE /api/cms/pages/{id}/editing` → `204` (on tab close) |

### Functions — admin: menus

| Symbol       | Kind | Purpose                                                    |
| ------------ | ---- | ---------------------------------------------------------- |
| `listMenus`  | fn   | `GET /api/cms/menus` QueryEngine grid (`Cms.Menus.Read`)   |
| `getMenu`    | fn   | `GET /api/cms/menus/{id}` — editable item tree             |
| `createMenu` | fn   | `POST /api/cms/menus` — `409` if `key` not unique per site |
| `updateMenu` | fn   | `PUT /api/cms/menus/{id}`                                  |
| `deleteMenu` | fn   | `DELETE /api/cms/menus/{id}` → `204`                       |

### Functions — admin: releases

| Symbol                | Kind | Purpose                                                        |
| --------------------- | ---- | -------------------------------------------------------------- |
| `listReleases`        | fn   | `GET /api/cms/releases` QueryEngine grid (`Cms.Releases.Read`) |
| `getRelease`          | fn   | `GET /api/cms/releases/{id}`                                   |
| `createRelease`       | fn   | `POST /api/cms/releases` (`Cms.Releases.Manage`)               |
| `updateRelease`       | fn   | `PUT /api/cms/releases/{id}` — rename                          |
| `addReleaseAction`    | fn   | `POST /api/cms/releases/{id}/actions`                          |
| `removeReleaseAction` | fn   | `DELETE /api/cms/releases/{id}/actions/{actionId}`             |
| `scheduleRelease`     | fn   | `POST /api/cms/releases/{id}/schedule` (IANA time zone)        |
| `cancelRelease`       | fn   | `POST /api/cms/releases/{id}/cancel`                           |
| `publishRelease`      | fn   | `POST /api/cms/releases/{id}/publish` (`Cms.Releases.Publish`) |

### Constants

| Symbol           | Kind  | Purpose                                                          |
| ---------------- | ----- | ---------------------------------------------------------------- |
| `cmsConstraints` | const | Per-DTO validation constraints generated from `cms.json`; fed to |
|                  |       | `createConstraintsResolver` from `@granit/react-validation`      |

### Types

Wire-contract types mirror the .NET records/enums in `Granit.Cms.*.Endpoints/`.
IDs are stringified GUIDs; timestamps are branded `ISODateString` (UTC ISO 8601).

| Symbol                                                                                              | Kind | Purpose                                       |
| --------------------------------------------------------------------------------------------------- | ---- | --------------------------------------------- |
| `BlockRenderSide`, `BlockFieldKind`, `MenuTargetKind`                                               | type | Block / menu enums                            |
| `BlockCatalogEntry`, `BlockCategoryGroup`, `BlockCatalogResponse`                                   | type | Block catalog shapes                          |
| `BlockFieldDescriptor`, `BlockFieldOption`                                                          | type | Editor-agnostic field metadata                |
| `BlockDataResolveRequest`, `BlockDataResponse`                                                      | type | `POST /blocks/data` request / response        |
| `PublishedPageResponse`, `DraftPagePreviewResponse`                                                 | type | Render payloads (`contentJson` = Puck `Data`) |
| `MintPreviewTokenRequest`, `MintPreviewTokenResponse`                                               | type | Preview-token mint flow                       |
| `ResolvedMenu`, `ResolvedMenuItem`                                                                  | type | Render-ready resolved menu tree               |
| `SiteResponse`, `CreateSiteRequest`, `UpdateSiteRequest`                                            | type | Site admin                                    |
| `PageResponse`, `PageTreeNodeResponse`, `PageTranslation`                                           | type | Page admin records                            |
| `PageVersionSummaryResponse`                                                                        | type | One version snapshot summary                  |
| `CreatePageRequest`, `UpdatePageRequest`, `MovePageRequest`                                         | type | Page admin commands                           |
| `UpdatePageTranslationRequest`, `SaveDraftRequest`                                                  | type | Translation / draft commands                  |
| `PageDraftConflictResponse`, `SaveDraftResult`                                                      | type | `409` draft-conflict discriminated result     |
| `PageSearchHitResponse`, `PageSearchPageResponse`, `PageSearchParams`                               | type | Page search shapes                            |
| `PageEditingPresenceEntryResponse`, `PageEditingPresenceResponse`                                   | type | Page-editing presence                         |
| `MenuResponse`, `MenuItemResponse`, `MenuItemRequest`                                               | type | Menu admin shapes                             |
| `CreateMenuRequest`, `UpdateMenuRequest`                                                            | type | Menu admin commands                           |
| `ReleaseStatus`, `ReleaseActionType`, `ReleaseActionStatus`                                         | type | Release lifecycle enums                       |
| `ReleaseResponse`, `ReleaseActionResponse`, `ReleaseSchedule`                                       | type | Release records                               |
| `CreateReleaseRequest`, `UpdateReleaseRequest`, `AddReleaseActionRequest`, `ScheduleReleaseRequest` | type | Release commands                              |
| `ListSitesParams`, `ListPagesParams`, `ListMenusParams`, `ListReleasesParams`                       | type | `QueryRequest` aliases for grids              |

## Out of scope / caveats

- **No React.** This is the core HTTP/types layer. Query keys, hooks, providers,
  block components, the Puck config generator and the menu renderer live in
  [`@granit/react-cms`](../react-cms) and the `react-ui-cms-*` admin kits.
- **No content-string sanitization.** `contentJson` is Puck `Data` as an opaque
  JSON string and `BlockDataResponse.data` is `unknown` — this package neither
  parses nor renders them. Untrusted block data must be sanitized at the render
  boundary in the renderer / `@granit/react-cms`, never assumed safe here.
- **Site scoping is header-driven.** Public reads (`getPageByPath`,
  `resolveMenu`, `searchPages`) and presence calls pass the site via the
  `X-Granit-Site` header, not a query param. The tenant header (`X-Tenant-Id`,
  CSRF and auth) is injected by `@granit/api-client` interceptors — do not set
  them by hand.
- **Optimistic concurrency is body-field, not `If-Match`.** `updatePage`,
  `movePage`, `updateRelease`, `addReleaseAction` and `scheduleRelease` carry a
  `concurrencyStamp` in the request body; a stale stamp yields `409`. Re-fetch,
  re-apply, retry.
- **`saveDraft` does not throw on conflict.** It returns a discriminated
  `SaveDraftResult` (`ok: false` + `conflict`) on `409`; branch on `result.ok`.
- **`cmsConstraints` is generated — do not edit.** It is regenerated from
  `contracts/openapi/cms.json` on pre-commit. Client-side validation is a UX
  aid; the .NET backend (FluentValidation + authorization) is the only
  authoritative check on every route.

## License

Apache-2.0
