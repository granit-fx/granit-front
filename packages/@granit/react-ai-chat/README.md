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
- `useConversations()` / `useConversation(id)` — list / read (owner-private).
- `useChatWorkspaces()` — selectable default workspaces (`Auto` first).
- `useCreateConversation()` / `useRenameConversation()` / `useDeleteConversation()`
  — mutations that invalidate the affected queries.
- `conversationKeys` — the query-key factory (namespaced by the provider prefix).

> ⚠️ `useChatStream().content` is **untrusted** model output. Render it as plain
> text, or sanitize it (and scheme-allowlist links) before rendering as
> HTML/markdown. Suggested actions are links the user clicks — **never**
> auto-invoke them.

## Testing

`@granit/react-ai-chat/testing` exports `createAIChatHandlers(baseUrl)` (stateful
MSW handlers, including the SSE stream) plus `mockConversation`,
`mockConversationSummaries`, and `mockChatWorkspaces`.
