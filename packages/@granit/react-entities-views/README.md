# @granit/react-entities-views

React Query hooks for the Granit **entity saved views** module — the
pinnable, shareable, defaultable list/board configurations that drive
list-heavy admin screens. This is the **React hooks layer**: it wraps the
framework-agnostic Axios calls and DTOs from
[`@granit/entities-views`](../entities-views) in TanStack Query hooks with
ready-made query-key factories and cache invalidation. It holds no rendering —
the view tab strip and the dirty-state UX live one layer up, in the consuming
app per the framework / app split.

The split is two packages over the same .NET `Granit.Entities.Views` backend
(contract: `contracts/openapi/entities-views.json`):

- [`@granit/entities-views`](../entities-views) — framework-agnostic core:
  DTOs (`EntityViewResponse`, the body/flag requests, `EntityViewVisibility`)
  plus Axios functions (`listEntityViews`, `createEntityView`,
  `shareEntityView`, …).
- `@granit/react-entities-views` (this package) — React Query hooks +
  query-key factories. No `react-ui-entities-views` admin kit exists yet; the
  visual layer is owned by the consuming app.

This package owns the clean-break replacement for the legacy `useSavedViews`
hook from `@granit/react-query-engine`. Implementation lands across
[granit-fx/granit-front#301](https://github.com/granit-fx/granit-front/issues/301).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must
declare these peers:

- `@granit/entities-views` — core DTOs + Axios calls this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors).
- `@granit/react-api-client` — `useGranitClient`, the context accessor for the
  Axios client every hook resolves from.
- `@tanstack/react-query` (`^5`) and `react` (`^19`).
- `react-i18next` (`^17`) — peer required by the consuming render layer.
- `msw` (`^2.12`, **optional**) — only for the
  `@granit/react-entities-views/testing` subpath.

## Quick start

The hooks resolve the Axios client from `useGranitClient`, so mount a
`<GranitClientProvider>` (from `@granit/react-api-client`) and a TanStack
`QueryClientProvider` above them — there is no per-module provider in this
package. Each hook is keyed by the entity's wire identifier
(e.g. `Granit.Parties.Party`).

```tsx
import {
  useDefaultEntityView,
  useEntityViews,
  useCreateEntityView,
  useShareEntityView,
} from '@granit/react-entities-views';

const ENTITY = 'Granit.Parties.Party';

function PartyViewsBar() {
  // GET .../views — every accessible view (Personal, Shared, Tenant).
  const { data: views } = useEntityViews(ENTITY);
  // GET .../views/_default — resolved effective default, or `null` (204).
  const { data: fallback } = useDefaultEntityView(ENTITY);

  const create = useCreateEntityView(ENTITY);
  const share = useShareEntityView(ENTITY);

  return (
    <>
      {(views ?? []).map((v) => (
        <button key={v.id} type="button">
          {v.name}
          {v.isPersonalDefault ? ' ★' : ''}
        </button>
      ))}

      <button
        type="button"
        onClick={() =>
          create.mutate({
            basedOn: 'default',
            kind: 'list',
            name: 'My open parties',
            description: null,
            icon: null,
            state: { filters: [] },
          })
        }
      >
        Save as new
      </button>

      {/* Notion-style "Save for everyone": promote a Personal view to Shared. */}
      {views?.[0] && (
        <button
          type="button"
          onClick={() =>
            share.mutate({ id: views[0].id, request: { roles: ['admin'], users: [] } })
          }
        >
          Save for everyone
        </button>
      )}
    </>
  );
}
```

Every mutation invalidates the list + default query keys for the entity (and
patches the single-view cache where it has the fresh descriptor), so the next
render picks up the change without manual cache wiring. Read hooks carry a
60-second `staleTime`, short enough that a pinned/shared/deleted view surfaces
quickly through the tab strip.

## Public API

| Symbol | Kind | Purpose |
| --- | --- | --- |
| `useEntityViews` | hook | `GET .../{entity}/views` — every accessible view, sorted |
| `useEntityView` | hook | `GET .../{entity}/views/{id}` — one view (404 = missing or no access) |
| `useDefaultEntityView` | hook | `GET .../{entity}/views/_default` — resolved default, `null` on 204 |
| `useCreateEntityView` | hook | `POST .../views` — create a Personal view; invalidates list + default |
| `useUpdateEntityView` | hook | `PUT .../views/{id}` — edit `name`/`description`/`icon`/`state` |
| `useDeleteEntityView` | hook | `DELETE .../views/{id}` — remove a view; evicts its caches |
| `useSetEntityViewPinned` | hook | `POST .../views/{id}/pin` — toggle pinned-as-tab (`Entities.Views.Manage`) |
| `useSetEntityViewTenantDefault` | hook | `POST .../views/{id}/set-default` — toggle the tenant default |
| `useSetEntityViewPersonalDefault` | hook | `POST .../views/{id}/star` — toggle the caller's personal default |
| `useShareEntityView` | hook | `POST .../views/{id}/share` — promote to Shared / update audience |
| `entityViewsQueryKey` | fn | List cache key — `['entities','views',entity,'list']` |
| `entityViewQueryKey` | fn | Single-view cache key — `[...,'item',id]` |
| `defaultEntityViewQueryKey` | fn | Default-view cache key — `[...,'default']` |
| `UpdateEntityViewVariables` | type | `{ id, request }` for `useUpdateEntityView` |
| `ToggleEntityViewFlagVariables` | type | `{ id, value }` shared by the pin / star / set-default mutations |
| `ShareEntityViewVariables` | type | `{ id, request }` for `useShareEntityView` |

DTOs (`EntityViewResponse`, `EntityViewCreateBodyRequest`,
`EntityViewUpdateBodyRequest`, `EntityViewShareBodyRequest`,
`EntityViewVisibility`, …) and the underlying Axios calls are re-exported from
[`@granit/entities-views`](../entities-views), not from this package.

### `./testing` subpath

Requires the optional `msw` peer. Stateful MSW handlers backed by an in-memory
store, plus fixtures:

- `createEntityViewHandlers` — handlers for the full CRUD + flag surface
  (list / single / default reads; create / update / delete / pin / star /
  set-default / share mutations), seeded from `mockEntityViews`; options
  `{ baseUrl, entityName, views }`. `DEFAULT_BASE_PATH` is `/api/v1/entities`.
- `mockEntityViews`, `mockPersonalView`, `mockTenantView`, `mockSharedView` —
  one fixture per visibility, sorted by `sortOrder`.
- `sampleCreateRequest`, `sampleUpdateRequest`, `sampleShareRequest`,
  `SAMPLE_ENTITY_NAME` (`Granit.Parties.Party`).

## Caveats

- **Default-view sentinel.** `useDefaultEntityView` normalises the backend's
  **204 No Content** (no saved or pinned view) into `data === null`; the
  renderer falls back to the compiled default collection. Check `=== null`
  rather than inspecting the HTTP layer.
- **404 is access-denial too.** `useEntityView` returns 404 both for missing
  views and for views the caller cannot see (same response shape, no scope
  leakage). The result is `isError`; branch on
  `error.response.status === 404` for not-found.
- **Server enforces the flag permissions.** `pin` and `set-default` require
  `Entities.Views.Manage`; `share` requires `Entities.Views.Share`; `star`
  requires ownership; moderation deletes require `Entities.Views.Delete.Any`.
  These hooks issue the calls — they do **not** gate the UI; hide controls with
  the authorization hooks and rely on the backend as the authoritative answer.
- **i18n is the caller's job.** This layer is headless and surfaces raw query
  state; the render layer owns localized labels (hence the `react-i18next`
  peer).

## Out of scope

- **Rendering** — the view tab strip, the dirty badge, save-as-new / update /
  reset, and the "Save for everyone" promotion UX live in the consuming app;
  this package is headless.
- **DTOs and HTTP transport** — owned by
  [`@granit/entities-views`](../entities-views) (mirror of
  `Granit.Entities.Views`); hooks here only adapt them to React Query.
- **Provider/config** — there is none; the Axios client is resolved from the
  ambient `<GranitClientProvider>` via `@granit/react-api-client`.

## License

Apache-2.0
