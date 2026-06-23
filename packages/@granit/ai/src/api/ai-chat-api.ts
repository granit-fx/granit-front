// ---------------------------------------------------------------------------
// Chat completion API functions.
// Mirrors Granit.AI.Endpoints chat endpoints (sync + SSE stream).
// ---------------------------------------------------------------------------

import { logger } from '../logger';
import { AI_STREAM_DONE_MARKER } from '../types/index';

import type {
  AIChatCompletionEvent,
  AIChatRequest,
  AIChatResponse,
  AIChatStreamChunk,
  AIChatStreamUsage,
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

/** Result of parsing a single SSE data line. */
type ParsedLine =
  | { kind: 'chunk'; content: string }
  | { kind: 'usage'; usage: AIChatStreamUsage }
  | { kind: 'done' }
  | { kind: 'event'; eventType: string }
  | { kind: 'skip' };

/** Parses a single SSE line into a typed result. */
function parseSseLine(line: string, currentEventType: string | null): ParsedLine {
  if (line.startsWith('event: ')) {
    return { kind: 'event', eventType: line.slice(7).trim() };
  }

  if (!line.startsWith('data: ')) return { kind: 'skip' };

  const data = line.slice(6).trim();
  if (data === AI_STREAM_DONE_MARKER) return { kind: 'done' };

  try {
    if (currentEventType === 'usage') {
      const parsed = JSON.parse(data) as AIChatStreamUsage;
      return { kind: 'usage', usage: parsed };
    }
    const parsed = JSON.parse(data) as AIChatStreamChunk;
    return { kind: 'chunk', content: parsed.content };
  } catch (err) {
    // Partial/malformed frame mid-stream; skip it. Debug (not warn) because a
    // truncated tail frame is expected, and the raw data is untrusted server
    // content kept out of the log.
    logger.debug('Skipped unparseable AI chat SSE frame', { currentEventType, err });
    return { kind: 'skip' };
  }
}

/**
 * Opens an SSE stream for chat completion via Axios.
 *
 * Uses `adapter: 'fetch'` with `responseType: 'stream'` so the request goes
 * through the full Axios interceptor pipeline (CSRF, auth, tenant headers).
 * Yields {@link AIChatCompletionEvent} items as they arrive: content chunks and a
 * final usage summary. The stream ends when the server sends `data: [DONE]`
 * or closes the connection.
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
  let currentEventType: string | null = null;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop()!;

      for (const line of lines) {
        const result = parseSseLine(line, currentEventType);
        if (result.kind === 'event') {
          currentEventType = result.eventType;
        } else if (result.kind === 'done') {
          return;
        } else if (result.kind === 'chunk') {
          currentEventType = null;
          yield { type: 'chunk', content: result.content };
        } else if (result.kind === 'usage') {
          currentEventType = null;
          yield { type: 'usage', usage: result.usage };
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
