# @granit/timeline

Entity-agnostic **activity timeline** SDK — the framework-level TypeScript
counterpart of the .NET `Granit.Timeline` backend module
(contract: `contracts/openapi/timeline.json`).

This is the framework-agnostic **core** layer: it exposes the DTOs, branded ids,
HTTP client functions, the reaction-emoji parsers, and the `TimelinePermissions`
registry needed to drive a per-entity activity feed from any client — React,
React Native, a CLI, tests. It holds **no** React, DOM or Node-only dependency.
The React Query hooks/provider layer lives in
[`@granit/react-timeline`](../react-timeline); the styled admin UI kit (stream,
`@`-mention composer, emoji-mart picker) lives in
[`@granit/react-ui-timeline`](../react-ui-timeline).

A timeline is a **federated**, per-entity stream: native rows stored directly in
the timeline table (`Comment`, `InternalNote`, `SystemLog`) are merged with
entries projected from registered `ITimelineSource` contributors (audit,
workflow, …). Contributors are keyed by a soft `sourceKey` string, so new
sources plug in without an enum bump; a contributor that times out or throws is
dropped from the page under the backend `DegradeGracefully` policy and surfaced
in `degradedSources`. The stream is paginated, entries carry threaded replies,
attachments, and an aggregated reaction map; callers can follow entities, edit
their own recent entries, react with any well-formed emoji, and anchor an
external entry to a stable native id before reacting or replying to it.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published to a public registry for app consumption. A consumer must declare these
peers:

- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors) passed into every call, plus `buildApiUrl`.
- `@granit/query-engine` — `PagedResult` / `PaginationParams` for the stream page
  and query params.
- `@granit/types` — shared branded base types (`EntityId`, `UserId`,
  `ISODateString`).

## Quick start

```ts
import {
  getStream,
  createEntry,
  updateTimelineEntryBody,
  followEntity,
  toggleReaction,
  parseReactionEmoji,
  TimelineEntryType,
  TimelinePermissions,
} from '@granit/timeline';

// `basePath` is the timeline collection root; `(entityType, entityId)` scopes
// the stream to one aggregate — the same calls work for any followed entity.
const basePath = '/api/v1/timeline';
const entityType = 'party';
const entityId = '0193…';

// 1. Fetch one page. `degradedSources` is non-empty when a federated
//    contributor timed out — surface a "partial data" indicator.
const { page, degradedSources } = await getStream(client, basePath, entityType, entityId, {
  pageSize: 25,
});
if (degradedSources.length > 0) {
  // e.g. ['auditing'] — its rows are missing from this page.
}

// 2. Post a comment. `entryType` is one of the native kinds.
const entry = await createEntry(client, basePath, entityType, entityId, {
  entryType: TimelineEntryType.Comment,
  body: 'Called the customer — will follow up Monday.',
});

// 3. Edit own recent entry. Four server-side gates (origin, type, authorship,
//    edit window) reject with 403 + a `TimelineEntryNotEditableReason`.
await updateTimelineEntryBody(client, basePath, entityType, entityId, entry.id, {
  body: 'Called the customer — follow up scheduled for Monday 10:00.',
});

// 4. Follow the entity, then toggle a reaction. `parseReactionEmoji` validates
//    untrusted input against the backend grammar and brands the value.
await followEntity(client, basePath, entityType, entityId);
const thumbsUp = parseReactionEmoji('👍');
if (thumbsUp) {
  const state = await toggleReaction(client, basePath, entry.id, thumbsUp);
  // state.currentUserHasReacted: boolean, state.count: number — merge back
  // into the entry's `reactions` map.
}

// Gate UI off the wire-aligned permission keys (UX hint, not enforcement).
TimelinePermissions.Reactions.React; // 'Timeline.Reactions.React'
```

## Public API

| Symbol | Kind | Purpose |
| ------ | ---- | ------- |
| `getStream` | fn | `GET {basePath}/{type}/{id}` — page + degraded contributors |
| `createEntry` | fn | `POST .../entries` — post a Comment / InternalNote |
| `updateTimelineEntryBody` | fn | `PATCH .../entries/{entryId}` — edit own recent entry body |
| `deleteEntry` | fn | `DELETE .../entries/{entryId}` — soft-delete an entry |
| `anchorTimelineEntry` | fn | `POST .../anchor` — materialise a shadow row for an external entry |
| `followEntity` / `unfollowEntity` | fn | `POST` / `DELETE .../follow` — (un)subscribe the caller |
| `getFollowers` | fn | `GET .../followers` — follower user ids |
| `toggleReaction` | fn | `POST .../entries/{entryId}/reactions/{emoji}` — idempotent toggle |
| `parseReactionEmoji` | fn | Validate untrusted input → branded `ReactionEmoji` or `null` |
| `toReactionEmoji` | fn | Unchecked brand cast for already-validated emoji (hot path) |
| `isValidSourceKey` | fn | Test a `sourceKey` against `^[a-z][a-z0-9_-]{0,63}$` |
| `TimelinePermissions` | const | Wire-aligned permission keys (`Timeline.Entries.Read`, …) |
| `TimelineEntryType` | const | Native entry kinds (`Comment` / `SystemLog` / `InternalNote`) |
| `TimelineEntryOrigin` | const | `Native` / `External` origin discriminator |
| `TimelineSourceKeys` | const | Well-known `sourceKey` values (`native`) |
| `TimelineEntryNotEditableReason` | const | RFC 7807 `reason` codes for a rejected edit |
| `TimelineStreamEntryResponse` | type | One stream entry (author, body, attachments, reactions, origin) |
| `TimelineStreamPage` | type | `{ page, degradedSources }` — stream fetch result |
| `TimelineEntryPage` | type | `PagedResult<TimelineStreamEntryResponse>` |
| `TimelineAttachmentInfoResponse` | type | Attachment metadata (blob id, name, content type, size) |
| `PostTimelineEntryRequest` | type | `createEntry` body (type, body, parent, attachment blob ids) |
| `TimelineQueryParams` | type | Pagination params for `getStream` |
| `TimelineConfig` | type | `{ client, basePath, queryKeyPrefix }` — provider input shape |
| `ReactionMap` | type | Per-emoji aggregate summary keyed by glyph |
| `ReactionAggregateResponse` | type | One emoji's `{ count, byCurrentUser, displayEmoji }` |
| `ReactionToggleResponse` | type | Post-toggle authoritative state for one `(entry, emoji)` pair |
| `ReactionEmoji` | type | Branded well-formed Unicode emoji sequence |
| `MentionSuggestion` | type | `{ id, displayName }` for `@`-mention autocomplete |
| `BlobId` / `TimelineAttachmentId` / `TimelineEntryId` | type | Branded identifiers |
| `*OriginValue` / `*NotEditableReasonValue` | type | Value unions of the matching const enums |

## Caveats

- **Graceful degradation is opaque on the entry list.** `getStream` lifts failed
  contributors from the `X-Timeline-Degraded-Sources` response header into
  `degradedSources`; the page itself is silently short by those rows. Always
  branch on `degradedSources.length > 0` rather than assuming a complete stream.
- **`sizeBytes` may be a string.** The backend serializes `int64` as a JSON
  number for values ≤ 2⁵³ and as a decimal string above that to preserve
  precision (`type: ["integer", "string"]`). The field is typed `number | string`
  — coerce before arithmetic.
- **`reactions` is undefined / `{}` / `null` for zero reactions.** The map only
  carries emojis with at least one reactor; all three forms mean "no reactions".
  A `ReactionMap` key may also differ from `ReactionAggregateResponse.displayEmoji`
  when the first reactor used a skin-tone variant — render `displayEmoji`.
- **Reaction emoji is an open Unicode contract.** The closed v1 catalog is gone
  (ADR-040 amendment); any well-formed sequence is accepted. Brand untrusted or
  user-typed input through `parseReactionEmoji` (runtime-validated) and reserve
  `toReactionEmoji` for values already known well-formed (e.g. emoji-mart
  `native`). Picker UX is a client concern.
- **External entries are not directly mutable.** Entries with
  `origin === 'External'` (and `SystemLog` native rows) reject edits and reflect
  upstream changes through a fresh projection. Anchor an external entry first
  (`anchorTimelineEntry`) to obtain a stable native id before reacting or
  replying.
- **Permission keys are a UX hint, not a boundary.** `TimelinePermissions`
  mirrors the .NET registry for gating controls; every endpoint re-checks
  authorization server-side.

## Out of scope

- **React hooks, provider, query keys, optimistic cache updates** — owned by
  [`@granit/react-timeline`](../react-timeline). This package is headless and
  framework-agnostic.
- **Rendering** — the styled stream, threaded entry rows, the `@`-mention
  composer, and the emoji-mart picker live in
  [`@granit/react-ui-timeline`](../react-ui-timeline).
- **i18n** — the `timeline` locale bundles ship with `@granit/react-timeline`;
  this layer returns raw wire data and stable machine-readable reason codes only.
- **Mention resolution** — `MentionSuggestion` is the autocomplete shape; the
  lookup source (`@granit/mentions`) is a separate facade.

## License

Apache-2.0
