import { screen, waitFor } from '@testing-library/react';

import { InvoiceDetailPage } from '../invoice-detail-page';

import { renderWithProviders } from './test-utils';

import type { InvoiceResponse } from '@granit/invoicing';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { mockUseParams } = vi.hoisted(() => ({
  mockUseParams: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useParams: mockUseParams,
  };
});

const { mockUseInvoice } = vi.hoisted(() => ({
  mockUseInvoice: vi.fn(),
}));

vi.mock('@granit/react-invoicing', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useInvoice: mockUseInvoice,
  };
});

vi.mock('@granit/react-localization', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useDateFormatter: () => ({
      formatDate: (d: string) => `date:${d}`,
      formatDateTime: (d: string) => `datetime:${d}`,
      formatTimeAgo: (d: string) => d,
    }),
  };
});

// DownloadPdfButton needs the download mutation hook; stub the whole component.
vi.mock('../components/download-pdf-button', () => ({
  DownloadPdfButton: () => <button type="button">Download PDF</button>,
}));

// ---------------------------------------------------------------------------
// Mock data — amounts in minor units, ISO 8601 dates
// ---------------------------------------------------------------------------

const mockInvoice: InvoiceResponse = {
  id: '11111111-1111-1111-1111-111111111111',
  partyId: '99999999-9999-9999-9999-999999999999',
  documentType: 'Invoice',
  invoiceNumber: 'INV-2026-0001',
  status: 'Open',
  collectionMethod: 'SendInvoice',
  billingReason: 'Manual',
  currency: 'EUR',
  subtotal: 10000,
  taxTotal: 2100,
  total: 12100,
  amountPaid: 5000,
  amountCredited: 0,
  amountRemaining: 7100,
  parentInvoiceId: null,
  creditNoteReason: null,
  issuedAt: '2026-01-15T10:00:00.000Z',
  dueAt: '2026-02-15T00:00:00.000Z',
  paidAt: null,
  periodStart: null,
  periodEnd: null,
  lineItems: [
    {
      id: 'line-1',
      description: 'Consulting services',
      quantity: 2,
      unitPrice: 5000,
      amount: 10000,
      taxRate: 21,
      taxAmount: 2100,
      sourceType: 'Manual',
      sourceId: null,
      periodStart: null,
      periodEnd: null,
    },
  ],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('InvoiceDetailPage', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: '11111111-1111-1111-1111-111111111111' });
  });

  afterEach(() => vi.clearAllMocks());

  it('should display the loading spinner', () => {
    mockUseInvoice.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<InvoiceDetailPage />, {
      route: '/invoicing/11111111-1111-1111-1111-111111111111',
    });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should display the not-found state when the invoice is missing', () => {
    mockUseInvoice.mockReturnValue({ data: undefined, isLoading: false });
    renderWithProviders(<InvoiceDetailPage />, {
      route: '/invoicing/11111111-1111-1111-1111-111111111111',
    });
    expect(screen.getByText('Invoice not found')).toBeInTheDocument();
    expect(screen.getByText('The requested invoice does not exist.')).toBeInTheDocument();
    expect(screen.getByText('Back to list')).toBeInTheDocument();
  });

  it('should have the correct data-slot', () => {
    mockUseInvoice.mockReturnValue({ data: mockInvoice, isLoading: false });
    renderWithProviders(<InvoiceDetailPage />, {
      route: '/invoicing/11111111-1111-1111-1111-111111111111',
    });
    expect(document.querySelector('[data-slot="invoice-detail-page"]')).toBeInTheDocument();
  });

  it('should display the invoice number, status and document type', () => {
    mockUseInvoice.mockReturnValue({ data: mockInvoice, isLoading: false });
    renderWithProviders(<InvoiceDetailPage />, {
      route: '/invoicing/11111111-1111-1111-1111-111111111111',
    });
    expect(screen.getAllByText('INV-2026-0001').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getAllByText('Invoice').length).toBeGreaterThanOrEqual(1);
  });

  it('should display the information section', () => {
    mockUseInvoice.mockReturnValue({ data: mockInvoice, isLoading: false });
    renderWithProviders(<InvoiceDetailPage />, {
      route: '/invoicing/11111111-1111-1111-1111-111111111111',
    });
    expect(screen.getByText('Information')).toBeInTheDocument();
    expect(screen.getByText('Collection Method')).toBeInTheDocument();
    expect(screen.getByText('SendInvoice')).toBeInTheDocument();
    expect(screen.getByText('Billing Reason')).toBeInTheDocument();
    expect(screen.getByText('Manual')).toBeInTheDocument();
  });

  it('should display the amounts section with formatted currency', () => {
    mockUseInvoice.mockReturnValue({ data: mockInvoice, isLoading: false });
    renderWithProviders(<InvoiceDetailPage />, {
      route: '/invoicing/11111111-1111-1111-1111-111111111111',
    });
    expect(screen.getByText('Amounts')).toBeInTheDocument();
    // minor units / 100 → EUR currency formatting (en locale).
    // €100.00 / €21.00 / €50.00 also appear in the line-item table, so allow duplicates.
    expect(screen.getAllByText('€100.00').length).toBeGreaterThanOrEqual(1); // subtotal
    expect(screen.getAllByText('€21.00').length).toBeGreaterThanOrEqual(1); // tax
    expect(screen.getByText('€121.00')).toBeInTheDocument(); // total (unique)
    expect(screen.getAllByText('€50.00').length).toBeGreaterThanOrEqual(1); // amount paid
    expect(screen.getByText('€71.00')).toBeInTheDocument(); // amount remaining (unique)
  });

  it('should display the dates section', () => {
    mockUseInvoice.mockReturnValue({ data: mockInvoice, isLoading: false });
    renderWithProviders(<InvoiceDetailPage />, {
      route: '/invoicing/11111111-1111-1111-1111-111111111111',
    });
    expect(screen.getByText('Dates')).toBeInTheDocument();
    expect(screen.getByText('datetime:2026-01-15T10:00:00.000Z')).toBeInTheDocument(); // issuedAt
    expect(screen.getByText('date:2026-02-15T00:00:00.000Z')).toBeInTheDocument(); // dueAt
    // paidAt is null → em dash placeholder
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('should display the line items', async () => {
    mockUseInvoice.mockReturnValue({ data: mockInvoice, isLoading: false });
    renderWithProviders(<InvoiceDetailPage />, {
      route: '/invoicing/11111111-1111-1111-1111-111111111111',
    });
    await waitFor(() => {
      expect(screen.getByText('Line Items')).toBeInTheDocument();
    });
    expect(screen.getByText('Consulting services')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="invoice-line-items"]')).toBeInTheDocument();
  });

  it('should render the download pdf button', () => {
    mockUseInvoice.mockReturnValue({ data: mockInvoice, isLoading: false });
    renderWithProviders(<InvoiceDetailPage />, {
      route: '/invoicing/11111111-1111-1111-1111-111111111111',
    });
    expect(screen.getByText('Download PDF')).toBeInTheDocument();
  });

  it('should render the workflow slot when provided', () => {
    mockUseInvoice.mockReturnValue({ data: mockInvoice, isLoading: false });
    renderWithProviders(
      <InvoiceDetailPage
        renderWorkflow={(invoice) => <div data-testid="entity-workflow">{invoice.status}</div>}
      />,
      { route: '/invoicing/11111111-1111-1111-1111-111111111111' }
    );
    expect(screen.getByTestId('entity-workflow')).toBeInTheDocument();
  });
});
