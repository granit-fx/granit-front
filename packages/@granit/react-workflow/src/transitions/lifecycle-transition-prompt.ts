// ---------------------------------------------------------------------------
// Lifecycle transition prompts — confirmation metadata for workflow transitions
// ---------------------------------------------------------------------------
//
// Centralizes the severity / wording / strong-confirm decision for the
// common WorkflowLifecycleStatus transitions (Draft → Published, Published →
// Archived, …). Consumer apps build their own AlertDialog around the
// metadata returned here, keeping `@granit/react-workflow` free of any
// concrete UI-library dependency.
//
// Translation keys point into the `workflow` i18n namespace (see
// `./locales/en.ts`) — apps register the bundle once at bootstrap and let
// `useTranslation` resolve the strings.

import { WorkflowLifecycleStatus } from '@granit/workflow';

import type { WorkflowLifecycleStatusValue } from '@granit/workflow';

/** Severity classification — drives Alert / Button variants in consumer UIs. */
export type LifecycleTransitionSeverity = 'info' | 'warning' | 'destructive';

/**
 * Metadata describing how a {@link WorkflowLifecycleStatusValue} transition
 * should be confirmed in the UI — title / description i18n keys, severity,
 * and whether the consumer should require strong confirmation (typically
 * a "type the entity name to confirm" step for destructive actions).
 */
export interface LifecycleTransitionPrompt {
  /** Translation key for the dialog title. Pass to `t()` in the consumer. */
  readonly titleKey: string;
  /** Translation key for the dialog description / body. */
  readonly descriptionKey: string;
  /** Translation key for the confirm button label. */
  readonly confirmLabelKey: string;
  /** Severity hint for Alert / Button variants. */
  readonly severity: LifecycleTransitionSeverity;
  /**
   * Whether the consumer should require strong confirmation (e.g. typing
   * the entity name) before invoking the mutation. `true` only for
   * destructive transitions today (Published → Archived).
   */
  readonly requiresStrongConfirm: boolean;
}

const STATUS_NAME: Record<WorkflowLifecycleStatusValue, string> = {
  [WorkflowLifecycleStatus.Draft]: 'Draft',
  [WorkflowLifecycleStatus.PendingReview]: 'PendingReview',
  [WorkflowLifecycleStatus.Published]: 'Published',
  [WorkflowLifecycleStatus.Archived]: 'Archived',
};

/**
 * Returns the {@link LifecycleTransitionPrompt} metadata for a
 * `(fromStatus → toStatus)` pair. The translation keys are namespaced under
 * `workflow:Transition.{From}To{To}.*` so consumers may override individual
 * strings per domain by re-registering the namespace.
 *
 * The function always returns metadata — unknown / unusual pairs fall back
 * to a generic "Confirm transition" prompt rather than throwing, so a
 * consumer that ships a new workflow doesn't crash at runtime.
 */
export function buildLifecycleTransitionPrompt(
  fromStatus: WorkflowLifecycleStatusValue,
  toStatus: WorkflowLifecycleStatusValue
): LifecycleTransitionPrompt {
  const transitionKey = `${STATUS_NAME[fromStatus] ?? 'Unknown'}To${STATUS_NAME[toStatus] ?? 'Unknown'}`;
  const namespaced = (suffix: string) => `workflow:Transition.${transitionKey}.${suffix}`;

  const destructive = toStatus === WorkflowLifecycleStatus.Archived;
  const severity: LifecycleTransitionSeverity = destructive
    ? 'destructive'
    : toStatus === WorkflowLifecycleStatus.PendingReview
      ? 'warning'
      : 'info';

  return {
    titleKey: namespaced('Title'),
    descriptionKey: namespaced('Description'),
    confirmLabelKey: namespaced('Confirm'),
    severity,
    requiresStrongConfirm: destructive,
  };
}
