import { useTranslation } from '@granit/react-localization';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Spinner,
  toast,
} from '@granit/react-ui';
import {
  WorkflowProvider,
  useExecuteTransition,
  useTransitions,
  useWorkflowHistory,
} from '@granit/react-workflow';
import { cn } from '@granit/utils';
import { GitBranch } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { TransitionCommentDialog } from './transition-comment-dialog';
import { WorkflowHistory } from './workflow-history';
import { WorkflowStatusBar } from './workflow-status-bar';

import type { WorkflowConfig } from '@granit/react-workflow';
import type {
  WorkflowTransitionResponse,
  WorkflowTransitionResultResponse,
} from '@granit/workflow';

export interface EntityWorkflowProps {
  /**
   * Workflow API config (`{ client, basePath }`) injected by the host — the
   * showcase passes its `workflowConfig`. Kept a prop so the package stays
   * agnostic of how the app builds its API client.
   */
  config: WorkflowConfig;
  entityType: string;
  entityId: string;
  currentState: string;
  /** Ordered list of all possible workflow states for display */
  states: readonly string[];
  onStateChange?: (newState: string) => void;
  className?: string;
}

type EntityWorkflowInnerProps = Omit<EntityWorkflowProps, 'config'>;

function EntityWorkflowInner({
  entityType,
  entityId,
  currentState,
  states,
  onStateChange,
  className,
}: Readonly<EntityWorkflowInnerProps>) {
  const { t } = useTranslation();

  const {
    data: transitionsData,
    isLoading: statusLoading,
    isError: statusError,
  } = useTransitions({ currentState });

  const transitions = useMemo(() => transitionsData?.availableTransitions ?? [], [transitionsData]);

  const { data: historyData, isLoading: historyLoading } = useWorkflowHistory({
    entityType,
    entityId,
  });

  const history = historyData?.items ?? [];

  const [pendingTransition, setPendingTransition] = useState<WorkflowTransitionResponse | null>(
    null
  );

  const handleOutcome = useCallback(
    (result: WorkflowTransitionResultResponse) => {
      switch (result.outcome) {
        case 'Completed':
          toast.success(t('Workflow.OutcomeCompleted'));
          break;
        case 'ApprovalRequested':
          toast.info(t('Workflow.OutcomeApprovalRequested'));
          break;
        case 'Denied':
          toast.error(t('Workflow.OutcomeDenied'));
          break;
        case 'InvalidTransition':
          toast.error(t('Workflow.OutcomeInvalidTransition'));
          break;
      }
      if (result.outcome === 'Completed' && result.resultingState) {
        onStateChange?.(result.resultingState);
      }
    },
    [t, onStateChange]
  );

  const { transition, isPending: transitioning } = useExecuteTransition({
    onSuccess: handleOutcome,
  });

  const handleTransition = useCallback(
    (targetState: string) => {
      const dto = transitions.find((tr) => tr.targetState === targetState);
      if (dto) {
        setPendingTransition(dto);
      }
    },
    [transitions]
  );

  const handleConfirmTransition = useCallback(
    (comment?: string) => {
      if (!pendingTransition) return;
      transition(currentState, pendingTransition.targetState, comment);
      setPendingTransition(null);
    },
    [pendingTransition, transition, currentState]
  );

  if (statusLoading && transitions.length === 0) {
    return (
      <Card className={className} data-slot="entity-workflow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            {t('Workflow.Title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Spinner size="md" />
        </CardContent>
      </Card>
    );
  }

  if (statusError && transitions.length === 0) {
    return (
      <Card className={className} data-slot="entity-workflow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            {t('Workflow.Title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>{t('Workflow.ErrorTitle')}</AlertTitle>
            <AlertDescription>{t('Workflow.ErrorMessage')}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(className)} data-slot="entity-workflow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          {t('Workflow.Title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <WorkflowStatusBar
          currentState={currentState}
          states={states}
          transitions={transitions}
          onTransition={handleTransition}
          isLoading={transitioning}
          className={cn(
            'flex flex-wrap items-center gap-3',
            '[&_[data-testid=workflow-states]]:flex [&_[data-testid=workflow-states]]:flex-wrap [&_[data-testid=workflow-states]]:items-center [&_[data-testid=workflow-states]]:gap-1',
            '[&_span[data-state]]:inline-flex [&_span[data-state]]:items-center [&_span[data-state]]:rounded-full [&_span[data-state]]:px-3 [&_span[data-state]]:py-1 [&_span[data-state]]:text-xs [&_span[data-state]]:font-medium',
            '[&_[data-current=true]]:bg-primary [&_[data-current=true]]:text-primary-foreground',
            '[&_[data-past=true]]:bg-success-500/15 [&_[data-past=true]]:text-success-600 dark:[&_[data-past=true]]:text-success-500',
            '[&_[data-current=false][data-past=false]]:bg-secondary [&_[data-current=false][data-past=false]]:text-muted-foreground',
            '[&_fieldset]:flex [&_fieldset]:gap-2 [&_fieldset]:border-0 [&_fieldset]:p-0 [&_fieldset]:m-0',
            '[&_fieldset_button]:inline-flex [&_fieldset_button]:items-center [&_fieldset_button]:rounded-md [&_fieldset_button]:px-3 [&_fieldset_button]:py-1.5 [&_fieldset_button]:text-xs [&_fieldset_button]:font-medium [&_fieldset_button]:cursor-pointer [&_fieldset_button]:transition-colors',
            '[&_fieldset_button]:bg-primary [&_fieldset_button]:text-primary-foreground [&_fieldset_button]:hover:bg-primary/90',
            '[&_fieldset_button:disabled]:opacity-50 [&_fieldset_button:disabled]:cursor-not-allowed',
            '[&_fieldset_button[data-requires-approval=true]]:bg-warning-500/15 [&_fieldset_button[data-requires-approval=true]]:text-warning-600 dark:[&_fieldset_button[data-requires-approval=true]]:text-warning-500 [&_fieldset_button[data-requires-approval=true]]:border [&_fieldset_button[data-requires-approval=true]]:border-warning-500/40'
          )}
        />

        <div>
          <h4 className="mb-3 text-sm font-medium text-foreground">{t('Workflow.HistoryTitle')}</h4>
          <WorkflowHistory
            history={history}
            loading={historyLoading}
            emptyMessage={t('Workflow.HistoryEmpty')}
            className={cn(
              'space-y-2',
              '[&_[data-testid=workflow-history-loading]]:flex [&_[data-testid=workflow-history-loading]]:justify-center [&_[data-testid=workflow-history-loading]]:py-4 [&_[data-testid=workflow-history-loading]]:text-sm [&_[data-testid=workflow-history-loading]]:text-muted-foreground',
              '[&_[data-testid=workflow-history-empty]]:py-4 [&_[data-testid=workflow-history-empty]]:text-center [&_[data-testid=workflow-history-empty]]:text-sm [&_[data-testid=workflow-history-empty]]:text-muted-foreground',
              '[&_[data-testid=workflow-history]]:list-none [&_[data-testid=workflow-history]]:space-y-2 [&_[data-testid=workflow-history]]:p-0',
              '[&_[data-testid=workflow-history-entry]]:flex [&_[data-testid=workflow-history-entry]]:flex-wrap [&_[data-testid=workflow-history-entry]]:items-center [&_[data-testid=workflow-history-entry]]:gap-2 [&_[data-testid=workflow-history-entry]]:rounded-md [&_[data-testid=workflow-history-entry]]:border [&_[data-testid=workflow-history-entry]]:border-border [&_[data-testid=workflow-history-entry]]:p-3 [&_[data-testid=workflow-history-entry]]:text-sm',
              '[&_[data-testid=workflow-history-states]]:font-medium [&_[data-testid=workflow-history-states]]:text-foreground',
              '[&_[data-testid=workflow-history-author]]:text-muted-foreground',
              '[&_[data-testid=workflow-history-date]]:text-xs [&_[data-testid=workflow-history-date]]:text-muted-foreground',
              '[&_[data-testid=workflow-history-comment]]:w-full [&_[data-testid=workflow-history-comment]]:italic [&_[data-testid=workflow-history-comment]]:text-muted-foreground'
            )}
          />
        </div>
        <TransitionCommentDialog
          open={pendingTransition !== null}
          transitionName={pendingTransition?.name ?? ''}
          requiresApproval={pendingTransition?.requiresApproval ?? false}
          onConfirm={handleConfirmTransition}
          onCancel={() => setPendingTransition(null)}
        />
      </CardContent>
    </Card>
  );
}

/**
 * Self-contained entity workflow component.
 * Wraps WorkflowProvider internally so consumers only need to provide the API
 * `config` plus entityType, entityId, currentState, and the ordered states.
 */
export function EntityWorkflow({ config, ...props }: Readonly<EntityWorkflowProps>) {
  return (
    <WorkflowProvider config={config}>
      <EntityWorkflowInner {...props} />
    </WorkflowProvider>
  );
}
