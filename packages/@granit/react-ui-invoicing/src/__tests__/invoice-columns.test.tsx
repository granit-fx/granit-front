import { sampleInvoices } from '@granit/react-invoicing/testing';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createInvoiceColumns } from '../components/invoice-columns';

import type { InvoiceResponse } from '@granit/invoicing';
import type { CellContext, ColumnDef } from '@tanstack/react-table';
import type { ReactNode } from 'react';

// Shared fixtures: [1] is an Open EUR invoice with both dates set, [2] is a
// Draft invoice with null issued/due dates (em-dash branch).
const openInvoice = sampleInvoices[1]!;
const noDatesInvoice = sampleInvoices[2]!;

function makeColumns(
  overrides: Partial<Parameters<typeof createInvoiceColumns>[0]> = {}
): ColumnDef<InvoiceResponse, unknown>[] {
  return createInvoiceColumns({
    t: ((key: string) => key) as Parameters<typeof createInvoiceColumns>[0]['t'],
    onViewDetail: vi.fn(),
    formatDate: (d: string | Date) => `date:${String(d)}`,
    locale: 'en',
    ...overrides,
  });
}

/** Invoke a column's cell renderer the way react-table would, for a given row. */
function renderCell(
  column: ColumnDef<InvoiceResponse, unknown>,
  invoice: InvoiceResponse
): ReactNode {
  const cell = column.cell;
  if (typeof cell !== 'function') return null;
  const ctx = { row: { original: invoice } } as unknown as CellContext<InvoiceResponse, unknown>;
  return cell(ctx);
}

describe('createInvoiceColumns', () => {
  afterEach(() => vi.clearAllMocks());

  it('should expose the expected column ids and headers', () => {
    const columns = makeColumns();
    expect(columns.map((c) => c.id)).toEqual([
      'invoiceNumber',
      'status',
      'amount',
      'currency',
      'dueAt',
      'issuedAt',
      'actions',
    ]);
    expect(columns[0]?.header).toBe('Invoicing.Columns.InvoiceNumber');
  });

  it('should render invoice number, currency and formatted amount cells', () => {
    const columns = makeColumns();
    render(<div>{renderCell(columns[0]!, openInvoice)}</div>);
    expect(screen.getByText('INV-2026-0002')).toBeInTheDocument();

    render(<div>{renderCell(columns[2]!, openInvoice)}</div>);
    expect(screen.getByText('€119.79')).toBeInTheDocument();

    render(<div>{renderCell(columns[3]!, openInvoice)}</div>);
    expect(screen.getByText('EUR')).toBeInTheDocument();
  });

  it('should render the status badge cell', () => {
    const columns = makeColumns();
    render(<div>{renderCell(columns[1]!, openInvoice)}</div>);
    expect(document.querySelector('[data-slot="invoice-status-badge"]')).toBeInTheDocument();
  });

  it('should format the due and issued dates when present', () => {
    const columns = makeColumns();
    render(<div>{renderCell(columns[4]!, openInvoice)}</div>);
    expect(screen.getByText(`date:${String(openInvoice.dueAt)}`)).toBeInTheDocument();

    render(<div>{renderCell(columns[5]!, openInvoice)}</div>);
    expect(screen.getByText(`date:${String(openInvoice.issuedAt)}`)).toBeInTheDocument();
  });

  it('should render an em dash when due and issued dates are missing', () => {
    const columns = makeColumns();
    render(
      <div>
        {renderCell(columns[4]!, noDatesInvoice)}
        {renderCell(columns[5]!, noDatesInvoice)}
      </div>
    );
    expect(screen.getAllByText('—')).toHaveLength(2);
  });

  it('should invoke onViewDetail with the row id when the action button is clicked', async () => {
    const onViewDetail = vi.fn();
    const columns = makeColumns({ onViewDetail });
    render(<div>{renderCell(columns[6]!, openInvoice)}</div>);

    const user = userEvent.setup({ delay: null });
    await user.click(screen.getByRole('button', { name: 'Invoicing.ViewDetail' }));
    expect(onViewDetail).toHaveBeenCalledWith(openInvoice.id);
  });
});
