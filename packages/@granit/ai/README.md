# @granit/ai

Framework-agnostic **AI gateway** SDK — the TypeScript counterpart of the .NET
`Granit.AI` / `Granit.AI.Endpoints` module. It exposes the wire types, HTTP
client functions, permission constants and field limits needed to drive AI
workspace management, chat completion (sync + SSE streaming), embedding
generation and usage tracking from any client — React, React Native, a CLI,
tests. It holds **no** React, DOM or Node-only dependency.

Layer split: this **core** package owns transport and contracts. The React
hooks + `AIProvider` live in [`@granit/react-ai`](../react-ai); the admin
feature kit (workspace grid, create/edit forms, usage grid, test panel) lives
in [`@granit/react-ui-ai`](../react-ui-ai). Agentic conversation CRUD and the
chat message stream are a separate domain in [`@granit/ai-chat`](../ai-chat)
(which depends on this package), surfaced by
[`@granit/react-ai-chat`](../react-ai-chat).

A workspace pins a `provider` + `model` (plus prompt, temperature, token cap)
behind a stable machine `key`; callers reference it by name when completing
chats or generating embeddings, so model selection stays server-side config.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. Declare
these peers:

- `@granit/api-client` — the centralized Axios instance (CSRF, auth, tenant
  interceptors); every function here takes it as its first argument.
- `@granit/types` — branded id types (`EntityId`, `TenantId`, `UserId`,
  `ISODateString`).
- `@granit/logger` — used internally to debug-log skipped SSE frames.

## Quick start

```ts
import {
  chatComplete,
  chatStream,
  generateEmbeddings,
  listAIWorkspaces,
} from '@granit/ai';
import type { AIChatRequest } from '@granit/ai';

// `basePath` is the AI module mount; functions append /workspaces, /chat/{key},
// /embeddings/{key}, /providers under it.
const basePath = '/api/v1/ai';

const { workspaces } = await listAIWorkspaces(client, basePath);

const request: AIChatRequest = {
  messages: [{ role: 'user', content: 'Summarize the quarterly report.' }],
};

// Synchronous completion.
const reply = await chatComplete(client, basePath, 'default', request);
// ⚠️ reply.content is untrusted model output — sanitize before HTML rendering.

// Or stream incrementally. Cancellation comes from the caller's AbortSignal,
// never a request timeout (the stream disables the client timeout).
const controller = new AbortController();
for await (const event of chatStream(client, basePath, 'default', request, controller.signal)) {
  if (event.type === 'chunk') process.stdout.write(event.content);
  if (event.type === 'usage') logUsage(event.usage);
}

// Embeddings: a batch of inputs in, one vector per input out.
const { embeddings } = await generateEmbeddings(client, basePath, 'default', {
  inputs: ['first chunk', 'second chunk'],
});
```

## Public API

| Symbol                     | Kind  | Purpose                                                       |
| -------------------------- | ----- | ------------------------------------------------------------- |
| `AIWorkspaceResponse`      | type  | Workspace config (key, provider, model, prompt, capabilities) |
| `AIWorkspaceListResponse`  | type  | `{ workspaces, totalCount }` list wrapper                     |
| `AIWorkspaceCreateRequest` | type  | `POST /workspaces` body (slug `key` + provider/model)         |
| `AIWorkspaceUpdateRequest` | type  | `PUT /workspaces/{key}` body (includes `activated`)           |
| `AIWorkspaceKind`          | type  | `'System' \| 'Dynamic'`                                       |
| `AIChatRequest`            | type  | `{ messages }` completion body                                |
| `AIChatMessageRequest`     | type  | One `{ role, content }` message                               |
| `AIChatMessageRole`        | type  | `'user' \| 'assistant' \| 'system'`                           |
| `AIChatResponse`           | type  | Sync completion result (`content` is untrusted)               |
| `AIChatUsageResponse`      | type  | Token counts + estimated cost for a completion                |
| `AIChatStreamChunk`        | type  | Raw SSE content frame                                          |
| `AIChatStreamUsage`        | type  | Token usage emitted before `[DONE]`                           |
| `AIChatCompletionEvent`    | type  | Union yielded by `chatStream` (`chunk` \| `usage`)            |
| `AIEmbeddingRequest`       | type  | `{ inputs }` embedding body                                   |
| `AIEmbeddingResponse`      | type  | Batch result (`embeddings`, `usage`)                          |
| `AIEmbeddingDataResponse`  | type  | One `{ index, vector }` embedding                             |
| `AIEmbeddingUsageResponse` | type  | Embedding token usage                                         |
| `AIProviderResponse`       | type  | Provider summary + chat/embeddings support flags              |
| `AIProviderModelResponse`  | type  | Model metadata (id, capabilities, context window)             |
| `AIModelCapabilities`      | type  | Per-model feature flags + capability `extensions`             |
| `AIUsageRecord`            | type  | Persisted usage row (queried via `@granit/react-ai/usage`)    |
| `AIUsageRecordId`          | type  | Branded `EntityId<'AIUsageRecord'>`                           |
| `ConversationId`           | type  | Branded `EntityId<'Conversation'>` (cycle-free local copy)    |
| `listAIWorkspaces`         | fn    | `GET {basePath}/workspaces`                                   |
| `getAIWorkspace`           | fn    | `GET {basePath}/workspaces/{key}`                             |
| `createAIWorkspace`        | fn    | `POST {basePath}/workspaces`                                  |
| `updateAIWorkspace`        | fn    | `PUT {basePath}/workspaces/{key}`                             |
| `deleteAIWorkspace`        | fn    | `DELETE {basePath}/workspaces/{key}`                          |
| `listAIProviders`          | fn    | `GET {basePath}/providers`                                    |
| `listAIProviderModels`     | fn    | `GET {basePath}/providers/{providerName}/models`              |
| `chatComplete`             | fn    | `POST {basePath}/chat/{workspaceName}`                        |
| `chatStream`               | fn    | `POST {basePath}/chat/{workspaceName}/stream` (async gen)     |
| `generateEmbeddings`       | fn    | `POST {basePath}/embeddings/{workspaceName}`                  |
| `AIPermissions`            | const | Permission strings (`AI.Workspaces.Manage`, `AI.Chat.Execute`)|
| `AI_WORKSPACE_KINDS`       | const | `{ SYSTEM, DYNAMIC }` kind values                             |
| `AI_WORKSPACE_LIMITS`      | const | Server-enforced `key`/`displayName` length + slug pattern     |
| `AI_CAPABILITY_EXTENSIONS` | const | Well-known capability extension identifiers                   |
| `AI_STREAM_DONE_MARKER`    | const | SSE terminator string (`[DONE]`)                              |

The merged usage rows are not fetched here — `AIUsageRecord` is a query-engine
shape consumed through `@granit/react-ai/usage`.

## Out of scope / caveats

- **Untrusted model output.** `AIChatResponse.content` and every streamed
  `chunk` are generated by the upstream model and are **not** safe HTML.
  Sanitize and scheme-allowlist any links before rendering through a DOM HTML
  sink (see security audit VULN-303). The SSE parser deliberately debug-logs —
  never warns — and never echoes raw frame bytes, keeping untrusted content out
  of the logs.
- **Streaming transport.** `chatStream` goes through the Axios fetch adapter
  (`adapter: 'fetch'`, `responseType: 'stream'`) so it inherits the full
  interceptor pipeline (CSRF, auth, tenant headers). It disables the request
  timeout — a slow agent start-up (high time-to-first-byte) would otherwise
  abort a healthy stream; pass an `AbortSignal` to cancel.
- **Conversations live elsewhere.** This package has no conversation CRUD or
  persisted message history — that is `@granit/ai-chat`. `ConversationId` is
  redefined locally (not imported) to avoid a dependency cycle, but its brand
  matches `EntityId<'Conversation'>`.
- **Client permission checks are a UX hint, not enforcement.** `AIPermissions`
  helps apps hide controls; the .NET `Granit.AI.Endpoints` layer re-checks
  every call. A 403 is the authoritative answer.
- **No React.** Provider wiring, query keys, hooks and mutations are in
  [`@granit/react-ai`](../react-ai); the admin surface is in
  [`@granit/react-ui-ai`](../react-ui-ai).

## License

Apache-2.0
