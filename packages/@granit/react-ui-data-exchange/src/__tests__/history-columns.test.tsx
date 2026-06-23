import { mockExportHistory, mockImportHistory } from '@granit/react-data-exchange/testing';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createExportHistoryColumns } from '../components/export-history-columns';
import { createImportHistoryColumns } from '../components/import-history-columns';
import {
  createJobActionColumn,
  createJobDateColumn,
  createJobEntityColumn,
  createJobStatusColumn,
} from '../components/job-history-columns';

import { renderDataExchange } from './test-utils';

import type { ExportJobResponse, ImportJobResponse } from '@granit/data-exchange';
import type { ColumnDef } from '@tanstack/react-table';
import type { ReactNode } from 'react';

const t = ((key: string) => key) as never;
const formatDateTime = (date: string | Date) => `formatted:${String(date)}`;

// Minimal stand-in for a tanstack cell context: only `row.original` is read.
function renderCell<TRow>(column: ColumnDef<TRow, unknown>, original: TRow): ReactNode {
  const cell = column.cell;
  if (typeof cell !== 'function') return null;
  return cell({ row: { original } } as never) as ReactNode;
}

const exportJob: ExportJobResponse = mockExportHistory[0];
const importJob: ImportJobResponse = mockImportHistory[0];

describe('job-history-columns shared factories', () => {
  it('should render the date column cell using formatDateTime', () => {
    const column = createJobDateColumn<ExportJobResponse>(t, formatDateTime);
    renderDataExchange(<>{renderCell(column, exportJob)}</>);
    expect(screen.getByText('formatted:2026-03-07T10:00:00Z')).toBeInTheDocument();
  });

  it('should render the entity column cell', () => {
    const column = createJobEntityColumn<ExportJobResponse>(t);
    renderDataExchange(<>{renderCell(column, exportJob)}</>);
    expect(screen.getByText('countries')).toBeInTheDocument();
  });

  it('should render the status column cell as a badge', () => {
    const column = createJobStatusColumn<ExportJobResponse>(t);
    renderDataExchange(<>{renderCell(column, exportJob)}</>);
    expect(document.querySelector('[data-slot="job-status-badge"]')).toBeInTheDocument();
  });

  it('should render the action column button and call onAction', async () => {
    const onAction = vi.fn();
    const column = createJobActionColumn<ExportJobResponse>({
      icon: <span>icon</span>,
      ariaLabel: 'Do it',
      onAction,
    });
    const { user } = renderDataExchange(<>{renderCell(column, exportJob)}</>);
    await user.click(screen.getByRole('button', { name: 'Do it' }));
    expect(onAction).toHaveBeenCalledWith(exportJob);
  });

  it('should hide the action when the visible predicate is false', () => {
    const column = createJobActionColumn<ExportJobResponse>({
      icon: <span>icon</span>,
      ariaLabel: 'Hidden',
      onAction: vi.fn(),
      visible: () => false,
    });
    const { container } = renderDataExchange(<>{renderCell(column, exportJob)}</>);
    expect(container.querySelector('button')).not.toBeInTheDocument();
  });
});

describe('createExportHistoryColumns', () => {
  it('should build columns and render the format and rowCount cells', () => {
    const onDownload = vi.fn();
    const columns = createExportHistoryColumns({ t, formatDateTime, onDownload });
    const formatColumn = columns.find((c) => c.id === 'format');
    const rowCountColumn = columns.find((c) => c.id === 'rowCount');
    renderDataExchange(
      <>
        {renderCell(formatColumn as ColumnDef<ExportJobResponse, unknown>, exportJob)}
        {renderCell(rowCountColumn as ColumnDef<ExportJobResponse, unknown>, exportJob)}
      </>
    );
    expect(screen.getByText('csv')).toBeInTheDocument();
    expect(screen.getByText('195')).toBeInTheDocument();
  });

  it('should render an em-dash when rowCount is missing', () => {
    const columns = createExportHistoryColumns({ t, formatDateTime, onDownload: vi.fn() });
    const rowCountColumn = columns.find((c) => c.id === 'rowCount');
    renderDataExchange(
      <>
        {renderCell(
          rowCountColumn as ColumnDef<ExportJobResponse, unknown>,
          {
            ...exportJob,
            rowCount: null,
          } as ExportJobResponse
        )}
      </>
    );
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('should render the download action only for completed jobs', () => {
    const columns = createExportHistoryColumns({ t, formatDateTime, onDownload: vi.fn() });
    const actionColumn = columns.find((c) => c.id === 'actions');
    const { rerender, container } = renderDataExchange(
      <>
        {renderCell(
          actionColumn as ColumnDef<ExportJobResponse, unknown>,
          {
            ...exportJob,
            status: 'Failed',
          } as ExportJobResponse
        )}
      </>
    );
    expect(container.querySelector('button')).not.toBeInTheDocument();
    rerender(<>{renderCell(actionColumn as ColumnDef<ExportJobResponse, unknown>, exportJob)}</>);
    expect(screen.getByRole('button', { name: 'DataExchange.Download' })).toBeInTheDocument();
  });
});

describe('createImportHistoryColumns', () => {
  it('should build columns and render the file-name cell', () => {
    const columns = createImportHistoryColumns({
      t,
      formatDateTime,
      onViewReport: vi.fn(),
    });
    const fileColumn = columns.find((c) => c.id === 'originalFileName');
    renderDataExchange(
      <>{renderCell(fileColumn as ColumnDef<ImportJobResponse, unknown>, importJob)}</>
    );
    expect(screen.getByText('countries-2026-03.csv')).toBeInTheDocument();
  });

  it('should render the view-report action and call onViewReport', async () => {
    const onViewReport = vi.fn();
    const columns = createImportHistoryColumns({ t, formatDateTime, onViewReport });
    const actionColumn = columns.find((c) => c.id === 'actions');
    const { user } = renderDataExchange(
      <>{renderCell(actionColumn as ColumnDef<ImportJobResponse, unknown>, importJob)}</>
    );
    await user.click(screen.getByRole('button', { name: 'DataExchange.ViewReport' }));
    expect(onViewReport).toHaveBeenCalledWith(importJob);
  });
});
