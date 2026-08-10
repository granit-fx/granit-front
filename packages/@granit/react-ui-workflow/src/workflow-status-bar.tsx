import { useTranslation } from '@granit/react-localization';
import { Badge, Button } from '@granit/react-ui';

import type { WorkflowTransitionResponse } from '@granit/workflow';

export interface WorkflowStatusBarProps {
  currentState: string;
  states: readonly string[];
  transitions: readonly WorkflowTransitionResponse[];
  onTransition?: (targetState: string, comment?: string) => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * Workflow status bar (Odoo-style).
 *
 * Renders the workflow states as badge chips with action buttons for
 * available transitions.
 */
export function WorkflowStatusBar({
  currentState,
  states,
  transitions,
  onTransition,
  isLoading = false,
  className,
}: Readonly<WorkflowStatusBarProps>) {
  const { t } = useTranslation();
  const currentIndex = states.indexOf(currentState);

  return (
    <div
      className={className}
      data-slot="workflow-status-bar"
      data-testid="workflow-status-bar"
      data-current-state={currentState}
    >
      <div data-testid="workflow-states">
        {states.map((state, index) => {
          const isCurrent = state === currentState;
          const isPast = index < currentIndex;
          let variant: 'default' | 'secondary' | 'outline' = 'outline';
          if (isCurrent) variant = 'default';
          else if (isPast) variant = 'secondary';

          return (
            <Badge
              key={state}
              variant={variant}
              data-state={state}
              data-current={isCurrent}
              data-past={isPast}
              data-testid={`workflow-state-${state}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {state}
            </Badge>
          );
        })}
      </div>

      {transitions.length > 0 && (
        <fieldset data-testid="workflow-actions" aria-label={t('Components.Workflow.Actions')}>
          {transitions.map((transition) => {
            const label =
              transition.requiresApproval && !transition.allowed
                ? t('Components.Workflow.RequestApproval')
                : transition.name;

            return (
              <Button
                key={transition.targetState}
                size="sm"
                disabled={isLoading}
                data-target={transition.targetState}
                data-requires-approval={transition.requiresApproval}
                data-testid={`workflow-action-${transition.targetState}`}
                onClick={() => onTransition?.(transition.targetState)}
              >
                {label}
              </Button>
            );
          })}
        </fieldset>
      )}
    </div>
  );
}
