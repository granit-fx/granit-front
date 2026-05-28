import { buildApiUrl } from '@granit/api-client';

import type { ResourceRoomResponse } from '../types/index.js';
import type { AxiosInstance } from '@granit/api-client';

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

const KIND_RE = /^[a-z][a-z0-9_.-]{0,63}$/;

function validateKind(kind: string): void {
  if (!KIND_RE.test(kind)) {
    throw new TypeError(
      `Invalid resource presence kind "${kind}". Must match /^[a-z][a-z0-9_.-]{0,63}$/`
    );
  }
}

function validateId(id: string): void {
  if (id.length > 256) {
    throw new TypeError(`Resource presence id must be ≤ 256 characters`);
  }
}

function validateMetadata(metadata: string | null | undefined): void {
  if (!metadata) return;
  const byteLength = new TextEncoder().encode(metadata).length;
  if (byteLength > 512) {
    throw new TypeError(`metadata must be ≤ 512 bytes UTF-8 (got ${byteLength})`);
  }
}

function roomUrl(basePath: string, kind: string, id: string, ...segments: string[]): string {
  return buildApiUrl(
    basePath,
    'presence',
    'rooms',
    encodeURIComponent(kind),
    encodeURIComponent(id),
    ...segments
  );
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/**
 * Joins (or refreshes) a resource-scoped presence room for the current user.
 *
 * `POST {basePath}/presence/rooms/{kind}/{id}/heartbeat`
 *
 * Requires `Presence.Rooms.Join`. Returns the room's current participant list.
 * Validates `kind`, `id`, and `metadata` before sending the request.
 */
export async function joinResourceRoom(
  client: AxiosInstance,
  basePath: string,
  kind: string,
  id: string,
  body: { metadata?: string | null },
  signal?: AbortSignal
): Promise<ResourceRoomResponse> {
  validateKind(kind);
  validateId(id);
  validateMetadata(body.metadata);
  const { data } = await client.post<ResourceRoomResponse>(
    roomUrl(basePath, kind, id, 'heartbeat'),
    body,
    { signal }
  );
  return data;
}

/**
 * Returns the current participant list of a resource-scoped room without
 * joining it.
 *
 * `GET {basePath}/presence/rooms/{kind}/{id}`
 *
 * Requires `Presence.Rooms.Read`. May return 404 when the visibility policy
 * blocks the response or the room has been dissolved.
 */
export async function getResourceRoom(
  client: AxiosInstance,
  basePath: string,
  kind: string,
  id: string,
  signal?: AbortSignal
): Promise<ResourceRoomResponse> {
  validateKind(kind);
  validateId(id);
  const { data } = await client.get<ResourceRoomResponse>(roomUrl(basePath, kind, id), { signal });
  return data;
}

/**
 * Removes the current user from a resource-scoped presence room.
 *
 * `DELETE {basePath}/presence/rooms/{kind}/{id}`
 *
 * Requires `Presence.Rooms.Join`. The server is idempotent — calling this when
 * not a participant is a no-op (204).
 */
export async function leaveResourceRoom(
  client: AxiosInstance,
  basePath: string,
  kind: string,
  id: string,
  signal?: AbortSignal
): Promise<void> {
  validateKind(kind);
  validateId(id);
  await client.delete(roomUrl(basePath, kind, id), { signal });
}
