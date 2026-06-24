# @granit/react-taxonomy

React bindings for the Granit **taxonomy** module — cross-entity **tags** and
**categories**. This is the **React hooks + headless-components layer**: it wraps
the framework-agnostic Axios calls and DTOs from
[`@granit/taxonomy`](../taxonomy) in TanStack Query hooks behind a shared
`TaxonomyProvider`, and ships unstyled, `data-granit-*`-keyed components (chips,
autocomplete, category tree, search bar) that apps skin via `className` plus the
optional `@granit/react-taxonomy/styles.css` Tailwind layer.

The split is three packages over the same .NET `Granit.Taxonomy` backend
(contract: `contracts/openapi/taxonomy.json`):

- [`@granit/taxonomy`](../taxonomy) — framework-agnostic core: DTOs, Axios
  functions (`listTags`, `listCategories`, `assignTag`, …), `permissions.ts`.
- `@granit/react-taxonomy` (this package) — React Query hooks, `TaxonomyProvider`,
  and the headless components.
- [`@granit/react-ui-taxonomy`](../react-ui-taxonomy) — admin UI kit: the
  tag-manager and category-tree admin pages plus the header-mounted cross-entity
  search bar, composing this package's headless components with localised `labels`
  and `@granit/react-authorization` permission gates.

A **tag** is a flat, colored label scoped to a module (`'documents'`,
`'parties'`, …) and assignable to any polymorphic target. A **category** is a
single-assignment node in a per-scope tree (root → leaf breadcrumb). Both attach
to a target identified by an assembly-qualified `targetType` plus a `targetId`.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/taxonomy` — core DTOs + Axios calls this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors).
- `@granit/react-api-client` — `useOptionalGranitClient`, the context fallback for
  the Axios client when `config.client` is omitted.
- `@granit/react-ui` — `Tree`/`TreeItem` primitives used by `CategoryTree`.
- `@granit/types` — shared base types (e.g. branded `ISODateString`).
- `@tanstack/react-query` (`^5`) and `react` (`^19`).
- `msw` (`^2.12`, **optional**) — only for the `@granit/react-taxonomy/testing`
  subpath.

Import `@granit/react-taxonomy/styles.css` once to opt into the default Tailwind
styling of the `data-granit-*` markers, or leave it out and style the components
entirely yourself.

## Quick start

Wire the provider once (it resolves the Axios client, base path, and an optional
query-key prefix), then drop the headless components anywhere below it.

```tsx
import { TaxonomyProvider, TagChipStrip, CategorySelector } from '@granit/react-taxonomy';
import { useGranitClient } from '@granit/react-api-client';
import '@granit/react-taxonomy/styles.css';

function App({ children }: { children: React.ReactNode }) {
  // `client` may be omitted if a <GranitClientProvider> is already mounted.
  return (
    <TaxonomyProvider config={{ client: useGranitClient() }}>
      {children}
    </TaxonomyProvider>
  );
}

function DocumentSidebar({ doc }: { doc: { id: string; categoryId: string | null } }) {
  const targetType = 'Granit.Documents.Domain.Document';
  return (
    <>
      <TagChipStrip scope="documents" targetType={targetType} targetId={doc.id} canManage />
      <CategorySelector
        scope="documents"
        targetType={targetType}
        targetId={doc.id}
        value={doc.categoryId}
        canManage
      />
    </>
  );
}
```

`canManage` is a UX gate the host derives from `usePermissions()`
(`Taxonomy.Tags.Manage` / `Taxonomy.Categories.Manage`); it hides mutating
controls but is **not** an enforcement boundary — the backend re-checks every
write. For the entity-detail surface, `entityTaxonomy({ scope })` is a factory
that bundles the chip strip and category selector into a single renderer.

Hooks are available for bespoke surfaces; each reads its config from the nearest
provider:

```tsx
import { useTags, useAssignTag, useCategories } from '@granit/react-taxonomy';

function TagPicker({ scope, targetId }: { scope: string; targetId: string }) {
  const { data: tags } = useTags({ scope, q: '' });
  const assign = useAssignTag();
  return tags?.map((tag) => (
    <button
      key={tag.id}
      type="button"
      onClick={() =>
        assign.mutate({
          tagId: tag.id,
          target: { targetType: 'Granit.Documents.Domain.Document', targetId },
        })
      }
    >
      {tag.name}
    </button>
  ));
}
```

## Public API

| Symbol                                                | Kind      | Purpose                                                       |
| ----------------------------------------------------- | --------- | ------------------------------------------------------------- |
| `TaxonomyProvider`                                    | provider  | Supplies client, base path, query-key prefix to hooks below   |
| `useTaxonomyConfig`                                   | hook      | Read the resolved config; throws outside a provider           |
| `buildTaxonomyQueryKey`                               | fn        | Query-key factory honoring the configured `queryKeyPrefix`    |
| `useTags`                                             | hook      | List tags in a scope, optionally narrowed by autocomplete `q` |
| `useTagAssignments`                                   | hook      | Tags assigned to a target for the chip strip                  |
| `useCategories`                                       | hook      | List a category's children (`parentId: null` → scope roots)   |
| `useCategory`                                         | hook      | Single category with its full root→leaf breadcrumb            |
| `useTaxonomySearch`                                   | hook      | Cross-entity search, grouped by target type (debounce above)  |
| `useDocumentTags`                                     | hook      | Tags for a document via the Documents proxy                   |
| `useCreateTag` / `useUpdateTag` / `useDeleteTag`      | hook      | Tag CRUD mutations with scoped cache invalidation             |
| `useAssignTag` / `useUnassignTag`                     | hook      | Attach/detach a tag to a polymorphic target                   |
| `useAttachTagToDocument` / `useDetachTagFromDocument` | hook      | Document-proxy tag attach/detach                              |
| `useCreateCategory` / `useUpdateCategory`             | hook      | Category create / rename mutations                            |
| `useDeleteCategory` / `useMoveCategory`               | hook      | Delete / reparent (422s on cross-scope moves and cycles)      |
| `useAssignCategory` / `useUnassignCategory`           | hook      | Single-assignment category attach/detach for a target         |
| `TagChip`                                             | component | Headless chip with contrast-aware text + optional remove      |
| `TagAutocomplete`                                     | component | Headless typeahead; inline-create on Enter when `canManage`   |
| `TagChipStrip`                                        | component | Tag assignments for a target + inline editing                 |
| `DocumentTagChipStrip`                                | component | Documents-proxy variant of `TagChipStrip`                     |
| `TagManager`                                          | component | Per-scope tag admin table (read-only when `!canManage`)       |
| `CategoryBreadcrumb`                                  | component | Read-only chevron-separated breadcrumb of a category          |
| `CategoryTree`                                        | component | Expandable per-scope tree with optional admin actions         |
| `CategorySelector`                                    | component | Pick/clear a category; host owns the current `value`          |
| `TaxonomySearchBar`                                   | component | Cross-entity search bar; owns its debounce + min-length       |
| `entityTaxonomy`                                      | fn        | Factory → `EntityTaxonomy` (chip strip + category selector)   |
| `API_VERSION` / `MODULE`                              | const     | Module slug + API version used to build the base path         |
| `DEFAULT_BASE_PATH` / `DEFAULT_QUERY_KEY_PREFIX`      | const     | Default endpoint base + query-key prefix                      |
| `taxonomyTranslationsEn` / `taxonomyTranslationsFr`   | const     | i18next resource bundles (namespace `taxonomy`)               |
| `TaxonomyConfig` / `ResolvedTaxonomyConfig`           | type      | Provider input and resolved output                            |
| `TaxonomyProviderProps`                               | type      | `{ config, children }`                                        |
| `UseTaxonomySearchOptions` / `DocumentTagsBindings`   | type      | Hook option shapes                                            |
| `*Props` / `*Labels`                                  | type      | Per-component props and localizable label bags                |
| `EntityTaxonomyContributionOptions`                   | type      | `entityTaxonomy` factory options                              |
| `EntityTaxonomyProps`                                 | type      | Props of the rendered `EntityTaxonomy` component              |
| `TaxonomyTranslations`                                | type      | Shape of the i18next resource bundles                         |

### `./testing` subpath

Requires the optional `msw` peer. Exports `createTaxonomyHandlers(baseUrl?)`
(stateful MSW handlers over an in-memory store, default base
`/api/v1/taxonomy`), plus `createTaxonomyStore` and the `TaxonomyStore` type for
seeding or asserting against that store directly.

## i18n

Components in this package **do not** call `useTranslation` — they expose
`labels` props that apps populate from their own `t()`. This keeps them testable
without an i18next bootstrap and keeps the framework headless. Register the
bundles under the `taxonomy` namespace if you want the shipped en/fr strings:

```ts
i18n.addResourceBundle('en', 'taxonomy', taxonomyTranslationsEn);
i18n.addResourceBundle('fr', 'taxonomy', taxonomyTranslationsFr);
```

Front-end packages in this repo uniformly ship en + fr only; backend permission
labels reach the role editor through the backend's own localization pipeline
(18 cultures via `PermissionGroup:Taxonomy`), independent of these bundles.

## Caveats

- **`canManage` is a UX hint, not a security boundary.** It hides mutating
  controls; the .NET backend re-checks `Taxonomy.Tags.Manage` /
  `Taxonomy.Categories.Manage` on every write. Never rely on it for
  confidentiality. See [`@granit/react-authorization`](../react-authorization)
  for the full client-side authorization posture.
- **Headless by design.** Components render `data-granit-*` markers and carry no
  design-system dependency beyond the `@granit/react-ui` tree primitives used by
  `CategoryTree`. Either import `@granit/react-taxonomy/styles.css` (semantic
  Tailwind tokens — dark mode and tenant theme overrides flow through) or style
  the markers yourself.
- **`DocumentTagChipStrip` routes through the Documents proxy**
  (`/api/v1/documents/{id}/tags`), which sits *above* the `/api/v1/taxonomy`
  surface — pass its `basePath` explicitly (the Documents API base, e.g.
  `/api/v1`). Both paths share the same canonical store, so edits propagate
  across surfaces. Use it on the Documents detail page only; elsewhere prefer
  `TagChipStrip`.
- **`CategorySelector` does not own the current assignment.** Per-target reads
  aren't exposed on the canonical surface, so the host passes `value` from the
  entity payload and may use the `onAssign` / `onUnassign` callbacks to keep
  local state in sync.
- **`entityTaxonomy` is a standalone factory, not a panel registration.**
  `SidePanelKind` in `@granit/entities` is a closed union; until a `'Taxonomy'`
  variant is added there, hosts call the factory at wiring time and render the
  returned component themselves.
- **Callers debounce search input.** `useTaxonomySearch` uses `keepPreviousData`
  but does not own a timer; `TaxonomySearchBar` debounces internally (default
  300 ms, min 2 chars).

## Out of scope

- **DTOs and HTTP transport** — owned by [`@granit/taxonomy`](../taxonomy)
  (mirror of `Granit.Taxonomy`); the hooks here only adapt them to React Query.
- **Admin pages and routing** — the tag-manager / category-tree pages and the
  header search bar live in [`@granit/react-ui-taxonomy`](../react-ui-taxonomy).
- **Authentication and authorization enforcement** — this package consumes an
  already-authenticated Axios client and uses permissions purely for UX gating.

## License

Apache-2.0
