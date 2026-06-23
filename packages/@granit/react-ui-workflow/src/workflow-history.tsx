import { Spinner, Table, TableBody, TableCell, TableRow } from '@granit/react-ui';

import type { TransitionHistory } from '@granit/workflow';

export interface WorkflowHistoryProps {
  history: readonly TransitionHistory[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

/**
 * Displays the workflow transition history (audit trail).
 *
 * Renders each transition as a table row showing: previous state -> new state,
 * author, date, and optional comment.
 */
export function WorkflowHistory({
  history,
  loading = false,
  emptyMessage = 'No transitions yet.',
  className,
}: Readonly<WorkflowHistoryProps>) {
  if (loading) {
    return (
      <div className={className} data-testid="workflow-history-loading" aria-busy="true">
        <Spinner />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className={className} data-testid="workflow-history-empty">
        {emptyMessage}
      </div>
    );
  }

  return (
    <Table className={className} data-testid="workflow-history">
      <TableBody>
        {history.map((entry, index) => (
          <TableRow key={`${entry.transitionedAt}-${index}`} data-testid="workflow-history-entry">
            <TableCell data-testid="workflow-history-states">
              {entry.previousState} → {entry.newState}
            </TableCell>
            <TableCell data-testid="workflow-history-author">{entry.transitionedBy}</TableCell>
            <TableCell>
              <time dateTime={entry.transitionedAt} data-testid="workflow-history-date">
                {entry.transitionedAt}
              </time>
            </TableCell>
            {entry.comment && (
              <TableCell data-testid="workflow-history-comment">{entry.comment}</TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
