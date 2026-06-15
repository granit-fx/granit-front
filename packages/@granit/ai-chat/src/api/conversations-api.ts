// ---------------------------------------------------------------------------
// Agentic chat API functions.
// Mirrors Granit.AI.Chat.Endpoints — conversation CRUD plus the SSE message
// stream. Routes are relative to `basePath` (the `/conversations` prefix).
// ---------------------------------------------------------------------------

import type {
  ChatStreamEvent,
  ChatWorkspacesResponse,
  ConversationId,
  ConversationResponse,
  ConversationSummaryResponse,
  CreateConversationRequest,
  RenameConversationRequest,
  SendMessageRequest,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

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
  } catch {
    // A malformed or partial frame — skip it rather than aborting the stream.
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
