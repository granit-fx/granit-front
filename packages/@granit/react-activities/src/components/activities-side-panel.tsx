import { type ReactNode } from 'react';

import { ActivityList } from './activity-list';

import type { ActivityActionLabels, ActivityListProps } from './activity-list';
import type { ActivityResponse } from '@granit/activities';

export interface ActivitiesSidePanelProps {
  /** Wire identifier of the host entity (matches `EntitySidePanelProps.entityName`). */
  readonly entityName: string;
  /** Id of the current entity instance. */
  readonly entityId: string;
  /**
   * Action callbacks. When `undefined`, the matching button is not rendered
   * — apps use this to gate by permission.
   */
  readonly onSelect?: ActivityListProps['onSelect'];
  readonly onComplete?: (activity: ActivityResponse) => void;
  readonly onCancel?: (activity: ActivityResponse) => void;
  readonly onReassign?: (activity: ActivityResponse) => void;
  readonly onReschedule?: (activity: ActivityResponse) => void;
  /**
   * "+ Activity" CTA handler. When `undefined`, the button is not rendered —
   * apps gate creation by permission and own the create form/flow (drawer,
   * sheet, …). The framework intentionally doesn't ship a create dialog.
   */
  readonly onCreate?: (context: { entityName: string; entityId: string }) => void;
  /** Override English defaults for action button labels (i18n in F9). */
  readonly actionLabels?: ActivityActionLabels;
  /** Default page size for the embedded list (default: 10). */
  readonly pageSize?: number;
  readonly className?: string;
}

const DEFAULT_CREATE_LABEL = '+ Activity';

/**
 * Per-entity activities side panel. Filters the activity list to
 * `entityType` + `entityId`, defaulting to `OpenOrOverdue` so the panel
 * shows what's actionable.
 *
 * Designed to plug into the `<EntityDetail />` side-panel pipeline of
 * `@granit/react-entities` via {@link activitiesSidePanelContribution} —
 * the manifest declares `SidePanelKind === 'Activities'` and the catalog
 * provides this renderer.
 */
export function ActivitiesSidePanel({
  entityName,
  entityId,
  onSelect,
  onComplete,
  onCancel,
  onReassign,
  onReschedule,
  onCreate,
  actionLabels,
  pageSize = 10,
  className,
}: ActivitiesSidePanelProps): ReactNode {
  return (
    <section
      data-granit-activities-side-panel=""
      data-entity-name={entityName}
      data-entity-id={entityId}
      className={className}
      aria-label="Activities"
    >
      {onCreate ? (
        <header data-granit-activities-side-panel-header="">
          <button
            type="button"
            data-granit-activities-side-panel-create=""
            onClick={() => onCreate({ entityName, entityId })}
          >
            {DEFAULT_CREATE_LABEL}
          </button>
        </header>
      ) : null}
      <ActivityList
        filter={{
          entityType: entityName,
          entityId,
          status: 'OpenOrOverdue',
        }}
        pageSize={pageSize}
        onSelect={onSelect}
        onComplete={onComplete}
        onCancel={onCancel}
        onReassign={onReassign}
        onReschedule={onReschedule}
        actionLabels={actionLabels}
      />
    </section>
  );
}
