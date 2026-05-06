import { type ReactNode } from 'react';

import { useActivity } from '../hooks/use-activities.js';

import type { ActivityActionLabels } from './activity-list.js';
import type { ActivityResponse } from '@granit/activities';

export interface ActivityDetailPanelProps {
  /** Activity id to load. The panel renders nothing until the id is non-empty. */
  readonly activityId: string;
  /**
   * Action callbacks. When `undefined`, the matching button is not rendered
   * — apps use this to gate by permission.
   */
  readonly onComplete?: (activity: ActivityResponse) => void;
  readonly onCancel?: (activity: ActivityResponse) => void;
  readonly onReassign?: (activity: ActivityResponse) => void;
  readonly onReschedule?: (activity: ActivityResponse) => void;
  readonly actionLabels?: ActivityActionLabels;
  readonly className?: string;
}

const DEFAULT_LABELS: Required<ActivityActionLabels> = {
  complete: 'Complete',
  cancel: 'Cancel',
  reassign: 'Reassign',
  reschedule: 'Reschedule',
};

/**
 * Headless activity detail panel. Loads an activity via {@link useActivity}
 * and renders its full state plus action buttons. Apps wrap this in their
 * own drawer / sheet / dialog primitive — this component owns the data,
 * not the visual chrome.
 *
 * Action callbacks fire with the loaded {@link ActivityResponse}. Omit a
 * callback to hide the corresponding button (permission gating).
 */
export function ActivityDetailPanel({
  activityId,
  onComplete,
  onCancel,
  onReassign,
  onReschedule,
  actionLabels,
  className,
}: ActivityDetailPanelProps): ReactNode {
  const labels = { ...DEFAULT_LABELS, ...actionLabels };
  const query = useActivity(activityId);

  if (!activityId) {
    return null;
  }

  if (query.isLoading) {
    return (
      <div
        data-granit-activity-detail=""
        data-granit-activity-detail-loading=""
        className={className}
      >
        Loading…
      </div>
    );
  }

  if (query.isError) {
    return (
      <div
        data-granit-activity-detail=""
        data-granit-activity-detail-error=""
        role="alert"
        className={className}
      >
        {query.error?.message ?? 'Failed to load activity.'}
      </div>
    );
  }

  const a = query.data;
  if (!a) {
    return null;
  }

  const isOpen = a.status === 'Open';

  return (
    <div
      data-granit-activity-detail=""
      data-activity-id={a.id}
      data-activity-status={a.status}
      className={className}
    >
      <dl>
        <dt>Type</dt>
        <dd>{a.type}</dd>
        <dt>Entity</dt>
        <dd>
          {a.entityType} · {a.entityId}
        </dd>
        <dt>Assignee</dt>
        <dd>{a.assignedToUserId}</dd>
        <dt>Due</dt>
        <dd>{a.dueAt}</dd>
        <dt>Status</dt>
        <dd>{a.status}</dd>
        {a.description ? (
          <>
            <dt>Description</dt>
            <dd>{a.description}</dd>
          </>
        ) : null}
        {a.completedAt ? (
          <>
            <dt>Completed</dt>
            <dd>
              {a.completedAt}
              {a.completedByUserId ? ` · ${a.completedByUserId}` : ''}
            </dd>
          </>
        ) : null}
        <dt>Created</dt>
        <dd>
          {a.createdAt}
          {a.createdByUserId ? ` · ${a.createdByUserId}` : ''}
        </dd>
      </dl>
      <div data-granit-activity-detail-actions="">
        {onComplete && isOpen ? (
          <button type="button" onClick={() => onComplete(a)}>
            {labels.complete}
          </button>
        ) : null}
        {onCancel && isOpen ? (
          <button type="button" onClick={() => onCancel(a)}>
            {labels.cancel}
          </button>
        ) : null}
        {onReassign ? (
          <button type="button" onClick={() => onReassign(a)}>
            {labels.reassign}
          </button>
        ) : null}
        {onReschedule ? (
          <button type="button" onClick={() => onReschedule(a)}>
            {labels.reschedule}
          </button>
        ) : null}
      </div>
    </div>
  );
}
