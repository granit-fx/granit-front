// ---------------------------------------------------------------------------
// Agentic chat API functions.
// Mirrors Granit.AI.Chat.Endpoints — conversation CRUD plus the SSE message
// stream. Routes are relative to `basePath` (the `/conversations` prefix).
// ---------------------------------------------------------------------------

import { createLogger } from '@granit/logger';

import type {
  ChatStreamEvent,
  ChatWorkspacesResponse,
  ConversationId,
  ConversationResponse,
  ConversationSummaryResponse,
  CreateConversationRequest,
  MessageId,
  MessageResponse,
  RenameConversationRequest,
  ReportMessageRequest,
  SendMessageRequest,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';
import type { PagedResult } from '@granit/query-engine';

const logger = createLogger('ai-chat');

/**
 * List the current user's conversations, newest first, without their messages.
 *
 * `GET {basePath}`
 */
export async function listConversations(
  client: AxiosInstance,
  basePath: string
): Promise<readonly ConversationSummaryResponse[]> {
  const response = await client.get<readonly ConversationSummaryResponse[]>(basePath);
  return response.data;
}

/**
 * Get one of the current user's conversations and its messages.
 *
 * `GET {basePath}/{id}`
 */
export async function getConversation(
  client: AxiosInstance,
  basePath: string,
  id: ConversationId
): Promise<ConversationResponse> {
  const response = await client.get<ConversationResponse>(`${basePath}/${encodeURIComponent(id)}`);
  return response.data;
}

/**
 * Fetch one page of a conversation's messages, reusing the framework's generic
 * **keyset (cursor) pagination** — the same `PagedResult` + opaque `cursor`
 * contract the query-engine exposes (no bespoke shape). The server sorts newest
 * first (`-createdAt`), so:
 *
 * - No `cursor` → the newest `pageSize` messages.
 * - `cursor` → the `pageSize` messages immediately OLDER than that opaque cursor.
 *
 * Walk further back with {@link PagedResult.nextCursor} until it comes back
 * `null`. `pageSize` defaults to 30 server-side and is capped at 100. The cursor
 * is opaque — never parse it. `totalCount` is `null` in cursor mode. A
 * conversation outside the caller's own is reported as `404`.
 *
 * `GET {basePath}/{id}/messages?cursor={opaque}&pageSize={N}`
 */
export async function getConversationMessages(
  client: AxiosInstance,
  basePath: string,
  id: ConversationId,
  params: { cursor?: string; pageSize?: number } = {},
  signal?: AbortSignal
): Promise<PagedResult<MessageResponse>> {
  const query: string[] = [];
  if (params.pageSize != null) query.push(`pageSize=${encodeURIComponent(params.pageSize)}`);
  if (params.cursor != null) query.push(`cursor=${encodeURIComponent(params.cursor)}`);
  const suffix = query.length > 0 ? `?${query.join('&')}` : '';
  const url = `${basePath}/${encodeURIComponent(id)}/messages${suffix}`;
  const response = await client.get<PagedResult<MessageResponse>>(
    url,
    signal ? { signal } : undefined
  );
  return response.data;
}

/**
 * Create an empty conversation owned by the current user.
 *
 * `POST {basePath}`
 */
export async function createConversation(
  client: AxiosInstance,
  basePath: string,
  request: CreateConversationRequest
): Promise<ConversationResponse> {
  const response = await client.post<ConversationResponse>(basePath, request);
  return response.data;
}

/**
 * Rename one of the current user's conversations.
 *
 * `PUT {basePath}/{id}/title`
 */
export async function renameConversation(
  client: AxiosInstance,
  basePath: string,
  id: ConversationId,
  request: RenameConversationRequest
): Promise<void> {
  await client.put(`${basePath}/${encodeURIComponent(id)}/title`, request);
}

/**
 * Set the favorite flag on one of the current user's conversations to an
 * explicit state (idempotent, not a toggle). The server responds `204`; a
 * conversation outside the caller's own is reported as `404`.
 *
 * `PUT {basePath}/{id}/favorite`
 */
export async function setConversationFavorite(
  client: AxiosInstance,
  basePath: string,
  id: ConversationId,
  isFavorite: boolean
): Promise<void> {
  await client.put(`${basePath}/${encodeURIComponent(id)}/favorite`, { isFavorite });
}

/**
 * Delete one of the current user's conversations.
 *
 * `DELETE {basePath}/{id}`
 */
export async function deleteConversation(
  client: AxiosInstance,
  basePath: string,
  id: ConversationId
): Promise<void> {
  await client.delete(`${basePath}/${encodeURIComponent(id)}`);
}

/**
 * Report (flag) a message in one of the current user's conversations for review.
 *
 * Per ADR-071 only the `messageId` and the user-entered reason/category travel
 * over the wire — never the message content or its tool activity. The server
 * responds `202 Accepted` with no body; a message outside the caller's own
 * conversations is reported as `404`.
 *
 * `POST {basePath}/messages/{messageId}/report`
 */
export async function reportConversationMessage(
  client: AxiosInstance,
  basePath: string,
  messageId: MessageId,
  request: ReportMessageRequest
): Promise<void> {
  await client.post(`${basePath}/messages/${encodeURIComponent(messageId)}/report`, request);
}

/**
 * List the workspaces a user may set as their default chat workspace
 * (`Auto` first, then chat-capable workspaces).
 *
 * `GET {basePath}/workspaces`
 */
export async function listChatWorkspaces(
  client: AxiosInstance,
  basePath: string
): Promise<ChatWorkspacesResponse> {
  const response = await client.get<ChatWorkspacesResponse>(`${basePath}/workspaces`);
  return response.data;
}

/** Parse one raw SSE line into a {@link ChatStreamEvent}, or `null` to skip it. */
function parseEventLine(line: string): ChatStreamEvent | null {
  const trimmed = line.trimEnd();
  if (!trimmed.startsWith('data:')) return null;
  const data = trimmed.slice('data:'.length).trimStart();
  if (data === '') return null;
  try {
    return JSON.parse(data) as ChatStreamEvent;
  } catch (err) {
    // A malformed or partial frame — skip it rather than aborting the stream.
    // Debug (not warn): a truncated tail frame is expected; raw data omitted as
    // it is untrusted server content.
    logger.debug('Skipped unparseable chat SSE frame', { err });
    return null;
  }
}

/**
 * Send a message and stream the agent's answer over Server-Sent Events.
 *
 * Uses Axios `adapter: 'fetch'` with `responseType: 'stream'` so the request
 * still flows through the interceptor pipeline (CSRF, auth, tenant headers).
 * Yields each {@link ChatStreamEvent} frame as it arrives. The stream ends when
 * the connection closes — there is **no `[DONE]` sentinel**. Pass a `signal`
 * to abort on unmount or a stop button.
 *
 * `POST {basePath}/messages`
 *
 * @example
 * ```ts
 * const controller = new AbortController();
 * for await (const ev of streamConversationMessage(client, '/api/v1/conversations', req, controller.signal)) {
 *   if (ev.type === 'delta') append(ev.content);
 * }
 * ```
 */
export async function* streamConversationMessage(
  client: AxiosInstance,
  basePath: string,
  request: SendMessageRequest,
  signal?: AbortSignal
): AsyncGenerator<ChatStreamEvent, void, undefined> {
  const url = `${basePath}/messages`;

  const response = await client.post(url, request, {
    adapter: 'fetch',
    responseType: 'stream',
    headers: { Accept: 'text/event-stream' },
    // Disable the client's default timeout: an SSE stream is long-lived and the
    // agent may take far longer than 10s to produce its answer. Aborts come from
    // the caller's `signal` (unmount / stop button), not a request timeout.
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
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const event = parseEventLine(line);
        if (event) yield event;
      }
    }

    // Flush a final frame that arrived without a trailing newline.
    const tail = parseEventLine(buffer);
    if (tail) yield tail;
  } finally {
    reader.releaseLock();
  }
}
