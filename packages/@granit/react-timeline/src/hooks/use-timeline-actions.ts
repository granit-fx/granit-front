import { createLogger } from '@granit/logger';
import { createEntry, deleteEntry } from '@granit/timeline';
import { useCallback, useState } from 'react';

import { useTimelineConfig } from '../providers/timeline-provider';

import type { CreateTimelineEntryRequest, TimelineEntry } from '@granit/timeline';

const logger = createLogger('timeline:actions');

export interface UseTimelineActionsOptions {
  entityType: string;
  entityId: string;
  onEntryCreated?: (entry: TimelineEntry) => void;
  onEntryDeleted?: (entryId: string) => void;
}

export interface UseTimelineActionsReturn {
  postEntry: (request: CreateTimelineEntryRequest) => Promise<TimelineEntry>;
  removeEntry: (entryId: string) => Promise<void>;
  posting: boolean;
  deleting: boolean;
  error: Error | null;
}

export function useTimelineActions({
  entityType,
  entityId,
  onEntryCreated,
  onEntryDeleted,
}: UseTimelineActionsOptions): UseTimelineActionsReturn {
  const { client, basePath } = useTimelineConfig();

  const [posting, setPosting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const postEntry = useCallback(
    async (request: CreateTimelineEntryRequest): Promise<TimelineEntry> => {
      setPosting(true);
      setError(null);

      try {
        const entry = await createEntry(client, basePath, entityType, entityId, request);
        onEntryCreated?.(entry);
        return entry;
      } catch (err) {
        const wrapped = err instanceof Error ? err : new Error(String(err));
        logger.error('Failed to post timeline entry', wrapped);
        setError(wrapped);
        throw wrapped;
      } finally {
        setPosting(false);
      }
    },
    [client, basePath, entityType, entityId, onEntryCreated]
  );

  const removeEntry = useCallback(
    async (entryId: string): Promise<void> => {
      setDeleting(true);
      setError(null);

      try {
        await deleteEntry(client, basePath, entityType, entityId, entryId);
        onEntryDeleted?.(entryId);
      } catch (err) {
        const wrapped = err instanceof Error ? err : new Error(String(err));
        logger.error('Failed to delete timeline entry', wrapped);
        setError(wrapped);
        throw wrapped;
      } finally {
        setDeleting(false);
      }
    },
    [client, basePath, entityType, entityId, onEntryDeleted]
  );

  return { postEntry, removeEntry, posting, deleting, error };
}
