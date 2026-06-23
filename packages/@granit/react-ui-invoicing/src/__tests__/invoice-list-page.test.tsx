import { screen, waitFor } from '@testing-library/react';
import * as React from 'react';

import { InvoiceListPage } from '../invoice-list-page';

import { renderWithProviders } from './test-utils';

import type { InvoiceResponse } from '@granit/invoicing';

// ---------------------------------------------------------------------------
// Mock data — amounts in minor units, ISO 8601 dates
// ---------------------------------------------------------------------------

const mockInvoices: InvoiceResponse[] = [
  {
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
    amountPaid: 0,
    amountCredited: 0,
    amountRemaining: 12100,
    parentInvoiceId: null,
    creditNoteReason: null,
    issuedAt: '2026-01-15T10:00:00.000Z',
    dueAt: '2026-02-15T00:00:00.000Z',
    paidAt: null,
    periodStart: null,
    periodEnd: null,
    lineItems: [],
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    partyId: '99999999-9999-9999-9999-999999999999',
    documentType: 'Invoice',
    invoiceNumber: 'INV-2026-0002',
    status: 'Paid',
    collectionMethod: 'ChargeAutomatically',
    billingReason: 'SubscriptionCycle',
    currency: 'USD',
    subtotal: 5000,
    taxTotal: 0,
    total: 5000,
    amountPaid: 5000,
    amountCredited: 0,
    amountRemaining: 0,
    parentInvoiceId: null,
    creditNoteReason: null,
    issuedAt: '2026-03-01T08:30:00.000Z',
    dueAt: '2026-03-31T00:00:00.000Z',
    paidAt: '2026-03-10T12:00:00.000Z',
    periodStart: null,
    periodEnd: null,
    lineItems: [],
  },
];

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { mockUseInvoices } = vi.hoisted(() => ({
  mockUseInvoices: vi.fn(),
}));

vi.mock('@granit/react-invoicing', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useInvoices: mockUseInvoices,
  };
});

vi.mock('@granit/react-localization', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useDateFormatter: () => ({
      formatDate: (d: string) => d,
      formatDateTime: (d: string) => d,
      formatTimeAgo: (d: string) => d,
    }),
  };
});

// KpiTile pulls in the dashboards/analytics runtime — stub it out.
vi.mock('@granit/react-analytics', () => ({
  KpiTile: () => <div data-testid="kpi-tile" />,
}));

// CreateInvoiceDialog brings in form/mutation machinery irrelevant to the list.
vi.mock('../components/create-invoice-dialog', () => ({
  CreateInvoiceDialog: () => <div data-testid="create-invoice-dialog" />,
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('InvoiceListPage', () => {
  afterEach(() => vi.clearAllMocks());

  it('should render the page title and subtitle', async () => {
    mockUseInvoices.mockReturnValue({
      data: { items: mockInvoices, totalCount: mockInvoices.length },
      isLoading: false,
    });
    renderWithProviders(<InvoiceListPage />);
    await waitFor(() => {
      expect(screen.getByText('Invoicing')).toBeInTheDocument();
    });
    expect(screen.getByText('Manage invoices')).toBeInTheDocument();
  });

  it('should have the correct data-slot', () => {
    mockUseInvoices.mockReturnValue({
      data: { items: mockInvoices, totalCount: mockInvoices.length },
      isLoading: false,
    });
    renderWithProviders(<InvoiceListPage />);
    expect(document.querySelector('[data-slot="invoice-list-page"]')).toBeInTheDocument();
  });

  it('should render the create button', () => {
    mockUseInvoices.mockReturnValue({
      data: { items: mockInvoices, totalCount: mockInvoices.length },
      isLoading: false,
    });
    renderWithProviders(<InvoiceListPage />);
    expect(screen.getByRole('button', { name: 'Create Invoice' })).toBeInTheDocument();
  });

  it('should render the column headers', async () => {
    mockUseInvoices.mockReturnValue({
      data: { items: mockInvoices, totalCount: mockInvoices.length },
      isLoading: false,
    });
    renderWithProviders(<InvoiceListPage />);
    await waitFor(() => {
      expect(screen.getByText('Invoice Number')).toBeInTheDocument();
    });
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Currency')).toBeInTheDocument();
    expect(screen.getByText('Due Date')).toBeInTheDocument();
    expect(screen.getByText('Issued At')).toBeInTheDocument();
  });

  it('should render a row per invoice', async () => {
    mockUseInvoices.mockReturnValue({
      data: { items: mockInvoices, totalCount: mockInvoices.length },
      isLoading: false,
    });
    renderWithProviders(<InvoiceListPage />);
    await waitFor(() => {
      expect(screen.getByText('INV-2026-0001')).toBeInTheDocument();
    });
    expect(screen.getByText('INV-2026-0002')).toBeInTheDocument();
    // status badges render the raw status text
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
  });

  it('should render the empty state when there are no invoices', async () => {
    mockUseInvoices.mockReturnValue({
      data: { items: [], totalCount: 0 },
      isLoading: false,
    });
    renderWithProviders(<InvoiceListPage />);
    await waitFor(() => {
      expect(screen.getByText('No invoices found')).toBeInTheDocument();
    });
    expect(screen.queryByText('INV-2026-0001')).not.toBeInTheDocument();
  });

  it('should render loading skeletons while invoices load', () => {
    mockUseInvoices.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<InvoiceListPage />);
    // Table rows are not rendered during loading.
    expect(screen.queryByText('Invoice Number')).not.toBeInTheDocument();
    expect(screen.queryByText('No invoices found')).not.toBeInTheDocument();
  });
});
