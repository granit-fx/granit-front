# @granit/ai-chat

Framework-agnostic **agentic chat** SDK — the TypeScript counterpart of the .NET
`Granit.AI.Chat.Endpoints` module (route prefix `/conversations`). It exposes the
DTOs, conversation CRUD, the Server-Sent Events message stream, and the permission
constants needed to drive a chat from any client — React, React Native, a CLI,
tests. It holds **no** React, DOM or Node-only dependency.

This is the core, headless layer. The React bindings (provider, SSE hook,
conversation CRUD hooks, headless thread/composer/pickers) live in
[`@granit/react-ai-chat`](../react-ai-chat); the admin feature kit (chat workspace,
conversation sidebar, model picker, per-user preferences page) lives in
[`@granit/react-ui-ai-chat`](../react-ui-ai-chat). The contract is mirrored from
`contracts/openapi/ai-chat.json`.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. Declare these
peers:

- `@granit/api-client` — the centralized Axios client (CSRF, auth, tenant
  interceptors); the SSE stream rides the same pipeline via `adapter: 'fetch'`.
- `@granit/query-engine` — the generic keyset `PagedResult` contract reused for
  paging a conversation's messages.
- `@granit/types` — branded `EntityId` / `UserId` / `ISODateString` primitives.
- `@granit/logger` — `createLogger`; unparseable SSE frames are skipped and logged
  at debug.

## Quick start

```ts
import {
  createConversation,
  streamConversationMessage,
  getConversationMessages,
  type SendMessageRequest,
} from '@granit/ai-chat';
import type { AxiosInstance } from '@granit/api-client';

const basePath = '/api/v1/conversations';

// 1. CRUD over JSON — owner-private, never build cross-user views.
async function start(client: AxiosInstance) {
  const convo = await createConversation(client, basePath, { title: 'Untitled' });

  // 2. Send a turn and stream the agent's answer over SSE. The stream ends when
  //    the connection closes — there is NO `[DONE]` sentinel. Abort on unmount or
  //    a stop button via the signal.
  const controller = new AbortController();
  const request: SendMessageRequest = {
    message: 'Summarize the latest activity.',
    conversationId: convo.id,
  };

  for await (const ev of streamConversationMessage(client, basePath, request, controller.signal)) {
    switch (ev.type) {
      case 'delta':
        // ⚠️ `ev.content` is untrusted model output — render as plain text or
        // sanitize before any HTML/markdown sink.
        appendText(ev.content ?? '');
        break;
      case 'tool_call':
        startToolChip(ev.toolCallId!, ev.toolName!);
        break;
      case 'tool_result':
        resolveToolChip(ev.toolCallId!, ev.succeeded === true);
        break;
      case 'persisted':
        // Authoritative rows (real ids + server `createdAt`) — append verbatim.
        commitRows(ev.messages ?? []);
        break;
    }
  }

  // 3. Page older history with keyset pagination (newest first, opaque cursor).
  const page = await getConversationMessages(client, basePath, convo.id, { pageSize: 30 });
  walkBack(page.items, page.nextCursor);
}
```

## Public API

| Symbol                                                             | Kind  | Purpose                                                           |
| ------------------------------------------------------------------ | ----- | ----------------------------------------------------------------- |
| `ConversationId` · `MessageId` · `PromptId`                        | type  | Branded UUID identifiers (`PromptId` owned by the prompts module) |
| `ConversationSummaryResponse`                                      | type  | List item — conversation metadata, no messages                    |
| `ConversationResponse`                                             | type  | Single conversation metadata (title, favorite, owner, timestamps) |
| `MessageResponse`                                                  | type  | One persisted `user`/`assistant` message row                      |
| `ChatMessageRole`                                                  | type  | `'user' \| 'assistant' \| 'system'` (no `tool` on this contract)  |
| `CreateConversationRequest` · `RenameConversationRequest`          | type  | `POST /` and `PUT /{id}/title` bodies                             |
| `SetConversationFavoriteRequest`                                   | type  | `PUT /{id}/favorite` body (explicit state, not a toggle)          |
| `ReportMessageRequest` · `MessageReportCategory`                   | type  | `POST /messages/{id}/report` body + its closed category set       |
| `SendMessageRequest`                                               | type  | `POST /messages` turn — text, mentions, attachments, prompt refs  |
| `MentionRequest` · `AttachmentRequest`                             | type  | Embedded composer inputs (grounded mention ref / opaque blob ref) |
| `ChatStreamEvent` · `ChatStreamEventType`                          | type  | One SSE frame and its `type` discriminator union                  |
| `ChatStreamErrorCode`                                              | type  | Closed machine codes carried by the terminal `error` frame        |
| `SuggestedActionResponse`                                          | type  | Streamed deep-link suggestion — never auto-invoked                |
| `ClarificationResponse` · `ClarificationOptionResponse`            | type  | A clarifying question that blocks the turn + its options          |
| `ChatWorkspacesResponse`                                           | type  | Selectable default workspaces (`Auto` first)                      |
| `listConversations` · `getConversation`                            | fn    | `GET /` and `GET /{id}` read models                               |
| `getConversationMessages`                                          | fn    | `GET /{id}/messages` — keyset-paged thread (opaque cursor)        |
| `createConversation` · `renameConversation` · `deleteConversation` | fn    | Conversation lifecycle CRUD                                       |
| `setConversationFavorite`                                          | fn    | `PUT /{id}/favorite` — idempotent flag set                        |
| `reportConversationMessage`                                        | fn    | `POST /messages/{id}/report` — flag a message for review          |
| `listChatWorkspaces`                                               | fn    | `GET /workspaces` — workspaces selectable as a default            |
| `streamConversationMessage`                                        | fn    | `POST /messages` as an async generator of `ChatStreamEvent`       |
| `AUTO_WORKSPACE`                                                   | const | Reserved name letting the backend pick the workspace per turn     |
| `CHAT_STREAM_EVENT_TYPES` · `CHAT_STREAM_ERROR_CODES`              | const | Frame-type and error-code value maps                              |
| `MESSAGE_REPORT_CATEGORIES`                                        | const | The closed report-category value map                              |
| `SEND_MESSAGE_LIMITS`                                              | const | Server-enforced per-turn caps (message length, mentions, refs)    |
| `CONVERSATION_TITLE_MAX_LENGTH` · `REPORT_REASON_MAX_LENGTH`       | const | Length caps for titles / report reasons                           |
| `AIChatPermissions`                                                | const | `Conversations.{Read,Send,Manage,Delete,Report}` permission names |

Every function takes the `AxiosInstance` and a `basePath` (the `/conversations`
collection root), so routing is decided by the caller, not hard-coded here.

## Out of scope / caveats

- **`ChatStreamEvent.content` is untrusted model output** — steerable by prompt
  injection, poisoned RAG, or echoed tool results. Render it as plain text, or
  sanitize it (and scheme-allowlist any links) before any HTML/markdown DOM sink.
  Never pass it to an HTML sink unsanitized.
- **No `[DONE]` sentinel.** The SSE stream ends when the connection closes. The
  terminal `error` frame appears only for failures *after* the stream committed;
  pre-stream failures come back as a normal HTTP problem. A client-cancelled turn
  emits no `error` frame.
- **Tool frames carry no payload.** `tool_call` / `tool_result` carry only
  `toolName` (a `snake_case` model-facing name to localize), the `toolCallId`
  correlation key, and `succeeded` — never the arguments or the raw result. Order
  between concurrent tools is not guaranteed; key chips by `toolCallId`.
- **Report payload minimality (ADR-071).** A message report sends only the
  `messageId` and the user-entered reason/category — never the message content or
  its tool activity.
- **Owner-private conversations.** v1 lists and serves only the caller's own
  conversations; anything outside is reported as `404`. Permission checks here are a
  UX hint — the .NET backend is the only authoritative enforcement point.
- **Suggested actions are never auto-invoked** — `SuggestedActionResponse.deepLink`
  is rendered for the user to choose.
- **React bindings are not here.** Provider, SSE hook, conversation hooks and
  headless UI live in [`@granit/react-ai-chat`](../react-ai-chat); the admin feature
  kit in [`@granit/react-ui-ai-chat`](../react-ui-ai-chat).

## License

Apache-2.0
