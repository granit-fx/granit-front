import { ActivitiesSidePanel } from '../components/activities-side-panel.js';

import type { EntitySidePanel, EntitySidePanelProps } from '@granit/react-entities';

export interface ActivitiesSidePanelContributionOptions {
  /**
   * Override the default `<ActivitiesSidePanel>` action callbacks. The
   * `EntitySidePanel` signature only carries `(entityName, entityId)`, so
   * action wiring must come from this opt-in factory rather than per-render
   * props. Omit a callback to hide the matching button (permission gating).
   */
  readonly onSelect?: Parameters<typeof ActivitiesSidePanel>[0]['onSelect'];
  readonly onComplete?: Parameters<typeof ActivitiesSidePanel>[0]['onComplete'];
  readonly onCancel?: Parameters<typeof ActivitiesSidePanel>[0]['onCancel'];
  readonly onReassign?: Parameters<typeof ActivitiesSidePanel>[0]['onReassign'];
  readonly onReschedule?: Parameters<typeof ActivitiesSidePanel>[0]['onReschedule'];
  readonly onCreate?: Parameters<typeof ActivitiesSidePanel>[0]['onCreate'];
  readonly actionLabels?: Parameters<typeof ActivitiesSidePanel>[0]['actionLabels'];
  readonly pageSize?: number;
  readonly className?: string;
}

/**
 * Factory producing the `EntitySidePanel` renderer for
 * `SidePanelKind === 'Activities'`. Apps merge this into their
 * `EntityComponentCatalog.sidePanels` map when wiring `<EntityDetail />`:
 *
 * ```tsx
 * import { activitiesSidePanel } from '@granit/react-activities';
 *
 * const catalog: EntityComponentCatalog = {
 *   form: { … },
 *   sidePanels: {
 *     Activities: activitiesSidePanel({
 *       onComplete: (a) => completeMutation.mutate({ id: a.id, request: { … } }),
 *       onCreate: ({ entityName, entityId }) => openCreateDrawer(entityName, entityId),
 *     }),
 *   },
 * };
 * ```
 *
 * The manifest's `EntityDetailSidePanelManifest` (with `kind: 'Activities'`)
 * is the opt-in surface — declaring it on the entity makes the panel slot
 * appear; this catalog entry tells `<EntityDetail />` *what* to render
 * inside that slot.
 */
export function activitiesSidePanel(
  options: ActivitiesSidePanelContributionOptions = {}
): EntitySidePanel {
  return function ActivitiesSidePanelRenderer({ entityName, entityId }: EntitySidePanelProps) {
    return (
      <ActivitiesSidePanel
        entityName={entityName}
        entityId={entityId}
        onSelect={options.onSelect}
        onComplete={options.onComplete}
        onCancel={options.onCancel}
        onReassign={options.onReassign}
        onReschedule={options.onReschedule}
        onCreate={options.onCreate}
        actionLabels={options.actionLabels}
        pageSize={options.pageSize}
        className={options.className}
      />
    );
  };
}
