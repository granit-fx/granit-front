# @granit/mentions

Framework-agnostic client for the Granit **`@`-mention picker** — a thin facade over
[`@granit/data-lookup`](../data-lookup) that binds the `mentions` lookup source
(`GET /lookups/mentions`) and the composite `"<type>:<id>"` value convention.

A mention has **no dedicated wire contract**: the backend (`Granit.Mentions`) exposes a
single facade lookup source built on `Granit.DataLookup` and fanned across every source
tagged mentionable (users, teams, …). This package mirrors that boundary on the front —
it is the framework-agnostic **core** layer holding the types, HTTP helpers and the
`type:id` parsing convention, with **no** React, DOM or Node-only dependency. There is no
`@granit/react-mentions` hooks layer and no `react-ui` admin feature kit: consumers
(`@granit/react-ai-chat` today, timeline tomorrow) call these functions directly and
project `MentionItem` onto their own option shape, so the convention lives in one place
instead of being re-derived per feature.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published to a
public registry for app consumption. Declare both peers:

- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant interceptors)
  passed into every call.
- `@granit/data-lookup` — the underlying lookup SDK this package facades; provides
  `DEFAULT_LOOKUP_BASE_PATH` and the `searchLookup` / `resolveLookup` primitives.

## Quick start

```ts
import { searchMentions, resolveMention, parseMentionValue } from '@granit/mentions';
import type { AxiosInstance } from '@granit/api-client';

declare const client: AxiosInstance;

// 1. Typeahead — multi-type by default; pass `type` to restrict to one source.
const items = await searchMentions(client, { search: 'ali', type: 'user' });
// items: readonly MentionItem[] — { type, id, label, extra }, label rendered verbatim.

// 2. Persist the composite value when the user picks an item.
const value = `${items[0]!.type}:${items[0]!.id}`; // e.g. "user:42"

// 3. Rehydrate a stored value (e.g. when re-opening a draft). null on HTTP 404.
const mention = await resolveMention(client, value);

// Pure helper — split a composite value without a round-trip.
const { type, id } = parseMentionValue(value); // { type: 'user', id: '42' }
```

`searchMentions` and `resolveMention` accept an optional third argument
(`{ signal }`) to wire an `AbortSignal` for request cancellation.

## Public API

| Symbol                 | Kind  | Purpose                                                         |
| ---------------------- | ----- | -------------------------------------------------------------- |
| `MentionItem`          | type  | Normalized picker item (`{ type, id, label, extra }`)          |
| `SearchMentionsParams` | type  | `searchMentions` query (`search`, optional `type`)             |
| `MentionClientOptions` | type  | Shared call options (`{ signal? }`)                            |
| `MENTIONS_SOURCE`      | const | Registry name of the facade source (`'mentions'`)              |
| `searchMentions`       | fn    | Typeahead over `GET /lookups/mentions` (`type`->`scope.type`)  |
| `resolveMention`       | fn    | Rehydrate a `"<type>:<id>"` value; `null` on unknown (404)     |
| `parseMentionValue`    | fn    | Split a composite value into `{ type, id }` (no round-trip)    |

## Out of scope / caveats

- **No mention-specific endpoint.** Every call routes through the shared
  `Granit.DataLookup` `mentions` source — there is no `mentions.json` OpenAPI contract to
  mirror and no per-mention DTO. Route and field shapes are owned by `@granit/data-lookup`.
- **`label` is rendered verbatim.** It arrives already-localized from the backend; this
  package does no i18n and performs no escaping. Treat it as **untrusted text** at the
  render site (React escapes by default; never feed it to a DOM script sink without
  Trusted Types — see `pnpm check:csp`).
- **`extra` is opaque.** `Readonly<Record<string, unknown>> | null`; it carries
  source-specific secondary attributes (e.g. `{ email }`). The `type` discriminator is
  taken from `extra.type` when present, else from the composite value prefix.
- **Type lives in the value, not a separate field.** Persisting a selection means storing
  the composite `"<type>:<id>"` string; `parseMentionValue` treats a value with no `:` as
  a bare id with an empty `type`.
- **No React layer.** Provider wiring, React Query caching and the rendered picker
  component belong to the consuming feature package, not here.

## License

Apache-2.0
