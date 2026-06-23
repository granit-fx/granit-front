import { screen, waitFor } from '@testing-library/react';

import { InvoiceDetailPage } from '../invoice-detail-page';
import { InvoiceListPage } from '../invoice-list-page';

import { renderWithProviders } from './test-utils';

import type { InvoiceResponse } from '@granit/invoicing';

// ---------------------------------------------------------------------------
// Mocks — exercise the navigation handlers the page tests stub away.
// ---------------------------------------------------------------------------

const { mockNavigate, mockUseParams } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockUseParams: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: mockUseParams,
  };
});

const { mockUseInvoices, mockUseInvoice } = vi.hoisted(() => ({
  mockUseInvoices: vi.fn(),
  mockUseInvoice: vi.fn(),
}));

vi.mock('@granit/react-invoicing', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useInvoices: mockUseInvoices,
    useInvoice: mockUseInvoice,
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

vi.mock('@granit/react-analytics', () => ({
  KpiTile: () => <div data-testid="kpi-tile" />,
}));

vi.mock('../components/create-invoice-dialog', () => ({
  CreateInvoiceDialog: ({ open }: { readonly open: boolean }) => (
    <div data-testid="create-invoice-dialog" data-open={String(open)} />
  ),
}));

vi.mock('../components/download-pdf-button', () => ({
  DownloadPdfButton: () => <button type="button">Download PDF</button>,
}));

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
};

afterEach(() => vi.clearAllMocks());

describe('InvoiceListPage navigation', () => {
  beforeEach(() => {
    mockUseInvoices.mockReturnValue({
      data: { items: [mockInvoice], totalCount: 1 },
      isLoading: false,
    });
  });

  it('should open the create dialog when the create button is clicked', async () => {
    const { user } = renderWithProviders(<InvoiceListPage />);
    expect(screen.getByTestId('create-invoice-dialog')).toHaveAttribute('data-open', 'false');
    await user.click(screen.getByRole('button', { name: 'Create Invoice' }));
    await waitFor(() => {
      expect(screen.getByTestId('create-invoice-dialog')).toHaveAttribute('data-open', 'true');
    });
  });

  it('should navigate to the detail route when a row action is clicked', async () => {
    const { user } = renderWithProviders(<InvoiceListPage />);
    await user.click(await screen.findByRole('button', { name: 'View Details' }));
    expect(mockNavigate).toHaveBeenCalledWith(`/invoicing/${mockInvoice.id}`);
  });
});

describe('InvoiceDetailPage navigation', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: mockInvoice.id });
  });

  it('should navigate back to the list from the not-found state', async () => {
    mockUseInvoice.mockReturnValue({ data: undefined, isLoading: false });
    const { user } = renderWithProviders(<InvoiceDetailPage />, {
      route: `/invoicing/${mockInvoice.id}`,
    });
    await user.click(screen.getByRole('button', { name: 'Back to list' }));
    expect(mockNavigate).toHaveBeenCalledWith('/invoicing');
  });

  it('should navigate back to the list from the detail header', async () => {
    mockUseInvoice.mockReturnValue({ data: mockInvoice, isLoading: false });
    const { user } = renderWithProviders(<InvoiceDetailPage />, {
      route: `/invoicing/${mockInvoice.id}`,
    });
    await user.click(screen.getByRole('button', { name: 'Back to list' }));
    expect(mockNavigate).toHaveBeenCalledWith('/invoicing');
  });
});
