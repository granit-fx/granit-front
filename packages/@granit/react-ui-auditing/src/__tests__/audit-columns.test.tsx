import { mockAuditEntries } from '@granit/react-auditing/testing';
import { useTranslation } from '@granit/react-localization';
import { dataTableFeatures } from '@granit/react-ui-kit';
import { flexRender, useTable } from '@tanstack/react-table';
import { screen } from '@testing-library/react';

import { createAuditColumns } from '../components/audit-columns';

import { renderAudit } from './test-utils';

import type { AuditEntryResponse } from '@granit/auditing';

type TranslateFn = Parameters<typeof createAuditColumns>[0]['t'];

const base = mockAuditEntries[0] as AuditEntryResponse;

function ColumnsHarness({
  entries,
  routeBase,
}: {
  readonly entries: readonly AuditEntryResponse[];
  readonly routeBase?: string;
}) {
  const { t } = useTranslation();
  const columns = createAuditColumns({
    t,
    formatDateTime: (date) => `D(${String(date)})`,
    routeBase,
  });
  const table = useTable({
    features: dataTableFeatures,
    data: entries as AuditEntryResponse[],
    columns,
  });
  return (
    <table>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} data-col={cell.column.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

describe('createAuditColumns', () => {
  it('returns the expected columns in order', () => {
    const identityT = ((key: string) => key) as unknown as TranslateFn;
    const columns = createAuditColumns({ t: identityT, formatDateTime: String });
    expect(columns.map((c) => c.id)).toEqual([
      'timestamp',
      'userName',
      'category',
      'entityChangeCount',
      'ipAddress',
      'actions',
    ]);
  });

  it('renders the formatted timestamp, user name, change count and IP', () => {
    renderAudit(<ColumnsHarness entries={[base]} />);
    expect(screen.getByText(`D(${base.timestamp})`)).toBeInTheDocument();
    expect(screen.getByText('Marie Dupont')).toBeInTheDocument();
    expect(screen.getByText(String(base.entityChangeCount))).toBeInTheDocument();
    expect(screen.getByText('10.0.1.45')).toBeInTheDocument();
  });

  it('falls back to the System label when the user name is null', () => {
    renderAudit(<ColumnsHarness entries={[{ ...base, userName: null }]} />);
    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.queryByText('Marie Dupont')).toBeNull();
  });

  it('renders a dash when the IP address is null', () => {
    renderAudit(<ColumnsHarness entries={[{ ...base, ipAddress: null }]} />);
    const ipCell = document.querySelector('td[data-col="ipAddress"]');
    expect(ipCell?.textContent).toBe('-');
  });

  it('links to the detail route using the default route base', () => {
    renderAudit(<ColumnsHarness entries={[base]} />);
    const link = screen.getByRole('link', { name: /view detail/i });
    expect(link).toHaveAttribute('href', `/auditing/${base.id}`);
  });

  it('honours a custom route base', () => {
    renderAudit(<ColumnsHarness entries={[base]} routeBase="/audit-logs" />);
    expect(screen.getByRole('link', { name: /view detail/i })).toHaveAttribute(
      'href',
      `/audit-logs/${base.id}`
    );
  });
});
