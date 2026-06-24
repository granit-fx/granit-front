# @granit/react-entity-merge

React bindings for the Granit **entity merge** flow — TanStack Query hooks, a
shared `EntityMergeProvider`, and headless presentational building blocks
(`FieldConflictTable`, `ReferenceRewriterSummary`, `MergeConfirmDialog`) topped
by a complete, label-driven `MergeWizard`. This is the **React hooks + headless
components layer**: it wraps the framework-agnostic DTOs and Axios calls from
[`@granit/entity-merge`](../entity-merge) and owns no DTO or HTTP logic of its
own. It is the React counterpart of the .NET `Granit.EntityMerge` module
([rename PR](https://github.com/granit-fx/granit-dotnet/pull/2422)).

A merge folds a **loser** aggregate into a **survivor**: scalar conflicts are
resolved per-field, cross-module foreign keys are rewritten, and the loser is
soft-archived (tombstoned). The flow is dry-run preview → resolve conflicts →
confirm → commit. Everything here is **headless and label-driven** — components
take a `labels` bag plus optional `translate*` callbacks, so they drop into any
design system or i18n setup. The split is two packages over the same backend:

- [`@granit/entity-merge`](../entity-merge) — framework-agnostic core: merge
  DTOs, the Axios calls (`previewMerge`, `executeMerge`, …), and pure helpers
  (`seedFieldChoices`, `resolveWinner`, `classifyMergeError`).
- `@granit/react-entity-merge` (this package) — React Query hooks, provider, and
  headless components. There is no `react-ui` admin feature kit; domain packages
  (`@granit/react-parties`, …) compose these building blocks directly.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/entity-merge` — core merge DTOs, Axios calls, and helpers this layer
  wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors).
- `@granit/react-api-client` — `useOptionalGranitClient`, the context fallback for
  the Axios client when `config.client` is omitted.
- `@tanstack/react-query` (`^5`) and `react` (`^19`).
- `msw` (`^2.12`, **optional**) — only for the `@granit/react-entity-merge/testing`
  subpath.

## Quick start

Wire the provider once (it resolves the Axios client and the aggregate's
`basePath`), then mount the wizard or compose the building blocks below it. A
React Query `<QueryClientProvider>` ancestor is required.

```tsx
import {
  EntityMergeProvider,
  MergeWizard,
  entityMergeTranslationsEn,
} from '@granit/react-entity-merge';

// `basePath` is the mergeable aggregate's collection root — the
// `/{survivorId}/merge[/preview]` suffix is appended by the hooks.
function MergePartiesScreen({ survivorId, loserId }: { survivorId: string; loserId: string }) {
  return (
    <EntityMergeProvider config={{ basePath: '/api/v1/parties' }}>
      <MergeWizard
        survivorId={survivorId}
        loserId={loserId}
        labels={entityMergeTranslationsEn}
        onSuccess={() => navigate(`/parties/${survivorId}`)}
        onCancel={close}
      />
    </EntityMergeProvider>
  );
}
```

`EntityMergeProvider` resolves its Axios client from `config.client` or the
nearest `<GranitClientProvider>` and throws if neither is present. Domain
packages with their own provider and i18n typically skip `MergeWizard` and
compose the lower-level pieces against a single shared provider:

```tsx
import {
  useMergePreview,
  useFieldChoices,
  useMergeMutation,
  FieldConflictTable,
  ReferenceRewriterSummary,
} from '@granit/react-entity-merge';

function CustomMerge({ survivorId, loserId, labels }: MergeProps) {
  const { data: preview, isLoading, isError } = useMergePreview(survivorId, loserId);
  const { choices, setChoice } = useFieldChoices(preview?.conflicts ?? []);
  const mutation = useMergeMutation(survivorId);

  return (
    <>
      <FieldConflictTable
        conflicts={preview?.conflicts ?? []}
        choices={choices}
        onChoiceChange={setChoice}
        labels={labels.conflictTable}
        isLoading={isLoading}
        isError={isError}
      />
      <ReferenceRewriterSummary
        rewriteCounts={preview?.rewriteCounts ?? {}}
        labels={labels.rewriterSummary}
      />
      <button
        type="button"
        onClick={() =>
          mutation.mutate({ request: { loserId, choices, reason: null, dryRun: false } })
        }
      >
        Merge
      </button>
    </>
  );
}
```

`useMergePreview` self-disables until both ids are present and distinct;
`useMergeMutation` generates a fresh idempotency key per submit, invalidates the
cached preview after a committed (non-dry-run) merge, and accepts an
`onInvalidate` callback to refresh aggregate-specific list/detail queries.

## Public API

| Symbol                      | Kind      | Purpose                                                                        |
| --------------------------- | --------- | ------------------------------------------------------------------------------ |
| `EntityMergeProvider`       | provider  | Supplies the resolved Axios client, `basePath`, and query-key prefix to hooks  |
| `useEntityMergeConfig`      | hook      | Read the resolved config; throws outside a provider                            |
| `buildEntityMergeQueryKey`  | fn        | Query-key factory prepending the configured `queryKeyPrefix`                   |
| `entityMergeKeys`           | const     | Query-key segment factory (`all`, `preview(survivorId, loserId)`)              |
| `useMergePreview`           | hook      | Dry-run preview for a `(survivor, loser)` pair; disabled until ids differ      |
| `useMergeMutation`          | hook      | Commit the live merge; auto idempotency key + cache invalidation on success    |
| `useFieldChoices`           | hook      | Local per-field choice state seeded from each conflict's recommended default   |
| `MergeWizard`               | component | Full headless flow: preview → resolve → confirm → commit                       |
| `FieldConflictTable`        | component | Headless radio-group table, one Survivor/Loser choice per conflict             |
| `ReferenceRewriterSummary`  | component | Headless recap of non-zero cross-module rewrite counts                         |
| `MergeConfirmDialog`        | component | Minimal accessible confirm step with an irreversibility warning                |
| `entityMergeTranslationsEn` | const     | Default English `MergeWizardLabels` bag (convenience)                          |
| `entityMergeTranslationsFr` | const     | Default French `MergeWizardLabels` bag (convenience)                           |
| `API_VERSION`               | const     | Current wire API version (`'v1'`)                                              |
| `DEFAULT_QUERY_KEY_PREFIX`  | const     | Fallback query-key prefix (`['entity-merge']`)                                 |
| `EntityMergeConfig`         | type      | Provider input (optional `client`, required `basePath`, optional prefix)       |
| `ResolvedEntityMergeConfig` | type      | Provider output with the resolved required `client`                            |
| `EntityMergeProviderProps`  | type      | `{ config, children }`                                                         |
| `UseMergePreviewOptions`    | type      | `{ enabled? }` for `useMergePreview`                                           |
| `MergeMutationVariables`    | type      | `{ request, idempotencyKey? }` for `useMergeMutation`                          |
| `UseFieldChoicesResult`     | type      | `{ choices, winnerFor, setChoice, reset }`                                     |
| `*Props` / `*Labels`        | type      | Per-component props and label bags for the four headless components            |

The merge DTOs themselves (`MergeResult`, `MergeRequest`, `FieldConflict`,
`WinnerSide`, `MergeFieldChoices`, `MergeErrorKind`) are owned by and imported
from [`@granit/entity-merge`](../entity-merge) — this layer re-exposes none of
them.

## Testing

The `./testing` subpath (requires the optional `msw` peer) exports
`createEntityMergeHandlers()` — stateful MSW handlers whose `GET .../merge/preview`
returns the fixture as a dry-run and whose `POST .../merge` echoes it with
`dryRun` reflecting the request body, so one test exercises both preview and
commit. It defaults to the `/api/v1/mergeables` base path (overridable via
`basePath`). Fixtures `mockMergeResult` (two conflicts, two non-zero rewrite
counts), `mockEmptyMergeResult`, and the `MOCK_BASE_PATH` constant ship
alongside, plus the `CreateEntityMergeHandlersOptions` type.

## Caveats

- **Client-side gating is a UX hint, not enforcement.** Authorization to merge
  is decided on the .NET backend; hiding the wizard does not stop a crafted
  request. Gate the entry point with the app's permission hooks and rely on the
  server's `403` as the boundary.
- **A merge is irreversible.** There is no un-merge — the loser is soft-archived
  and its references reattach to the survivor. `MergeConfirmDialog` and the
  default label bags carry that warning; keep it when supplying your own labels.
- **i18n stays the caller's job.** `MergeWizard` maps `MergeErrorKind` to copy
  through its `labels.errors` bag (enriching `domain`/`validation`/`unknown`
  with the server `detail`); `entityMergeTranslationsEn`/`Fr` are convenience
  defaults — domain packages build their own labels from translation keys.
- **Components are headless.** They carry only minimal Tailwind utility classes
  and shadcn-style design tokens (`text-muted-foreground`, `bg-destructive`, …);
  wrap and theme them with the host design system.

## Out of scope

- **DTOs, HTTP transport, and pure helpers** — owned by
  [`@granit/entity-merge`](../entity-merge) (mirror of `Granit.EntityMerge`);
  hooks here only adapt them to React Query.
- **Duplicate detection, multi-record (3+) merge, un-merge, and external
  propagation** — not implemented backend-side; see
  [`@granit/entity-merge`](../entity-merge#out-of-scope).

## License

Apache-2.0
