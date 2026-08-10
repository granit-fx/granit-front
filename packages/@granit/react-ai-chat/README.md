# @granit/react-ai-chat

React bindings for the agentic **"Ask your app"** chat — the React hooks +
providers + headless UI layer over the framework-agnostic
[`@granit/ai-chat`](../ai-chat) core (which mirrors the .NET `Granit.AI.Chat`
module; wire contract in `contracts/openapi/ai-chat.json`, route prefix
`/api/v1/conversations` from `MapGranitConversations`).

This package owns the **React** layer: the `AIChatProvider`, an SSE streaming
hook, conversation/message React Query hooks, and a headless chat UI kit (thread,
`contenteditable` composer with `/` prompt and `@` mention pickers, attachment
chips, suggested actions, clarifications, tool-activity chips). The
domain/HTTP/types live in [`@granit/ai-chat`](../ai-chat); the batteries-included
admin feature kit (sidebar, settings page, branded model picker) lives in
[`@granit/react-ui-ai-chat`](../react-ui-ai-chat). App-specific adapters are
injected, not bundled — e.g. blob-backed uploads come from
[`@granit/react-ai-chat-blob-storage`](../react-ai-chat-blob-storage), and the
`@`-mention picker rides [`@granit/mentions`](../mentions) (`GET /lookups/mentions`).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption. Declare the peers a consumer must supply:

- `@granit/ai-chat` — the core types + API functions this layer drives.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant).
- `@granit/react-api-client` — the optional `<GranitClientProvider>` fallback for
  the provider's client.
- `@granit/react-query-engine` + `@granit/query-engine` — the generic
  `usePagedInfiniteQuery` + `PagedResult` cursor contract behind message paging.
- `@granit/mentions` — the unified `@`-mention lookup (optional `@granit/data-lookup`).
- `@granit/types`, `@granit/utils`, `@granit/logger` — branded ids, `cn`, logging.
- `@tanstack/react-query` ^5, `react` ^19, `lucide-react` ^1 (icons).
- `msw` ^2 — only for the `./testing` MSW handlers (optional).

`react-markdown` + `remark-gfm` are bundled dependencies (assistant Markdown
rendering), not peers.

## Quick start

Wrap the app once with the `AIChatProvider` (or rely on an ambient
`<GranitClientProvider>`), then compose the stream hook with the headless UI:

```tsx
import {
  AIChatProvider,
  ChatComposer,
  ConversationThread,
  useChatStream,
} from '@granit/react-ai-chat';
import type { AxiosInstance } from '@granit/api-client';

function ChatPanel() {
  const { content, isStreaming, toolCalls, isThinking, suggestedActions, send, abort } =
    useChatStream();

  return (
    <>
      <ConversationThread
        messages={[]} // from useConversationMessages(conversationId).messages
        streamingContent={content}
        isStreaming={isStreaming}
        toolCalls={toolCalls}
        isThinking={isThinking}
      />
      <ChatComposer
        onSubmit={send} // builds a SendMessageRequest (message + prompts/mentions/attachments)
        isStreaming={isStreaming}
        onStop={abort}
      />
    </>
  );
}

export function App({ client }: { client: AxiosInstance }) {
  return (
    <AIChatProvider config={{ client }}>
      <ChatPanel />
    </AIChatProvider>
  );
}
```

`useChatStream().send(request)` resets per-turn state and aborts any in-flight
stream; on completion the new turn is appended to the newest message page (no
refetch) and the conversation list is invalidated. For a paged thread, wire
`useConversationMessages(id)` to `ConversationThread`'s `topSentinelRef` /
`hasMoreOlder` / `isLoadingOlder` and drive scroll with
`useReverseInfiniteScroll` plus `useStickToBottom` (share one `scrollRef`), or
drop in `ConversationScrollArea` for the batteries-included scroller.

## Public API

### Provider & config

| Symbol                    | Kind     | Purpose                                                        |
| ------------------------- | -------- | -------------------------------------------------------------- |
| `AIChatProvider`          | provider | Supplies the Axios client, `basePath`, query-key prefix        |
| `useAIChatConfig`         | hook     | Resolved config; throws outside a provider                     |
| `useOptionalAIChatConfig` | hook     | Resolved config or `null` (standalone components/Storybook)    |
| `AIChatConfig`            | type     | Provider input (`client?`, `basePath?`, `showMessageMetrics?`) |
| `ResolvedAIChatConfig`    | type     | Config after defaults are applied                              |
| `AIChatProviderProps`     | type     | `{ config, children }`                                         |
| `conversationKeys`        | const    | Query-key factory (namespaced by the provider prefix)          |

### Hooks — conversations & messages

| Symbol                       | Kind | Purpose                                                         |
| ---------------------------- | ---- | --------------------------------------------------------------- |
| `useConversations`           | hook | List the owner's conversations (sidebar)                        |
| `useConversation`            | hook | A single conversation's metadata (title, favorite, dates)       |
| `useConversationMessages`    | hook | Reverse keyset infinite query over the thread (oldest-first)    |
| `useChatWorkspaces`          | hook | Selectable default workspaces (`Auto` first)                    |
| `useCreateConversation`      | hook | Mutation: create an empty conversation (`Conversations.Manage`) |
| `useRenameConversation`      | hook | Mutation: rename, invalidating the list/detail                  |
| `useDeleteConversation`      | hook | Mutation: delete, invalidating the list                         |
| `useSetConversationFavorite` | hook | Mutation: toggle the favorite flag                              |
| `useReportMessage`           | hook | Mutation: flag a message (`Conversations.Report`)               |

### Hooks — streaming, mentions, scrolling

| Symbol                     | Kind | Purpose                                                         |
| -------------------------- | ---- | --------------------------------------------------------------- |
| `useChatStream`            | hook | Stream a turn over SSE; accumulates content, tools, usage, etc. |
| `useDefaultMentionSearch`  | hook | Provider-backed `@`-mention search (`GET /lookups/mentions`)    |
| `useDefaultMentionResolve` | hook | Rehydrate a `"<type>:<id>"` mention value (`…/resolve`)         |
| `useStickToBottom`         | hook | Pin a scroller to the latest message while streaming            |
| `useReverseInfiniteScroll` | hook | Load older messages on scroll-up, anchoring the viewport        |

### Components

| Symbol                   | Kind      | Purpose                                                         |
| ------------------------ | --------- | --------------------------------------------------------------- |
| `ConversationThread`     | component | Renders messages + the live streaming bubble (ARIA live log)    |
| `ConversationScrollArea` | component | Batteries-included scroller (stick-to-bottom + scroll button)   |
| `ScrollToBottomButton`   | component | Controlled "scroll to latest" affordance                        |
| `ChatMessage`            | component | One bubble; assistant rows render via `ChatMarkdown`            |
| `ChatMarkdown`           | component | Assistant Markdown → escaped React tree (no `rehype-raw`)       |
| `MessageMetrics`         | component | Per-turn timing chip (opt-in via `showMessageMetrics`)          |
| `SystemMessage`          | component | Inline error/info notice (`alert` / `status`)                   |
| `ChatComposer`           | component | `contenteditable` input with `/` `@` pickers, attachments, Send |
| `WorkspaceSelector`      | component | Brand-agnostic workspace/model picker                           |
| `ComposerSuggestions`    | component | Controlled `/` `@` suggestion listbox                           |
| `SuggestedActions`       | component | Streamed deep-link actions as buttons (never auto-invoked)      |
| `ClarificationPrompt`    | component | Clarifying question + options that resume the turn              |
| `ToolActivity`           | component | Live tool-call chips + derived "thinking" line                  |
| `AttachmentChips`        | component | Staged attachments with upload status                           |
| `detectTrigger`          | fn        | Detect a `/` or `@` token ending at the caret                   |

### Types

| Symbol | Kind | Purpose | | | |
| --------------------------------------------------------- | ---- | ----------------------------------------------------------- | | | |
| `UseChatStreamReturn` | type | `useChatStream` surface (content, tools, usage, metrics, …) | | | |
| `ChatErrorKind` | type | `rate-limit \                                               | server \ | network \ | unknown` |
| `ChatStreamUsage`, `ChatTurnMetrics` | type | Token usage + client-side timing for a turn | | | |
| `ToolCallActivity`, `ToolCallStatus` | type | One in-flight tool invocation and its lifecycle | | | |
| `Use*Return` / `*Variables` | type | Mutation return shapes + variables (create/rename/…) | | | |
| `UseConversationMessages*` | type | Options/result/page-param for the message query | | | |
| `MentionOption`, `PromptOption`, `WorkspaceOption` | type | Composer picker option shapes | | | |
| `SearchMentions`, `ResolveMention`, `UploadAttachment` | type | Host-injected composer adapters | | | |
| `StagedMention`, `ComposerAttachment`, `AttachmentStatus` | type | Composer working state | | | |
| `*Props` | type | Public prop types for every exported component | | | |
| `ActiveTrigger` | type | A live `/` `@` autocomplete token | | | |

### i18n & report contract

| Symbol                                          | Kind  | Purpose                                                |
| ----------------------------------------------- | ----- | ------------------------------------------------------ |
| `aiChatTranslationsEn` / `aiChatTranslationsFr` | const | Bundled label packs for the `aiChat` namespace         |
| `defaultChatLabels`                             | const | English fallback used when no `labels` prop is given   |
| `ChatTranslations`                              | type  | The label bundle shape                                 |
| `MESSAGE_REPORT_CATEGORIES`                     | const | Report categories (re-exported from `@granit/ai-chat`) |
| `MessageReportCategory`, `ReportMessageRequest` | type  | Report contract (re-exported from `@granit/ai-chat`)   |

## Testing

`@granit/react-ai-chat/testing` exports stateful MSW handlers and fixtures
(requires the optional `msw` peer):

- `createAIChatHandlers(baseUrl)` — full chat handlers, including the SSE stream
  and the paginated `GET /{id}/messages`.
- `createMentionLookupHandlers(baseUrl)` — `GET /lookups/mentions[/resolve]`.
- `mockConversation`, `mockConversationSummaries`, `mockConversationMessages`,
  `mockChatWorkspaces`, `mockMentionLookupItems`.
- `mockLongConversationId` / `mockLongConversationMessages` — an 80-message thread
  for exercising reverse pagination.

Import these fixtures rather than hand-rolling DTOs inline.

## Security & caveats

> ⚠️ **Assistant output is untrusted.** `useChatStream().content`,
> `useConversationMessages().messages[].content`, and every model-streamed field
> (suggested actions, clarifications) are steerable by prompt injection, poisoned
> RAG, or echoed tool results. Render them as plain text, or sanitize (and
> scheme-allowlist links) before any HTML sink. **Never** pass them to
> `dangerouslySetInnerHTML` unsanitized.

- **`ChatMarkdown` is not an HTML sink.** It renders via `react-markdown` +
  `remark-gfm` **without** `rehype-raw`, so raw HTML in the source is escaped to
  literal text, never parsed into live DOM. Links open out-of-document with
  `rel="noopener noreferrer nofollow"`. Keep `rehype-raw` out.
- **Never auto-invoke suggested actions.** They are deep links the user clicks;
  `SuggestedActions` emits `onSelect` rather than navigating, so deep-link routing
  stays an app concern.
- **Tool activity carries only the tool name** — never its arguments or result
  (the wire omits both). Map `toolName` to a localized label; do not surface raw
  tool payloads.
- **Metrics are transient and opt-in.** `ChatTurnMetrics` is client-measured, held
  only for the most recent turn, reset on each `send()`, and never persisted. The
  chip renders only when the provider's `showMessageMetrics` flag is on (a
  dev/debug aid).
- **Synthesized rows are not authoritative.** When a backend omits the `persisted`
  frame, `useChatStream` synthesizes client-side ids/timestamps for the just-sent
  turn; such a message is not reportable until the next full load. With the
  `persisted` frame, the backend's real ids/`createdAt` are used instead.

## Out of scope

- **Conversation domain, HTTP, and types** — owned by [`@granit/ai-chat`](../ai-chat).
- **Admin chat workspace** (sidebar with pin/rename/delete, per-message
  copy/regenerate/report actions, the branded model picker, the preferences page)
  — owned by [`@granit/react-ui-ai-chat`](../react-ui-ai-chat).
- **Attachment storage** — `ChatComposer` takes an injected `UploadAttachment`
  adapter; a blob-backed implementation lives in
  [`@granit/react-ai-chat-blob-storage`](../react-ai-chat-blob-storage).
- **Mention lookup data** — provided by [`@granit/mentions`](../mentions); this
  package only binds it to the provider's client.

## License

Apache-2.0
