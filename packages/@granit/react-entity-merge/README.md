# @granit/react-entity-merge

React bindings for [`@granit/entity-merge`](../entity-merge) — hooks,
presentational building blocks and a headless `MergeWizard` for the
aggregate-merge admin flow. The React counterpart of the .NET
`Granit.EntityMerge` module
([rename PR](https://github.com/granit-fx/granit-dotnet/pull/2422)).

Everything is **headless and label-driven**: components take a `labels` bag and
optional `translate*` callbacks, so they plug into any design system or i18n
setup. All merge types and the HTTP client come from `@granit/entity-merge` —
no duplication.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. Peers:
`@granit/entity-merge`, `@granit/api-client`, `@granit/react-api-client`,
`@tanstack/react-query`, `react`.

## Quick start

```tsx
import {
  EntityMergeProvider,
  MergeWizard,
  entityMergeTranslationsEn,
} from '@granit/react-entity-merge';

<EntityMergeProvider config={{ basePath: '/api/v1/parties' }}>
  <MergeWizard
    survivorId={survivorId}
    loserId={loserId}
    labels={entityMergeTranslationsEn}
    onSuccess={() => navigate(`/parties/${survivorId}`)}
    onCancel={close}
  />
</EntityMergeProvider>;
```

`EntityMergeProvider` resolves its Axios client from `config.client` or the
nearest `<GranitClientProvider>`, and needs a React Query
`<QueryClientProvider>` ancestor.

## What's exported

**Hooks** — `useMergePreview`, `useMergeMutation`, `useFieldChoices`,
`entityMergeKeys`.

**Components** (all headless):

- `MergeWizard` — preview → resolve conflicts → confirm → commit, with
  `renderSurvivor` / `renderLoser` slots for domain summary cards.
- `FieldConflictTable` — one radio group per conflict (Survivor / Loser),
  pre-selecting the recommended default.
- `ReferenceRewriterSummary` — "what will be rewritten" recap from the
  per-rewriter row counts (hides zero-count rewriters).
- `MergeConfirmDialog` — minimal accessible confirm step with an
  irreversibility warning.

**Provider** — `EntityMergeProvider`, `useEntityMergeConfig`,
`buildEntityMergeQueryKey`.

**i18n** — `entityMergeTranslationsEn` / `entityMergeTranslationsFr` convenience label bags.

### Composing into a domain package

A domain package with its own provider and i18n (e.g. `@granit/react-parties`)
typically composes the building blocks directly — `FieldConflictTable`,
`ReferenceRewriterSummary`, `useFieldChoices` plus the core helpers — rather
than mounting a second provider. Use the standalone `MergeWizard` for new
aggregates that don't have a bespoke wizard yet.

## Testing

`@granit/react-entity-merge/testing` exports `createEntityMergeHandlers()` (MSW)
and `mockMergeResult` / `mockEmptyMergeResult` fixtures.

## Out of scope

Duplicate detection, multi-record (3+) merge, un-merge, and external
propagation — see [`@granit/entity-merge`](../entity-merge#out-of-scope).
