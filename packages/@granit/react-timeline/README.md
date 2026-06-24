# @granit/react-timeline

React hooks, provider, and headless components for the Granit **timeline**
module — the per-entity activity feed (stream pagination, comments/notes,
followers, and emoji reactions). This is the **React hooks layer**: it wraps the
framework-agnostic Axios calls and DTOs from [`@granit/timeline`](../timeline) in
TanStack Query mutations and stateful hooks behind a shared `TimelineProvider`
for client/base-path/query-key configuration. Rendering chrome (composer,
mention picker, emoji palette) lives one layer up.

The split is three packages over the same .NET `Granit.Timeline` backend
(contract: `contracts/openapi/timeline.json`):

- [`@granit/timeline`](../timeline) — framework-agnostic core: DTOs + Axios
  functions (`getStream`, `createEntry`, `toggleReaction`, …), the reaction-emoji
  parsers, and `TimelinePermissions`.
- `@granit/react-timeline` (this package) — React Query hooks, the provider, the
  headless `ReactionBar`, and the `timeline` i18n bundles.
- [`@granit/react-ui-timeline`](../react-ui-timeline) — admin UI kit: the styled
  stream, entry rows, the `@`-mention composer, and the emoji-mart picker.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/timeline` — core DTOs + Axios calls this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors).
- `@granit/react-api-client` — `useOptionalGranitClient`, the context fallback for
  the Axios client when `config.client` is omitted.
- `@granit/query-engine` / `@granit/react-query-engine` — `useInfiniteScroll` and
  the `TimelineEntryPage` paging shape that `useTimeline` composes.
- `@granit/logger` — `createLogger` for the action/follower mutation loggers.
- `@tanstack/react-query` (`^5`) and `react` (`^19`).
- `msw` (`^2.12`, **optional**) — only for the `@granit/react-timeline/testing`
  subpath.

The default skin for `<ReactionBar>` ships separately as a CSS subpath; import it
after Tailwind + `@granit/ui-theme`:

```ts
import '@granit/react-timeline/styles.css';
```

## Quick start

Wire the provider once (it resolves the Axios client, base path defaulting to
`/api/v1/timeline`, and an optional query-key prefix), then call the hooks
anywhere below it. Every hook is scoped to a single stream by its
`(entityType, entityId)` pair.

```tsx
import { TimelineProvider, useTimeline, useTimelineActions } from '@granit/react-timeline';
import { TimelineEntryType } from '@granit/timeline';
import { useGranitClient } from '@granit/react-api-client';

function App({ children }: { children: React.ReactNode }) {
  // `client` may be omitted if a <GranitClientProvider> is already mounted.
  return (
    <TimelineProvider config={{ client: useGranitClient() }}>
      {children}
    </TimelineProvider>
  );
}

function Feed({ entityType, entityId }: { entityType: string; entityId: string }) {
  const { entries, hasMore, loadMore, loading, addOptimisticEntry, degradedSources } =
    useTimeline({ entityType, entityId });
  const { postEntry, posting } = useTimelineActions({
    entityType,
    entityId,
    onEntryCreated: addOptimisticEntry, // optimistic prepend, no full refresh
  });

  if (loading) return null;
  return (
    <>
      {degradedSources.length > 0 && <PartialDataBanner sources={degradedSources} />}
      {entries.map((e) => (
        <article key={e.id}>{e.body}</article>
      ))}
      {hasMore && <button onClick={loadMore} type="button">Load more</button>}
      <button
        type="button"
        disabled={posting}
        onClick={() => postEntry({ entryType: TimelineEntryType.Comment, body: 'Hi' })}
      >
        Comment
      </button>
    </>
  );
}
```

Reactions are a separate concern. `<ReactionBar>` is headless — it renders one
button per emoji present on an entry; wire `onToggle` to `useToggleReaction()`,
which performs **scoped** optimistic patch + rollback on the React Query cache
keyed by `(entityType, entityId)`:

```tsx
import { ReactionBar, useToggleReaction } from '@granit/react-timeline';
import type { TimelineStreamEntryResponse } from '@granit/timeline';

function EntryReactions({
  entry,
  entityType,
  entityId,
}: {
  entry: TimelineStreamEntryResponse;
  entityType: string;
  entityId: string;
}) {
  const toggle = useToggleReaction();
  return (
    <ReactionBar
      entryId={entry.id}
      reactions={entry.reactions}
      onToggle={({ entryId, emoji }) => toggle.mutate({ entityType, entityId, entryId, emoji })}
    />
  );
}
```

## Public API

| Symbol | Kind | Purpose |
| --- | --- | --- |
| `TimelineProvider` | provider | Supplies client, base path, query-key prefix to all hooks below it |
| `useTimelineConfig` | hook | Read the resolved `TimelineConfig`; throws outside a provider |
| `buildTimelineQueryKey` | fn | Query-key factory honoring the configured `queryKeyPrefix` |
| `useTimeline` | hook | Infinite-scroll stream + optimistic add/remove/`patchEntry` helpers |
| `useTimelineActions` | hook | `postEntry` / `removeEntry` (`POST`/`DELETE .../entries`) |
| `useTimelineFollowers` | hook | `followers` list + `follow`/`unfollow`/`isFollowing` |
| `useToggleReaction` | hook | Toggle one emoji with scoped optimistic patch + rollback |
| `applyToggleResult` | fn | Merge a `ReactionToggleResponse` into a `ReactionMap` (server truth) |
| `useAnchorEntry` | hook | Materialise the native shadow row for an external source entry |
| `useUpdateEntryBody` | hook | Edit a Comment/InternalNote body within the edit window (`PATCH`) |
| `ReactionBar` | component | Headless per-entry reaction tally; read-only when `onToggle` omitted |
| `timelineTranslationsEn` | const | English i18next bundle (namespace `timeline`) |
| `timelineTranslationsFr` | const | French i18next bundle (namespace `timeline`) |
| `TimelineProviderConfig` | type | Provider input (optional client / basePath / queryKeyPrefix) |
| `TimelineProviderProps` | type | `{ config, children }` |
| `Use*Options` / `Use*Return` | type | Per-hook option and return shapes |
| `*Variables` | type | Mutation argument shapes (`Toggle`/`Anchor`/`UpdateEntryBody`) |
| `ReactionBarProps` / `…Labels` | type | `ReactionBar` props and aria-label overrides |
| `TimelineTranslations` | type | Shape of the i18n bundles |

`./testing` subpath (requires the optional `msw` peer): `createTimelineHandlers`
(stateful MSW handlers, default base `/api/v1/timeline` — stream, entries, anchor,
reactions, followers) plus the `mockTimelineEntries` fixture.

## Caveats

- **`useTimeline` does not use the React Query cache.** It keeps stream state in
  its own `useState` via `useInfiniteScroll`. `useToggleReaction` patches the
  *React Query* cache only — apps using both must wire the mutation's success to
  `useTimeline.refresh()` (or apply `applyToggleResult` through `patchEntry`)
  themselves. Apps that maintain a React Query stream cache get the scoped
  patching out of the box.
- **External entries need anchoring before reactions/edits.** Entries with
  `origin === 'External'` have no native id until materialised. Call
  `useAnchorEntry` first (idempotent server-side — a deterministic v5 GUID), then
  pass the returned shadow id as `entryId` to `useToggleReaction`. The reaction
  endpoint only operates on native ids.
- **Degraded sources are last-call-wins.** `useTimeline().degradedSources`
  reflects only the most recent page fetch, not the union across pagination; it
  resets to `[]` on a healthy page so the host can clear its "partial data"
  banner.
- **Edit gating is server-authoritative.** `useUpdateEntryBody` succeeds only for
  the current user's own Comment/InternalNote within the configured window; the
  four backend gates (origin, type, authorship, window) surface as RFC 7807 `403`
  with a machine-readable `reason` — inspect the axios error to localise the
  message.
- **i18n is opt-in and prop-driven.** Components here never call `useTranslation`;
  they expose `labels` props that apps populate from `t()`. Register the bundles
  with `i18n.addResourceBundle('en'/'fr', 'timeline', …)`.
- **`<ReactionBar>` is headless and picker-neutral.** It renders only the emojis
  already present on an entry — adding a *new* reaction is the consumer's job
  (each product owns its picker UX and feeds the chosen glyph back through
  `onToggle`). The glyph is rendered as plain text under
  `data-granit-reaction-bar-emoji`; the optional `styles.css` skin hides the
  short-name and injects the glyph via a `::after` keyed on `data-emoji` (no
  `innerHTML`, no Trusted-Types sink).

## Out of scope

- **Styled rendering** — the stream, entry rows, the `@`-mention composer, and the
  emoji-mart picker live in [`@granit/react-ui-timeline`](../react-ui-timeline).
  This package is headless apart from the unstyled `ReactionBar`.
- **DTOs, HTTP transport, and permissions** — owned by
  [`@granit/timeline`](../timeline) (mirror of `Granit.Timeline`); hooks here only
  adapt the Axios calls to React Query and local state.
- **Authorization enforcement** — client-side gating (e.g. omitting `onToggle`
  when the user lacks `Timeline.Reactions.React`) is a UX hint only; the .NET
  backend re-checks every call.

## License

Apache-2.0
