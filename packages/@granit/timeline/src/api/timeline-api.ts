import { buildApiUrl } from '@granit/api-client';

import type {
  CreateTimelineEntryRequest,
  TimelineQueryParams,
  TimelineEntry,
  TimelineEntryId,
  TimelineEntryPage,
  TimelineStreamPage,
} from '../types/index.js';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Response header surfaced by the stream endpoint when one or more
 * registered `ITimelineSource` contributors failed (timeout or thrown)
 * under the `DegradeGracefully` policy. Comma-separated source keys.
 */
const DEGRADED_SOURCES_HEADER = 'x-timeline-degraded-sources';

function buildEntityUrl(
  basePath: string,
  entityType: string,
  entityId: string,
  ...segments: string[]
): string {
  return buildApiUrl(
    basePath,
    encodeURIComponent(entityType),
    encodeURIComponent(entityId),
    ...segments
  );
}

/**
 * Fetches one page of the federated timeline stream.
 *
 * Returns the merged page **plus** the list of contributors that
 * degraded for this call (lifted from the `X-Timeline-Degraded-Sources`
 * response header). Callers should surface a "partial data" indicator
 * when `degradedSources.length > 0`.
 */
export async function getStream(
  client: AxiosInstance,
  basePath: string,
  entityType: string,
  entityId: string,
  params?: TimelineQueryParams
): Promise<TimelineStreamPage> {
  const response = await client.get<TimelineEntryPage>(
    buildEntityUrl(basePath, entityType, entityId),
    { params }
  );
  const rawHeader = response.headers?.[DEGRADED_SOURCES_HEADER];
  const headerValue = Array.isArray(rawHeader) ? rawHeader.join(',') : rawHeader;
  const degradedSources =
    typeof headerValue === 'string' && headerValue.length > 0
      ? headerValue
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
      : [];
  return { page: response.data, degradedSources };
}

export async function createEntry(
  client: AxiosInstance,
  basePath: string,
  entityType: string,
  entityId: string,
  request: CreateTimelineEntryRequest
): Promise<TimelineEntry> {
  const { data } = await client.post<TimelineEntry>(
    buildEntityUrl(basePath, entityType, entityId, 'entries'),
    request
  );
  return data;
}

export async function deleteEntry(
  client: AxiosInstance,
  basePath: string,
  entityType: string,
  entityId: string,
  entryId: string
): Promise<void> {
  await client.delete(buildEntityUrl(basePath, entityType, entityId, 'entries', entryId));
}

/**
 * Materialises (or returns the existing) shadow row for an external
 * source entry so subsequent reactions and replies can target a stable
 * native id. Idempotent: same `(entityType, entityId, sourceKey, sourceId)`
 * always resolves to the same deterministic v5 GUID backend-side.
 *
 * `POST {basePath}/{entityType}/{entityId}/anchor`
 */
export async function anchorTimelineEntry(
  client: AxiosInstance,
  basePath: string,
  entityType: string,
  entityId: string,
  request: { readonly sourceKey: string; readonly sourceId: string }
): Promise<TimelineEntryId> {
  const { data } = await client.post<{ entryId: TimelineEntryId }>(
    buildEntityUrl(basePath, entityType, entityId, 'anchor'),
    request
  );
  return data.entryId;
}

/**
 * Replaces the Markdown body of a Comment or InternalNote authored by
 * the current user, provided the configured edit window has not
 * elapsed. The four backend gates (origin, type, authorship, window)
 * are enforced server-side and surface as `403 timeline-entry-not-editable`
 * with `reason` in the RFC 7807 extensions when rejected.
 *
 * `PATCH {basePath}/{entityType}/{entityId}/entries/{entryId}`
 */
export async function updateTimelineEntryBody(
  client: AxiosInstance,
  basePath: string,
  entityType: string,
  entityId: string,
  entryId: string,
  request: { readonly body: string }
): Promise<void> {
  await client.patch(
    buildEntityUrl(basePath, entityType, entityId, 'entries', entryId),
    request
  );
}

export async function followEntity(
  client: AxiosInstance,
  basePath: string,
  entityType: string,
  entityId: string
): Promise<void> {
  await client.post(buildEntityUrl(basePath, entityType, entityId, 'follow'));
}

export async function unfollowEntity(
  client: AxiosInstance,
  basePath: string,
  entityType: string,
  entityId: string
): Promise<void> {
  await client.delete(buildEntityUrl(basePath, entityType, entityId, 'follow'));
}

export async function getFollowers(
  client: AxiosInstance,
  basePath: string,
  entityType: string,
  entityId: string
): Promise<string[]> {
  const { data } = await client.get<string[]>(
    buildEntityUrl(basePath, entityType, entityId, 'followers')
  );
  return data;
}
