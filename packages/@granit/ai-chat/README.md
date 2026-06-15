# @granit/ai-chat

Framework-agnostic types and API functions for the agentic AI chat. Mirrors the
`Granit.AI.Chat.Endpoints` .NET contract (prefix `/conversations`).

This is the core, headless layer: DTOs, conversation CRUD, and the
Server-Sent Events message stream. React bindings (hooks, composer, pickers)
live in `@granit/react-ai-chat`.

## Installation

```bash
pnpm add @granit/ai-chat
```

## API

### Types

- `ConversationSummaryResponse`, `ConversationResponse`, `MessageResponse` —
  conversation read models (owner-private; v1 lists only the caller's own).
- `CreateConversationRequest`, `RenameConversationRequest` — CRUD bodies.
- `SendMessageRequest`, `MentionRequest`, `AttachmentRequest` — the composer
  payload (`/` prompt refs, `@` mentions, attachments).
- `ChatStreamEvent`, `SuggestedActionResponse`, `ClarificationResponse`,
  `ClarificationOptionResponse` — the SSE frame and its embedded payloads.
- `ChatWorkspacesResponse` — selectable default workspaces (`Auto` first).
- `ConversationId`, `MessageId`, `PromptId` — branded identifiers.

### Constants

- `AUTO_WORKSPACE`, `CHAT_STREAM_EVENT_TYPES`, `SEND_MESSAGE_LIMITS`,
  `CONVERSATION_TITLE_MAX_LENGTH`.

### Functions

- `listConversations`, `getConversation`, `createConversation`,
  `renameConversation`, `deleteConversation`, `listChatWorkspaces` — JSON CRUD
  over the Axios client.
- `streamConversationMessage` — `POST /conversations/messages` as an async
  generator of `ChatStreamEvent` frames over SSE (Axios `adapter: 'fetch'`).
  The stream ends when the connection closes — there is **no `[DONE]`
  sentinel**. Pass an `AbortSignal` to cancel.

> ⚠️ `ChatStreamEvent.content` is **untrusted** model output. Render it as plain
> text, or sanitize it (and scheme-allowlist links) before rendering as
> HTML/markdown. Never pass it to a DOM HTML sink unsanitized.

### Permissions

`AIChatPermissions.Conversations.{Read,Send,Manage,Delete}` — the server
enforces them; the client only gates affordances.
