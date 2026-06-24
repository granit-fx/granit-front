# @granit/taxonomy

Cross-entity **Tags and Categories** SDK — the framework-level TypeScript
counterpart of the .NET `Granit.Taxonomy` module
(contract: `contracts/openapi/taxonomy.json`). Tags are flat, colored,
many-to-many labels; categories are a per-scope tree (one category per target).
Both attach to any aggregate via a polymorphic `(targetType, targetId)`
reference, so the same store classifies documents, parties, and anything else.

This is the framework-agnostic **core** layer: it exposes the DTOs, the Axios
HTTP functions, the permission-name constants, and a `HexColor` guard needed to
drive taxonomy from any client — React, React Native, a CLI, tests. It holds
**no** React, DOM or Node-only dependency. The React Query hooks/providers live
in [`@granit/react-taxonomy`](../react-taxonomy); the per-scope admin UI feature
kit (tag manager, category tree, assignment pickers) lives in
[`@granit/react-ui-taxonomy`](../react-ui-taxonomy).

Every call takes an explicit `basePath` (the taxonomy collection root, e.g.
`/api/v1/taxonomy`); paths encode tags vs. categories vs. search beneath it. All
DTOs carry tenant awareness (`tenantId: string | null` — `null` is a host-level,
cross-tenant entity) and the framework's optimistic-concurrency token
(`concurrencyStamp`, echoed back on edit to detect 409 conflicts).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published to a public registry for app consumption. Declare these peers:

- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors) passed into every call.
- `@granit/types` — shared base types (`ISODateString` on the timestamp fields).

## Quick start

```ts
import {
  listTags,
  createTag,
  assignTag,
  listCategories,
  searchTaxonomy,
  isHexColor,
  TaxonomyPermissions,
} from '@granit/taxonomy';

// Collection root — paths for tags / categories / search hang beneath it.
const basePath = '/api/v1/taxonomy';

// 1. List tags in a scope (optionally narrowed by an autocomplete query).
const tags = await listTags(client, basePath, { scope: 'documents', q: 'draf' });

// 2. Create a tag — validate untrusted color input before casting to HexColor.
const raw = '#3b82f6';
if (!isHexColor(raw)) throw new Error('color must be #RRGGBB');
const tag = await createTag(client, basePath, {
  scope: 'documents',
  name: 'Draft',
  color: raw, // narrowed to HexColor by the guard above
  hideOnEntityCard: null, // null defers to the backend default (false)
});

// 3. Assign it to a polymorphic target (assembly-qualified type + Guid id).
await assignTag(client, basePath, tag.id, {
  targetType: 'Granit.Documents.Domain.Document',
  targetId: documentId,
});

// 4. Categories are a per-scope tree — omit parentId to list the scope roots,
//    pass a node id to lazy-load its children (drive expansion off hasChildren).
const roots = await listCategories(client, basePath, { scope: 'documents' });

// 5. Cross-entity search — '*' searches every scope; results are grouped by
//    target type (label/snippet are empty server-side, see caveats).
const groups = await searchTaxonomy(client, basePath, { q: 'invoice', scope: '*' });

// Permission names mirror the backend policies for client-side UX gating.
TaxonomyPermissions.Tags.Manage; // 'Taxonomy.Tags.Manage'
```

## Public API

| Symbol                       | Kind  | Purpose                                                            |
| ---------------------------- | ----- | ------------------------------------------------------------------ |
| `TagResponse`                | type  | A tag (scope, name, `HexColor`, concurrency, audit timestamps)     |
| `TagListFilter`              | type  | `{ scope, q? }` for `listTags`                                     |
| `CreateTagRequest`           | type  | `POST .../tags` body                                               |
| `UpdateTagRequest`           | type  | `PATCH .../tags/{id}` — required-but-nullable (`null` = unchanged) |
| `TagAssignmentRequest`       | type  | Alias of `TaxonomyTargetRef` — assign body                         |
| `TagAssignmentResponse`      | type  | A tag→target assignment record                                     |
| `CategoryResponse`           | type  | A tree node (path, depth, `parentId`, `hasChildren`, concurrency)  |
| `CategoryDetailResponse`     | type  | `CategoryResponse` flattened with its root→leaf `breadcrumb`       |
| `CategoryListFilter`         | type  | `{ scope, parentId? }` for `listCategories`                        |
| `CreateCategoryRequest`      | type  | `POST .../categories` body                                         |
| `UpdateCategoryRequest`      | type  | `PATCH .../categories/{id}` — required-but-nullable                |
| `MoveCategoryRequest`        | type  | `{ newParentId }` (`null` promotes to a scope root)                |
| `CategoryAssignmentRequest`  | type  | Alias of `TaxonomyTargetRef` — assign body                         |
| `CategoryAssignmentResponse` | type  | A category→target assignment record                                |
| `TaxonomyTargetRef`          | type  | Polymorphic `{ targetType, targetId }` target reference            |
| `TaxonomySearchFilter`       | type  | `{ q, scope?, skip?, take? }` for `searchTaxonomy`                 |
| `TaxonomySearchResultItem`   | type  | One hit (target ref, matched tag/category ids)                     |
| `TaxonomySearchResultGroup`  | type  | Hits grouped by `targetType`                                       |
| `HexColor`                   | type  | `` `#${string}` `` template type for `#RRGGBB` colors              |
| `isHexColor`                 | fn    | Type guard validating a string is a 7-char `#RRGGBB` color         |
| `TaxonomyPermissions`        | const | Permission-name constants (`Tags`/`Categories`/`Search`)           |
| `listTags`                   | fn    | `GET .../tags` — scope-filtered, tolerates `{items}` or array      |
| `getTag`                     | fn    | `GET .../tags/{id}`                                                |
| `createTag`                  | fn    | `POST .../tags`                                                    |
| `updateTag`                  | fn    | `PATCH .../tags/{id}`                                              |
| `deleteTag`                  | fn    | `DELETE .../tags/{id}` (cascades assignments)                      |
| `assignTag`                  | fn    | `POST .../tags/{id}/assign`                                        |
| `unassignTag`                | fn    | `DELETE .../tags/{id}/assign/{targetType}/{targetId}`              |
| `listAssignedTags`           | fn    | `GET .../assignments?targetType=&targetId=` — entity-card chips    |
| `listCategories`             | fn    | `GET .../categories` — scope roots or one node's children          |
| `getCategory`                | fn    | `GET .../categories/{id}` — flattens `{category, breadcrumb}`      |
| `createCategory`             | fn    | `POST .../categories`                                              |
| `updateCategory`             | fn    | `PATCH .../categories/{id}`                                        |
| `moveCategory`               | fn    | `POST .../categories/{id}/move` (cross-scope/cycle → 422)          |
| `deleteCategory`             | fn    | `DELETE .../categories/{id}` (descendants/assignments → 422)       |
| `assignCategory`             | fn    | `POST .../categories/{id}/assign` (single-assignment, idempotent)  |
| `unassignCategory`           | fn    | `DELETE .../categories/assign/{targetType}/{targetId}`             |
| `searchTaxonomy`             | fn    | `GET .../search` — adapts the backend envelope to grouped hits     |
| `attachTagToDocument`        | fn    | Documents-proxy `POST .../documents/{id}/tags/{tagId}`             |
| `detachTagFromDocument`      | fn    | Documents-proxy `DELETE .../documents/{id}/tags/{tagId}`           |
| `listDocumentTags`           | fn    | Documents-proxy `GET .../documents/{id}/tags`                      |

## Out of scope / caveats

- **Documents-proxy is Documents-only.** `attachTagToDocument` /
  `detachTagFromDocument` / `listDocumentTags` are a UX shortcut on the
  Documents surface (`.../documents/{id}/tags`) backed by the same canonical
  store. Everywhere else, use the canonical `assignTag` / `unassignTag` /
  `listAssignedTags` so the same `(targetType, targetId)` shape works across
  modules.
- **Search returns no labels.** The taxonomy backend matches tags/categories but
  does not fan out to entity stores, so `searchTaxonomy` results carry empty
  `label` and `null` `snippet`. Apps wanting rich result rows wire their own
  cross-entity search on top of these target refs.
- **`required` ≠ nullable on PATCH bodies.** `UpdateTagRequest` and
  `UpdateCategoryRequest` fields are required-but-nullable (OpenAPI `required` +
  `["null","T"]`): pass `null` to leave a field unchanged server-side, a value
  to update it — `null` is not "clear".
- **`modifiedAt` is `null` until first edit** (framework audit convention).
  Coalesce `modifiedAt ?? createdAt` for an "updated at" display.
- **Optimistic concurrency, not `If-Match`.** Edits round-trip the
  `concurrencyStamp` body field; a stale token yields `409`. There is no ETag /
  `If-Match` header on this surface.
- **Color validation is structural only.** `isHexColor` enforces the `#RRGGBB`
  shape the backend accepts; it does not normalize case or expand `#RGB`
  shorthand.
- **No React, no rendering.** Query hooks and providers live in
  [`@granit/react-taxonomy`](../react-taxonomy); the tag manager, category tree,
  and assignment pickers live in
  [`@granit/react-ui-taxonomy`](../react-ui-taxonomy). This package is headless.

## License

Apache-2.0
