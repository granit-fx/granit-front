import { anchorTimelineEntry, updateTimelineEntryBody } from '@granit/timeline';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';

import { useTimelineConfig } from '../providers/timeline-provider';

import type { TimelineEntryId } from '@granit/timeline';

/**
 * Arguments accepted by {@link useAnchorEntry}. The
 * `(entityType, entityId)` pair identifies the surrounding stream;
 * `(sourceKey, sourceId)` identifies the external entry to anchor.
 */
export interface AnchorEntryVariables {
  readonly entityType: string;
  readonly entityId: string;
  readonly sourceKey: string;
  readonly sourceId: string;
}

/**
 * Mutation that materialises (or recovers) the native shadow row for
 * an external timeline source entry.
 *
 * Idempotent server-side: the backend derives a deterministic v5 GUID
 * from `(tenantId, entityType, entityId, sourceKey, sourceId)`, so
 * concurrent calls all converge on the same `entryId`. Callers chain
 * this before any reaction / reply operation that needs a stable
 * native id.
 *
 * Wire: `POST {basePath}/{entityType}/{entityId}/anchor`. See
 * granit-fx/granit-dotnet — `AnchorExternalAsync` endpoint.
 */
export function useAnchorEntry(): UseMutationResult<TimelineEntryId, Error, AnchorEntryVariables> {
  const { client, basePath } = useTimelineConfig();

  return useMutation<TimelineEntryId, Error, AnchorEntryVariables>({
    mutationFn: ({ entityType, entityId, sourceKey, sourceId }) =>
      anchorTimelineEntry(client, basePath, entityType, entityId, { sourceKey, sourceId }),
  });
}

/** Arguments accepted by {@link useUpdateEntryBody}. */
export interface UpdateEntryBodyVariables {
  readonly entityType: string;
  readonly entityId: string;
  readonly entryId: TimelineEntryId;
  readonly body: string;
}

/**
 * Mutation that replaces the Markdown body of a Comment or
 * InternalNote authored by the current user, provided the configured
 * edit window has not elapsed. The four backend gates (origin, type,
 * authorship, window) surface as RFC 7807 `403` with `type:
 * "timeline-entry-not-editable"` and a machine-readable `reason` in
 * the response extensions when rejected — apps should inspect the
 * axios error to localise the message.
 *
 * Wire: `PATCH {basePath}/{entityType}/{entityId}/entries/{entryId}`.
 */
export function useUpdateEntryBody(): UseMutationResult<void, Error, UpdateEntryBodyVariables> {
  const { client, basePath } = useTimelineConfig();

  return useMutation<void, Error, UpdateEntryBodyVariables>({
    mutationFn: ({ entityType, entityId, entryId, body }) =>
      updateTimelineEntryBody(client, basePath, entityType, entityId, entryId, { body }),
  });
}
