import { useState, type ReactNode } from 'react';

import { useActivities } from '../hooks/use-activities';

import type { ActivityListFilter, ActivityResponse } from '@granit/activities';

export interface ActivityActionLabels {
  readonly complete?: string;
  readonly cancel?: string;
  readonly reassign?: string;
  readonly reschedule?: string;
}

export interface ActivityListProps {
  /** Controlled filter (status / assignee / type / entity). Pagination is internal. */
  readonly filter?: Omit<ActivityListFilter, 'page' | 'pageSize'>;
  /** Default page size (default: 20). */
  readonly pageSize?: number;
  /** Row click handler — apps typically open their own drawer/sheet from here. */
  readonly onSelect?: (activity: ActivityResponse) => void;
  /**
   * Action callbacks. When `undefined`, the matching row button is not rendered
   * — apps use this to gate by permission.
   */
  readonly onComplete?: (activity: ActivityResponse) => void;
  readonly onCancel?: (activity: ActivityResponse) => void;
  readonly onReassign?: (activity: ActivityResponse) => void;
  readonly onReschedule?: (activity: ActivityResponse) => void;
  /** Override the English defaults for action button labels (i18n in F9). */
  readonly actionLabels?: ActivityActionLabels;
  readonly className?: string;
}

const DEFAULT_LABELS: Required<ActivityActionLabels> = {
  complete: 'Complete',
  cancel: 'Cancel',
  reassign: 'Reassign',
  reschedule: 'Reschedule',
};

interface ActivityActionsProps {
  readonly activity: ActivityResponse;
  readonly labels: Required<ActivityActionLabels>;
  readonly onComplete?: (activity: ActivityResponse) => void;
  readonly onCancel?: (activity: ActivityResponse) => void;
  readonly onReassign?: (activity: ActivityResponse) => void;
  readonly onReschedule?: (activity: ActivityResponse) => void;
}

function ActivityActions({
  activity,
  labels,
  onComplete,
  onCancel,
  onReassign,
  onReschedule,
}: ActivityActionsProps): ReactNode {
  return (
    <td data-granit-activity-actions="">
      {onComplete && activity.status === 'Open' ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onComplete(activity);
          }}
        >
          {labels.complete}
        </button>
      ) : null}
      {onCancel && activity.status === 'Open' ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCancel(activity);
          }}
        >
          {labels.cancel}
        </button>
      ) : null}
      {onReassign ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onReassign(activity);
          }}
        >
          {labels.reassign}
        </button>
      ) : null}
      {onReschedule ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onReschedule(activity);
          }}
        >
          {labels.reschedule}
        </button>
      ) : null}
    </td>
  );
}

/**
 * Headless activity list. Consumes {@link useActivities} for paged data and
 * exposes per-row action callbacks. Renders a minimal `<table>` with
 * `data-granit-activity-list*` markers — apps style via `className` + the
 * `data-*` attributes (mirrors the conventions of `<EntityList>`).
 *
 * Visual chrome (drawers, sheets, design-system buttons) is the consuming
 * app's responsibility — keep this component framework-agnostic.
 */
export function ActivityList({
  filter,
  pageSize = 20,
  onSelect,
  onComplete,
  onCancel,
  onReassign,
  onReschedule,
  actionLabels,
  className,
}: ActivityListProps): ReactNode {
  const [page, setPage] = useState(1);
  const labels = { ...DEFAULT_LABELS, ...actionLabels };

  const query = useActivities({ ...filter, page, pageSize });

  if (query.isLoading) {
    return (
      <div data-granit-activity-list="" data-granit-activity-list-loading="" className={className}>
        Loading…
      </div>
    );
  }

  if (query.isError) {
    return (
      <div
        data-granit-activity-list=""
        data-granit-activity-list-error=""
        role="alert"
        className={className}
      >
        {query.error?.message ?? 'Failed to load activities.'}
      </div>
    );
  }

  const data = query.data;
  if (!data || data.items.length === 0) {
    return (
      <div data-granit-activity-list="" data-granit-activity-list-empty="" className={className}>
        No activities.
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(data.totalCount / data.pageSize));
  const showActions = Boolean(onComplete ?? onCancel ?? onReassign ?? onReschedule);

  return (
    <div data-granit-activity-list="" className={className}>
      <table>
        <thead>
          <tr>
            <th scope="col">Type</th>
            <th scope="col">Entity</th>
            <th scope="col">Assignee</th>
            <th scope="col">Due</th>
            <th scope="col">Status</th>
            {showActions ? <th scope="col">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {data.items.map((a) => (
            <tr
              key={a.id}
              data-granit-activity-row=""
              data-activity-id={a.id}
              data-activity-status={a.status}
              onClick={onSelect ? () => onSelect(a) : undefined}
            >
              <td>{a.type}</td>
              <td>
                {a.entityType} · {a.entityId}
              </td>
              <td>{a.assignedToUserId}</td>
              <td>{a.dueAt}</td>
              <td>{a.status}</td>
              {showActions ? (
                <ActivityActions
                  activity={a}
                  labels={labels}
                  onComplete={onComplete}
                  onCancel={onCancel}
                  onReassign={onReassign}
                  onReschedule={onReschedule}
                />
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
      <div data-granit-activity-list-pagination="">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          ‹
        </button>
        <span>
          Page {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          ›
        </button>
      </div>
    </div>
  );
}
