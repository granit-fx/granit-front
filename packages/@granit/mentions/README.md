# @granit/mentions

Framework-agnostic client for the Granit **`@` mention picker**.

A mention has **no dedicated wire contract**: the backend (`Granit.Mentions`) exposes a
single facade lookup source — `GET /lookups/mentions` — built on `Granit.DataLookup` and
fanned across every source tagged mentionable. This package is the matching thin front
facade over [`@granit/data-lookup`](../data-lookup): it binds the `mentions` source and the
composite `"<type>:<id>"` value convention so every consumer (AI chat, timeline, …) shares
one home instead of re-deriving it.

## Contents

- `MentionItem` — normalized picker item (`{ type, id, label, extra }`).
- `searchMentions(client, { search, type? })` — multi-type typeahead over
  `GET /lookups/mentions` (`type` ⇒ `scope.type`).
- `resolveMention(client, value)` — rehydrate a composite value via
  `GET /lookups/mentions/resolve`.
- `parseMentionValue("user:42")` ⇒ `{ type: "user", id: "42" }`, and `MENTIONS_SOURCE`.

See the backend documentation at `/dotnet/business/mentions/` for the full contract.
