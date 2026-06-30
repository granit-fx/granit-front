// ---------------------------------------------------------------------------
// Chat completion API functions.
// Mirrors Granit.AI.Endpoints chat endpoints (sync + SSE stream).
// ---------------------------------------------------------------------------

import { logger } from '../logger';

import type {
  AIChatCompletionEvent,
  AIChatRequest,
  AIChatResponse,
  AIChatStreamEvent,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Send a chat completion request and return the full response.
 *
 * `POST {basePath}/chat/{workspaceName}`
 */
export async function chatComplete(
  client: AxiosInstance,
  basePath: string,
  workspaceName: string,
  request: AIChatRequest
): Promise<AIChatResponse> {
  const response = await client.post<AIChatResponse>(
    `${basePath}/chat/${encodeURIComponent(workspaceName)}`,
    request
  );
  return response.data;
}

/** Result of parsing a single SSE `data:` line into a backend frame. */
type ParsedFrame = { kind: 'event'; event: AIChatStreamEvent } | { kind: 'skip' };

/**
 * Parses a single SSE line into an {@link AIChatStreamEvent}. The backend emits
 * one JSON frame per `data:` line discriminated by `type` (`delta`/`usage`/`error`)
 * with no `event:` name and no `[DONE]` sentinel — end-of-stream is the connection
 * closing. Non-`data:` lines (comments, blank separators) are skipped.
 */
function parseSseLine(line: string): ParsedFrame {
  if (!line.startsWith('data:')) return { kind: 'skip' };

  // SSE strips a single optional space after the field name.
  const data = line.slice(5).replace(/^ /, '').trim();
  if (!data) return { kind: 'skip' };

  try {
    const parsed = JSON.parse(data) as AIChatStreamEvent;
    if (typeof parsed.type !== 'string') return { kind: 'skip' };
    return { kind: 'event', event: parsed };
  } catch (err) {
    // Partial/malformed frame mid-stream; skip it. Debug (not warn) because a
    // truncated tail frame is expected, and the raw data is untrusted server
    // content kept out of the log.
    logger.debug('Skipped unparseable AI chat SSE frame', { err });
    return { kind: 'skip' };
  }
}

/**
 * Opens an SSE stream for chat completion via Axios.
 *
 * Uses `adapter: 'fetch'` with `responseType: 'stream'` so the request goes
 * through the full Axios interceptor pipeline (CSRF, auth, tenant headers).
 * Yields {@link AIChatCompletionEvent} items as they arrive: content chunks and a
 * final usage summary. The stream ends when the server closes the connection
 * (there is no `[DONE]` sentinel). An `error` frame — a provider failure after
 * streaming started — is surfaced by throwing, so the caller's `try/catch` (or
 * the `error` state in `useAIChatStream`) handles it after any partial content.
 *
 * `POST {basePath}/chat/{workspaceName}/stream`
 *
 * @example
 * ```ts
 * const controller = new AbortController();
 *
 * for await (const event of chatStream(client, '/api/v1/ai', 'default', request, controller.signal)) {
 *   if (event.type === 'chunk') process.stdout.write(event.content);
 *   if (event.type === 'usage') console.log('Tokens:', event.usage);
 * }
 * ```
 */
export async function* chatStream(
  client: AxiosInstance,
  basePath: string,
  workspaceName: string,
  request: AIChatRequest,
  signal?: AbortSignal
): AsyncGenerator<AIChatCompletionEvent, void, undefined> {
  const url = `${basePath}/chat/${encodeURIComponent(workspaceName)}/stream`;

  const response = await client.post(url, request, {
    adapter: 'fetch',
    responseType: 'stream',
    headers: { Accept: 'text/event-stream' },
    // Disable the client's default timeout: with the fetch adapter the timeout
    // applies until response headers arrive, so a slow agent start-up (high
    // time-to-first-byte) would abort an otherwise healthy stream. Cancellation
    // comes from the caller's `signal`, never a request timeout.
    timeout: 0,
    signal,
  });

  const body = response.data as ReadableStream<Uint8Array> | null;
  if (!body) return;

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop()!;

      for (const line of lines) {
        const result = parseSseLine(line);
        if (result.kind !== 'event') continue;

        const frame = result.event;
        if (frame.type === 'delta') {
          if (frame.content != null) yield { type: 'chunk', content: frame.content };
        } else if (frame.type === 'usage') {
          yield {
            type: 'usage',
            usage: { inputTokens: frame.inputTokens ?? 0, outputTokens: frame.outputTokens ?? 0 },
          };
        } else if (frame.type === 'error') {
          throw new Error(frame.error ?? 'AI chat stream failed');
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
