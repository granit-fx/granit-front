# @granit/react-ai

React bindings for the **AI gateway** — the hooks + provider layer over
[`@granit/ai`](../ai), itself the TypeScript counterpart of the .NET
`Granit.AI` / `Granit.AI.Endpoints` module (wire contract:
`contracts/openapi/ai.json`).

This is the headless **React hooks + provider** layer: `AIProvider` resolves the
Axios client / base path / query-key prefix once, and the hooks call the core
HTTP functions through React Query — workspace CRUD, provider/model listing,
sync + streaming (SSE) chat completion, and embedding generation. It owns **no**
visual component. The framework-agnostic transport and contracts live in
[`@granit/ai`](../ai); the admin feature kit (workspace grid, create/edit forms,
usage grid, test panel) lives in [`@granit/react-ui-ai`](../react-ui-ai).
Agentic conversation CRUD and the message stream are a separate domain in
[`@granit/ai-chat`](../ai-chat) / [`@granit/react-ai-chat`](../react-ai-chat) and
are out of scope here.

A workspace pins a `provider` + `model` (plus system prompt, temperature, token
cap) behind a stable machine `key`; chat and embedding calls reference it by
that name, so model selection stays server-side configuration.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption. Declare the peers your usage actually touches:

- `@granit/ai` — core wire types + HTTP client functions wrapped by the hooks.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors).
- `@granit/react-api-client` — `AIProvider` resolves the client from a
  surrounding `<GranitClientProvider>` when `config.client` is omitted.
- `@granit/logger` — stream-failure logging.
- `@granit/types` — branded id / `ISODateString` helpers used by the contracts.
- `@tanstack/react-query` (`^5`) and `react` (`^19`).

Optional peers, pulled in only by the `./usage` and `./testing` subpaths:

- `@granit/query-engine` + `@granit/react-query-engine` — required only for
  `@granit/react-ai/usage` (the usage grid surface).
- `msw` (`^2.12`) — required only for `@granit/react-ai/testing`.

## Quick start

```tsx
import { AIProvider, useAIChatStream, useAIWorkspaces } from '@granit/react-ai';

function App({ client }: { client: AxiosInstance }) {
  // `client` and `basePath` default to the surrounding GranitClientProvider
  // and `/api/v1/ai` respectively; both are overridable here.
  return (
    <AIProvider config={{ client }}>
      <ChatView />
    </AIProvider>
  );
}

function ChatView() {
  const { data } = useAIWorkspaces();
  const { content, isStreaming, send, abort } = useAIChatStream();

  return (
    <div>
      <button onClick={() => send('default', { messages: [{ role: 'user', content: 'Hello' }] })}>
        {isStreaming ? 'Streaming…' : 'Send'}
      </button>
      {isStreaming && <button onClick={abort}>Stop</button>}
      {/* `content` is untrusted model output — render as plain text. */}
      <p>{content}</p>
      <small>{data?.workspaces.length ?? 0} workspaces</small>
    </div>
  );
}
```

The opt-in usage grid lives behind its own provider so the `@granit/query-engine`
peer stays optional:

```tsx
import { AIUsageProvider, useAIUsage } from '@granit/react-ai/usage';

function UsageView() {
  return (
    <AIUsageProvider>
      <UsageTable />
    </AIUsageProvider>
  );
}

function UsageTable() {
  const usage = useAIUsage(); // query-engine endpoint at /api/v1/ai/usage
  return <>{usage.query.data?.items.map((r) => r.workspaceName)}</>;
}
```

## Public API

Entry point `@granit/react-ai`:

| Symbol                 | Kind     | Purpose                                                           |
| ---------------------- | -------- | ----------------------------------------------------------------- |
| `AIProvider`           | provider | Resolve client / `basePath` / `queryKeyPrefix`, expose on context |
| `useAIConfig`          | hook     | Read the resolved config from the nearest `AIProvider`            |
| `AIConfig`             | type     | Provider input (`client?`, `basePath?`, `queryKeyPrefix?`)        |
| `AIProviderProps`      | type     | `{ config, children }` for `AIProvider`                           |
| `ResolvedAIConfig`     | type     | Config after defaults + client resolution                         |
| `aiKeys`               | const    | React Query key factory namespaced under `queryKeyPrefix`         |
| `useAIProviders`       | hook     | `GET /providers` - registered AI providers                        |
| `useAIProviderModels`  | hook     | `GET /providers/{name}/models`; disabled until a name is given    |
| `useAIWorkspaces`      | hook     | `GET /workspaces` - workspace list                                |
| `useAIWorkspace`       | hook     | `GET /workspaces/{key}` - single workspace                        |
| `useCreateAIWorkspace` | hook     | `POST /workspaces`; invalidates the list                          |
| `useUpdateAIWorkspace` | hook     | `PUT /workspaces/{name}`; invalidates list + item                 |
| `useDeleteAIWorkspace` | hook     | `DELETE /workspaces/{key}`; invalidates the list                  |
| `useAIChat`            | hook     | `POST /chat/{workspaceName}` - non-streaming completion mutation  |
| `useAIChatStream`      | hook     | `POST /chat/{workspaceName}/stream` - SSE; accumulates `content`  |
| `useAIEmbeddings`      | hook     | `POST /embeddings/{workspaceName}` - batch embedding mutation     |
| `Use*Return`           | type     | Return shape per mutation/stream hook (e.g. `UseAIChatReturn`)    |

Subpath `@granit/react-ai/usage` (needs the query-engine peers):

| Symbol                 | Kind     | Purpose                                                      |
| ---------------------- | -------- | ------------------------------------------------------------ |
| `AIUsageProvider`      | provider | Wire the query-engine group at `{basePath}/usage`            |
| `AIUsageProviderProps` | type     | `{ client?, basePath?, children }` for `AIUsageProvider`     |
| `useAIUsage`           | hook     | Query-engine endpoint over `AIUsageRecord` (page/sort/group) |
| `useAIUsageMeta`       | hook     | Column / group-by metadata for the usage surface             |

Subpath `@granit/react-ai/testing` (needs the `msw` peer):

| Symbol                     | Kind  | Purpose                                               |
| -------------------------- | ----- | ----------------------------------------------------- |
| `createAIHandlers`         | fn    | Stateful MSW handlers for the full AI surface         |
| `aiWorkspaceQueryMetadata` | const | Mock `/workspaces/meta` query-metadata payload        |
| `mockProviders`            | const | Fixture provider list (OpenAI / AzureOpenAI / Ollama) |
| `mockProviderModels`       | const | Fixture provider → model map                          |
| `mockWorkspaces`           | const | Fixture workspaces (mix of `System` + `Dynamic`)      |
| `mockUsageRecords`         | const | Fixture usage records                                 |

Wire types (`AIChatRequest`, `AIWorkspaceResponse`, `AIUsageRecord`, …) and the
permission constants come from [`@granit/ai`](../ai); re-import them from there,
not this package.

## Caveats

- **Model output is untrusted.** `useAIChat().data.content` and
  `useAIChatStream().content` are raw model output — steerable by prompt
  injection, poisoned RAG, or echoed tool results. Render as plain text, or
  sanitize (and scheme-allowlist links via `@granit/utils` `isSafeUrl`) before
  rendering as HTML/markdown. Never pass to `dangerouslySetInnerHTML`
  unsanitized (security audit VULN-303).
- **No client-side request clamp.** Request size is bounded server-side only;
  keep client `messages` reasonable to avoid wasted bandwidth (VULN-304).
- **`useAIChatStream` aborts on unmount** and resets `content` on every
  `send()`; only the latest stream's content is retained. Call `abort()` to
  cancel manually.
- **Workspace identity is the `key`.** Hooks take the machine `key`
  (`useAIWorkspace`, `useDeleteAIWorkspace`) or the equivalent `workspaceName`
  (chat / embeddings); `System` workspaces reject update/delete server-side
  (422).
- **`useAIProviderModels` self-disables** while `providerName` is `undefined`
  or empty, supporting a cascading provider → model select.
- **Usage querying is opt-in** under `@granit/react-ai/usage` so the
  `@granit/query-engine` peer is not forced on chat-only consumers.

## License

Apache-2.0
