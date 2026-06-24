import { sampleInvoices } from '@granit/react-invoicing/testing';
import { screen, waitFor } from '@testing-library/react';
import * as React from 'react';

import { InvoiceListPage } from '../invoice-list-page';

import { renderWithProviders } from './test-utils';

// ---------------------------------------------------------------------------
// Shared fixtures from @granit/react-invoicing/testing — sampleInvoices[0] is
// INV-2026-0001 (Paid), [1] is INV-2026-0002 (Open).
// ---------------------------------------------------------------------------

const mockInvoices = sampleInvoices;

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { mockUseInvoiceQuery } = vi.hoisted(() => ({
  mockUseInvoiceQuery: vi.fn(),
}));

// Build the query-engine surface returned by useInvoiceQuery (UseQueryEndpointReturn).
function queryEndpoint(data: unknown, isLoading: boolean) {
  return {
    query: { data, isLoading },
    params: {},
    setPage: vi.fn(),
    setPageSize: vi.fn(),
  };
}

vi.mock('@granit/react-invoicing', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useInvoiceQuery: mockUseInvoiceQuery,
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
    mockUseInvoiceQuery.mockReturnValue(
      queryEndpoint({ items: mockInvoices, totalCount: mockInvoices.length }, false)
    );
    renderWithProviders(<InvoiceListPage />);
    await waitFor(() => {
      expect(screen.getByText('Invoicing')).toBeInTheDocument();
    });
    expect(screen.getByText('Manage invoices')).toBeInTheDocument();
  });

  it('should have the correct data-slot', () => {
    mockUseInvoiceQuery.mockReturnValue(
      queryEndpoint({ items: mockInvoices, totalCount: mockInvoices.length }, false)
    );
    renderWithProviders(<InvoiceListPage />);
    expect(document.querySelector('[data-slot="invoice-list-page"]')).toBeInTheDocument();
  });

  it('should render the create button', () => {
    mockUseInvoiceQuery.mockReturnValue(
      queryEndpoint({ items: mockInvoices, totalCount: mockInvoices.length }, false)
    );
    renderWithProviders(<InvoiceListPage />);
    expect(screen.getByRole('button', { name: 'Create Invoice' })).toBeInTheDocument();
  });

  it('should render the column headers', async () => {
    mockUseInvoiceQuery.mockReturnValue(
      queryEndpoint({ items: mockInvoices, totalCount: mockInvoices.length }, false)
    );
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
    mockUseInvoiceQuery.mockReturnValue(
      queryEndpoint({ items: mockInvoices, totalCount: mockInvoices.length }, false)
    );
    renderWithProviders(<InvoiceListPage />);
    await waitFor(() => {
      expect(screen.getByText('INV-2026-0001')).toBeInTheDocument();
    });
    expect(screen.getByText('INV-2026-0002')).toBeInTheDocument();
    // status badges render the raw status text
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
  });

  it('should render the query grid with no data rows when there are no invoices', async () => {
    mockUseInvoiceQuery.mockReturnValue(queryEndpoint({ items: [], totalCount: 0 }, false));
    renderWithProviders(<InvoiceListPage />);
    // The admin-kit grid still renders (with its own empty state); no invoice rows.
    await waitFor(() => {
      expect(document.querySelector('[data-slot="invoice-table"]')).toBeInTheDocument();
    });
    expect(screen.queryByText('INV-2026-0001')).not.toBeInTheDocument();
  });

  it('should render loading skeletons while invoices load', () => {
    mockUseInvoiceQuery.mockReturnValue(queryEndpoint(undefined, true));
    renderWithProviders(<InvoiceListPage />);
    // The grid is not rendered during loading — skeletons take its place.
    expect(screen.queryByText('Invoice Number')).not.toBeInTheDocument();
    expect(document.querySelector('[data-slot="invoice-table"]')).not.toBeInTheDocument();
  });
});
