# Refactor: `chatStream` — replace native `fetch` with Axios

## Problem

`useAIChatStream` uses native `fetch` for SSE streaming instead of the Axios client.
This bypasses all Axios interceptors (CSRF token injection, auth, tenant headers),
causing **403 Forbidden** errors in BFF mode because `X-CSRF-Token` is missing.

The comment "Axios does not support reading a ReadableStream incrementally" is outdated.
Since Axios 1.6+, `adapter: 'fetch'` with `responseType: 'stream'` returns a browser
`ReadableStream` — full interceptor pipeline applies.

## Goal

Make `chatStream` go through the Axios client so it inherits all interceptors
(CSRF, auth, tenant, base URL). Remove the parallel `fetch`-based plumbing
(`streamBaseUrl`, `tokenGetter`, `tenantId`) from `AIConfig`.

## Files to change

### 1. `packages/@granit/ai/src/api/ai-chat-api.ts`

**Replace** the `chatStream` function signature. Instead of accepting `ChatStreamOptions`
(url + headers + request + signal), it should accept:

```ts
export async function* chatStream(
  client: AxiosInstance,
  basePath: string,
  workspaceName: string,
  request: AIChatRequest,
  signal?: AbortSignal,
): AsyncGenerator<string, void, undefined>
```

Implementation:

- Use `client.post(url, request, { adapter: 'fetch', responseType: 'stream', headers: { Accept: 'text/event-stream' }, signal })`.
- `response.data` is a `ReadableStream<Uint8Array>` — reuse the existing SSE parsing logic
  (`parseSseLine`, reader loop, buffer splitting) unchanged.
- The URL is `${basePath}/ai/chat/${encodeURIComponent(workspaceName)}/stream` (relative — axios resolves against `baseURL`).

**Remove**: `ChatStreamOptions` interface, `buildChatStreamUrl` function (no longer needed — axios handles base URL resolution).

### 2. `packages/@granit/ai/src/index.ts`

Remove exports: `buildChatStreamUrl`, `ChatStreamOptions`.
Keep exports: `chatStream`, `chatComplete`.

### 3. `packages/@granit/react-ai/src/providers/ai-provider.tsx`

Remove from `AIConfig`:

- `streamBaseUrl` — axios uses `client.defaults.baseURL`
- `tokenGetter` — axios interceptors handle auth
- `tenantId` — axios interceptors handle tenant header

### 4. `packages/@granit/react-ai/src/hooks/use-ai-chat-stream.ts`

Simplify `send()`:

```ts
import { chatStream } from '@granit/ai';
// ...
const send = useCallback(
  (workspaceName: string, request: AIChatRequest) => {
    abort();
    setContent('');
    setError(null);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        let accumulated = '';
        for await (const chunk of chatStream(
          config.client,
          config.basePath ?? '',
          workspaceName,
          request,
          controller.signal,
        )) {
          accumulated += chunk;
          setContent(accumulated);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    })();
  },
  [abort, config],
);
```

Remove imports: `buildChatStreamUrl`.

### 5. `packages/@granit/react-ai/src/__tests__/ai-chat-stream.test.tsx`

Rewrite tests to mock the Axios client instead of `globalThis.fetch`.

- Use `createMockClient()` from `@granit/testing`.
- Mock `client.post` to return `{ data: ReadableStream }` (the SSE stream).
- Remove `vi.stubGlobal('fetch', ...)` calls.
- Remove `streamBaseUrl`, `tokenGetter`, `tenantId` from test configs.
- The SSE content helper (`createSSEStream`) stays unchanged.

Example pattern for mocking:

```ts
const stream = createSSEStream(['data: {"content":"Hello"}\n\n', 'data: [DONE]\n\n']);
const client = createMockClient();
vi.spyOn(client, 'post').mockResolvedValue({ data: stream });
```

### 6. `packages/@granit/react-ai/src/testing/handlers.ts`

The MSW handler for chat (`http.post(.../chat/:workspaceName)`) currently returns JSON.
Add a **streaming handler** for the `/stream` variant that returns SSE:

```ts
http.post(`${baseUrl}/chat/:workspaceName/stream`, async ({ params, request }) => {
  // ... build SSE response from mock data
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: {"content":"Mock response..."}\n\n`));
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
  return new HttpResponse(stream, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
});
```

## Verification

```bash
cd packages/@granit/ai && pnpm test
cd packages/@granit/react-ai && pnpm test
pnpm build
```

## Context: how CSRF works in BFF mode

The showcase app (`granit-showcase-admin-react`) wires a `CsrfManager` into the Axios
client via a request interceptor (`@granit/api-client` `createApiClient` with
`mode: 'bff'` and `csrfTokenGetter`). This interceptor adds `X-CSRF-Token` to all
mutation requests (POST/PUT/PATCH/DELETE). By routing streaming through the same Axios
client, the CSRF header is automatically included — no additional config needed.
