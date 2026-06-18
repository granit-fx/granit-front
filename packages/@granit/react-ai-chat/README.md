# @granit/react-ai-chat

React bindings for [`@granit/ai-chat`](../ai-chat) — the agentic "Ask your app"
chat. Provides the `AIChatProvider`, a streaming SSE hook, and conversation
CRUD hooks. Headless chat UI (thread, composer with `/` and `@` pickers,
attachment chips, suggested actions, clarifications) is added on top of these
hooks.

## Installation

```bash
pnpm add @granit/react-ai-chat
```

## Usage

Wrap the app once, providing the Axios client (or rely on a
`<GranitClientProvider>`):

```tsx
import { AIChatProvider } from '@granit/react-ai-chat';

<AIChatProvider config={{ client }}>{children}</AIChatProvider>;
```

### Hooks

- `useChatStream()` — streams a turn over SSE (`POST /conversations/messages`).
  Accumulates `delta` content, captures the conversation id, suggested actions,
  a clarification, and token usage. `send(request)` resets per-turn state and
  cancels any in-progress stream; `abort()` stops it.
- `useConversations()` — list (owner-private).
- `useConversation(id)` — conversation **metadata** (title, favorite, dates).
  No longer the source for the thread — use `useConversationMessages` for that.
- `useConversationMessages(id)` — reverse (keyset) infinite query over the
  thread (`GET /conversations/{id}/messages?cursor=&pageSize=`), built on the
  framework's generic `usePagedInfiniteQuery` (`@granit/react-query-engine`) +
  the shared `PagedResult` cursor contract — the same machinery `useLookup`
  rides. Loads the newest page first, then OLDER pages via `loadOlder()`. Returns
  `messages` flattened **oldest-first**, `hasMoreOlder`, `isLoadingOlder`.
- `useReverseInfiniteScroll({ scrollContainerRef, topSentinelRef, itemCount, … })`
  — loads older messages as the user scrolls up and keeps the viewport anchored
  on prepend. Pair it with `useStickToBottom` (share the same `scrollRef`) so new
  /streamed messages still stick to the bottom.
- `useChatWorkspaces()` — selectable default workspaces (`Auto` first).
- `useCreateConversation()` / `useRenameConversation()` / `useDeleteConversation()`
  — mutations that invalidate the affected queries.
- `conversationKeys` — the query-key factory (namespaced by the provider prefix).
  `messages` is nested under `detail`; on turn completion `useChatStream`
  optimistically appends the new turn to the newest message page (no refetch).

Wire the thread for paging by passing `topSentinelRef` / `hasMoreOlder` /
`isLoadingOlder` to `ConversationThread`; with none of these it behaves exactly
as before.

> ⚠️ `useChatStream().content` is **untrusted** model output. Render it as plain
> text, or sanitize it (and scheme-allowlist links) before rendering as
> HTML/markdown. Suggested actions are links the user clicks — **never**
> auto-invoke them.

## Testing

`@granit/react-ai-chat/testing` exports `createAIChatHandlers(baseUrl)` (stateful
MSW handlers, including the SSE stream and the paginated `GET /{id}/messages`)
plus `mockConversation`, `mockConversationSummaries`, `mockChatWorkspaces`, and
`mockLongConversationId` / `mockLongConversationMessages` (an 80-message thread
for exercising reverse pagination).
