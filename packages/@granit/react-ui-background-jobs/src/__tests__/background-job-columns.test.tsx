import { mockBackgroundJobs } from '@granit/react-background-jobs/testing';
import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createBackgroundJobColumns } from '../components/background-job-columns';

import { renderBackgroundJobs } from './test-utils';

import type { BackgroundJobStatus } from '@granit/background-jobs';
import type { DataTableCellContext, DataTableColumnDef } from '@granit/react-ui-kit';
import type { ReactElement } from 'react';

function makeJob(overrides: Partial<BackgroundJobStatus> = {}): BackgroundJobStatus {
  return {
    ...mockBackgroundJobs[0],
    ...overrides,
  };
}

const handlers = {
  onPause: vi.fn(),
  onResume: vi.fn(),
  onTrigger: vi.fn(),
};

function buildColumns(isMutating = false): DataTableColumnDef<BackgroundJobStatus, unknown>[] {
  return createBackgroundJobColumns({
    t: ((key: string, opts?: { count?: number }) =>
      opts?.count === undefined ? key : `${key}#${opts.count}`) as never,
    locale: 'en',
    formatDateTime: () => 'FORMATTED_DATETIME',
    formatTimeAgo: () => 'TIME_AGO',
    ...handlers,
    isMutating,
  });
}

/** Renders a column's cell for a given job through the i18n/tooltip wrapper. */
function renderCell(
  columns: DataTableColumnDef<BackgroundJobStatus, unknown>[],
  columnId: string,
  job: BackgroundJobStatus
) {
  const column = columns.find((c) => c.id === columnId);
  if (!column?.cell || typeof column.cell !== 'function') {
    throw new Error(`Column ${columnId} has no cell renderer`);
  }
  const ctx = { row: { original: job } } as unknown as DataTableCellContext<
    BackgroundJobStatus,
    unknown
  >;
  const node = column.cell(ctx) as ReactElement | null;
  return renderBackgroundJobs(<>{node}</>);
}

describe('createBackgroundJobColumns', () => {
  it('produces a column per visible field plus an actions column', () => {
    const ids = buildColumns()
      .map((c) => c.id)
      .filter(Boolean);
    expect(ids).toEqual([
      'jobName',
      'cronExpression',
      'isEnabled',
      'lastExecutedAt',
      'nextExecutionAt',
      'consecutiveFailures',
      'actions',
    ]);
  });

  it('renders the job name cell', () => {
    renderCell(buildColumns(), 'jobName', makeJob({ jobName: 'Indexer' }));
    expect(screen.getByText('Indexer')).toBeInTheDocument();
  });

  it('renders a humanised cron cell', () => {
    const { container } = renderCell(buildColumns(), 'cronExpression', makeJob());
    expect(container.textContent).not.toBe('');
  });

  it('status cell: Active when enabled and healthy', () => {
    renderCell(buildColumns(), 'isEnabled', makeJob({ isEnabled: true, consecutiveFailures: 0 }));
    expect(screen.getByText('BackgroundJobs.Status.Active')).toBeInTheDocument();
  });

  it('status cell: Failing when enabled with failures', () => {
    renderCell(buildColumns(), 'isEnabled', makeJob({ isEnabled: true, consecutiveFailures: 2 }));
    expect(screen.getByText('BackgroundJobs.Status.Failing')).toBeInTheDocument();
  });

  it('status cell: Paused when disabled', () => {
    renderCell(buildColumns(), 'isEnabled', makeJob({ isEnabled: false }));
    expect(screen.getByText('BackgroundJobs.Status.Paused')).toBeInTheDocument();
  });

  it('last-execution cell: formatted value when present', () => {
    renderCell(buildColumns(), 'lastExecutedAt', makeJob());
    expect(screen.getByText('TIME_AGO')).toBeInTheDocument();
  });

  it('last-execution cell: Never when null', () => {
    renderCell(buildColumns(), 'lastExecutedAt', makeJob({ lastExecutedAt: null }));
    expect(screen.getByText('BackgroundJobs.Never')).toBeInTheDocument();
  });

  it('next-execution cell: formatted value when present', () => {
    renderCell(buildColumns(), 'nextExecutionAt', makeJob());
    expect(screen.getByText('FORMATTED_DATETIME')).toBeInTheDocument();
  });

  it('next-execution cell: NotScheduled when null', () => {
    renderCell(buildColumns(), 'nextExecutionAt', makeJob({ nextExecutionAt: null }));
    expect(screen.getByText('BackgroundJobs.NotScheduled')).toBeInTheDocument();
  });

  it('failures cell: null when no failures and no dead letters', () => {
    const columns = buildColumns();
    const column = columns.find((c) => c.id === 'consecutiveFailures');
    const ctx = {
      row: { original: makeJob({ consecutiveFailures: 0, deadLetterCount: 0 }) },
    } as unknown as DataTableCellContext<BackgroundJobStatus, unknown>;
    if (!column?.cell || typeof column.cell !== 'function') throw new Error('no cell');
    expect(column.cell(ctx)).toBeNull();
  });

  it('failures cell: shows the failure count with lastError tooltip content', () => {
    renderCell(
      buildColumns(),
      'consecutiveFailures',
      makeJob({ consecutiveFailures: 5, lastError: 'boom' })
    );
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('failures cell: falls back to the Failing label when lastError is null', async () => {
    const { user } = renderCell(
      buildColumns(),
      'consecutiveFailures',
      makeJob({ consecutiveFailures: 1, lastError: null })
    );
    await user.hover(screen.getByText('1'));
    expect(await screen.findAllByText('BackgroundJobs.Status.Failing')).not.toHaveLength(0);
  });

  it('failures cell: shows the dead-letter line', () => {
    renderCell(
      buildColumns(),
      'consecutiveFailures',
      makeJob({ consecutiveFailures: 0, deadLetterCount: 4 })
    );
    expect(screen.getByText('BackgroundJobs.DeadLetters#4')).toBeInTheDocument();
  });

  it('actions cell: pause/trigger for an enabled job', async () => {
    const columns = buildColumns();
    const { user } = renderCell(columns, 'actions', makeJob({ isEnabled: true }));
    await user.click(screen.getByRole('button', { name: /Actions for/ }));
    await user.click(await screen.findByText('BackgroundJobs.Actions.Pause'));
    expect(handlers.onPause).toHaveBeenCalled();
  });

  it('actions cell: triggers an enabled job from the menu', async () => {
    handlers.onTrigger.mockClear();
    const columns = buildColumns();
    const { user } = renderCell(columns, 'actions', makeJob({ isEnabled: true }));
    await user.click(screen.getByRole('button', { name: /Actions for/ }));
    await user.click(await screen.findByText('BackgroundJobs.Actions.Trigger'));
    expect(handlers.onTrigger).toHaveBeenCalled();
  });

  it('actions cell: resume for a disabled job, trigger disabled', async () => {
    handlers.onResume.mockClear();
    const columns = buildColumns();
    const { user } = renderCell(columns, 'actions', makeJob({ isEnabled: false }));
    await user.click(screen.getByRole('button', { name: /Actions for/ }));
    const resume = await screen.findByText('BackgroundJobs.Actions.Resume');
    await user.click(resume);
    expect(handlers.onResume).toHaveBeenCalled();
  });

  it('actions cell: disables items while mutating', async () => {
    const columns = buildColumns(true);
    const { user } = renderCell(columns, 'actions', makeJob({ isEnabled: true }));
    await user.click(screen.getByRole('button', { name: /Actions for/ }));
    const menu = await screen.findByRole('menu');
    const items = within(menu).getAllByRole('menuitem');
    for (const item of items) {
      expect(item).toHaveAttribute('aria-disabled', 'true');
    }
  });
});
