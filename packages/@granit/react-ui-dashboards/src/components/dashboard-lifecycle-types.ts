import type { DashboardSummaryResponse } from '@granit/dashboards';

export type LifecycleAction = 'publish' | 'archive' | 'restore' | 'resync';

export interface PendingLifecycle {
  readonly action: LifecycleAction;
  readonly dashboard: DashboardSummaryResponse;
}

export const actionTitle = (action: LifecycleAction) =>
  (action.charAt(0).toUpperCase() + action.slice(1)) as
    | 'Publish'
    | 'Archive'
    | 'Restore'
    | 'Resync';

export const LIFECYCLE_TOAST_DEFAULTS: Record<
  LifecycleAction,
  { readonly success: (name: string) => string; readonly error: (name: string) => string }
> = {
  publish: {
    success: (name) => `Published "${name}"`,
    error: (name) => `Could not publish "${name}"`,
  },
  archive: {
    success: (name) => `Archived "${name}"`,
    error: (name) => `Could not archive "${name}"`,
  },
  restore: {
    success: (name) => `Restored "${name}"`,
    error: (name) => `Could not restore "${name}"`,
  },
  resync: {
    success: (name) => `Re-synced "${name}"`,
    error: (name) => `Could not re-sync "${name}"`,
  },
};

export function pickStatusMutation<T>(
  action: LifecycleAction,
  mutations: {
    readonly publishMutation: T;
    readonly archiveMutation: T;
    readonly restoreMutation: T;
  }
): T {
  if (action === 'publish') return mutations.publishMutation;
  if (action === 'archive') return mutations.archiveMutation;
  return mutations.restoreMutation;
}
