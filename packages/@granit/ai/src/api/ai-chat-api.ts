// ---------------------------------------------------------------------------
// Chat completion API functions.
// Mirrors Granit.AI.Endpoints chat endpoints (sync + SSE stream).
// ---------------------------------------------------------------------------

import { AI_STREAM_DONE_MARKER } from '../constants.js';

import type { AIChatRequest, AIChatResponse, AIChatStreamChunk } from '../types/index.js';
import type { AxiosInstance } from 'axios';

/**
 * Send a chat completion request and return the full response.
 *
 * `POST /ai/chat/{workspaceName}`
 */
export async function chatComplete(
  client: AxiosInstance,
  basePath: string,
  workspaceName: string,
  request: AIChatRequest
): Promise<AIChatResponse> {
  const response = await client.post<AIChatResponse>(
    `${basePath}/ai/chat/${encodeURIComponent(workspaceName)}`,
    request
  );
  return response.data;
}

/** Result of parsing a single SSE data line. */
type ParsedLine = { kind: 'chunk'; content: string } | { kind: 'done' } | { kind: 'skip' };

/** Parses a single SSE line into a typed result. */
function parseSseLine(line: string): ParsedLine {
  if (!line.startsWith('data: ')) return { kind: 'skip' };

  const data = line.slice(6).trim();
  if (data === AI_STREAM_DONE_MARKER) return { kind: 'done' };

  try {
    const parsed = JSON.parse(data) as AIChatStreamChunk;
    return { kind: 'chunk', content: parsed.content };
  } catch {
    return { kind: 'skip' };
  }
}

/**
 * Opens an SSE stream for chat completion via Axios.
 *
 * Uses `adapter: 'fetch'` with `responseType: 'stream'` so the request goes
 * through the full Axios interceptor pipeline (CSRF, auth, tenant headers).
 * Yields content string chunks as they arrive. The stream ends when the
 * server sends `data: [DONE]` or closes the connection.
 *
 * `POST /ai/chat/{workspaceName}/stream`
 *
 * @example
 * ```ts
 * const controller = new AbortController();
 *
 * for await (const chunk of chatStream(client, '/api', 'default', request, controller.signal)) {
 *   process.stdout.write(chunk);
 * }
 * ```
 */
export async function* chatStream(
  client: AxiosInstance,
  basePath: string,
  workspaceName: string,
  request: AIChatRequest,
  signal?: AbortSignal,
): AsyncGenerator<string, void, undefined> {
  const url = `${basePath}/ai/chat/${encodeURIComponent(workspaceName)}/stream`;

  const response = await client.post(url, request, {
    adapter: 'fetch',
    responseType: 'stream',
    headers: { Accept: 'text/event-stream' },
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
        if (result.kind === 'done') return;
        if (result.kind === 'chunk') yield result.content;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
