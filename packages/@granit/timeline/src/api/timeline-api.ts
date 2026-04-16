import { buildApiUrl } from '@granit/api-client';

import type {
  CreateTimelineEntryRequest,
  TimelineQueryParams,
  TimelineEntry,
  TimelineEntryPage,
} from '../types/index.js';
import type { AxiosInstance } from 'axios';

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

export async function getStream(
  client: AxiosInstance,
  basePath: string,
  entityType: string,
  entityId: string,
  params?: TimelineQueryParams
): Promise<TimelineEntryPage> {
  const { data } = await client.get<TimelineEntryPage>(
    buildEntityUrl(basePath, entityType, entityId),
    {
      params,
    }
  );
  return data;
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
