import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useCancelInvoice,
  useCreateInvoice,
  useDownloadInvoicePdf,
  useFinalizeInvoice,
  useInvoice,
  useInvoices,
  useMarkInvoiceUncollectible,
} from '../hooks/use-invoicing';
import { InvoicingProvider } from '../providers/invoicing-provider';

import type { InvoicingConfig } from '../providers/invoicing-provider';
import type { AxiosInstance } from '@granit/api-client';
import type {
  FinalizeInvoiceRequest,
  InvoiceCreateRequest,
  InvoiceResponse,
} from '@granit/invoicing';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWrapper(client: AxiosInstance, basePath?: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    const config: InvoicingConfig = { client, basePath };
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <InvoicingProvider config={config}>{children}</InvoicingProvider>
    );
  };
}

const sampleInvoice: InvoiceResponse = {
  id: 'inv-1',
  partyId: 'party-1',
  documentType: 'Invoice',
  invoiceNumber: 'INV-2026-0001',
  status: 'Paid',
  collectionMethod: 'ChargeAutomatically',
  billingReason: 'SubscriptionCycle',
  currency: 'EUR',
  subtotal: 4900,
  taxTotal: 1029,
  total: 5929,
  amountPaid: 5929,
  amountCredited: 0,
  amountRemaining: 0,
  parentInvoiceId: null,
  creditNoteReason: null,
  issuedAt: '2026-03-01T00:00:00Z',
  dueAt: '2026-03-15T00:00:00Z',
  paidAt: '2026-03-02T10:00:00Z',
  periodStart: '2026-03-01T00:00:00Z',
  periodEnd: '2026-04-01T00:00:00Z',
  lineItems: [],
};

const samplePage = { items: [sampleInvoice], totalCount: 1 };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useInvoices', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches invoices with default basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: samplePage });

    const { result } = renderHook(() => useInvoices(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalled();
    expect(result.current.data?.items).toEqual([sampleInvoice]);
    expect(result.current.data?.totalCount).toBe(1);
  });

  it('fetches invoices with custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { items: [], totalCount: 0 } });

    const { result } = renderHook(() => useInvoices(), {
      wrapper: createWrapper(client, '/custom/invoicing'),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalled();
  });

  it('exposes error state on failure', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useInvoices(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Network error');
  });
});

describe('useInvoice', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches a single invoice by ID', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleInvoice });

    const { result } = renderHook(() => useInvoice('inv-1'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/invoicing/invoices/inv-1');
    expect(result.current.data).toEqual(sampleInvoice);
  });

  it('is disabled when id is empty', () => {
    const client = createMockClient();

    const { result } = renderHook(() => useInvoice(''), {
      wrapper: createWrapper(client),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });
});

describe('useDownloadInvoicePdf', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('downloads a PDF blob', async () => {
    const client = createMockClient();
    const pdfBlob = new Blob(['%PDF-1.4'], { type: 'application/pdf' });
    vi.mocked(client.get).mockResolvedValue({ data: pdfBlob });

    const { result } = renderHook(() => useDownloadInvoicePdf(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate('inv-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/invoicing/invoices/inv-1/pdf', {
      responseType: 'blob',
    });
    expect(result.current.data).toBe(pdfBlob);
  });

  it('exposes error state on failure', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => useDownloadInvoicePdf(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate('inv-999');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Not found');
  });
});

describe('useCreateInvoice', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates an invoice via POST', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue({ data: sampleInvoice });

    const { result } = renderHook(() => useCreateInvoice(), {
      wrapper: createWrapper(client),
    });

    const request: InvoiceCreateRequest = {
      partyId: 'party-1',
      documentType: 'Invoice',
      currency: 'EUR',
      collectionMethod: 'ChargeAutomatically',
      billingReason: 'SubscriptionCycle',
      parentInvoiceId: null,
      creditNoteReason: null,
      periodStart: '2026-03-01T00:00:00Z',
      periodEnd: '2026-04-01T00:00:00Z',
    };

    result.current.mutate(request);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.post).toHaveBeenCalledWith('/api/v1/invoicing/invoices', request);
  });

  it('exposes error state on failure', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValue(new Error('Validation failed'));

    const { result } = renderHook(() => useCreateInvoice(), {
      wrapper: createWrapper(client),
    });

    const request: InvoiceCreateRequest = {
      partyId: 'party-1',
      documentType: 'Invoice',
      currency: 'EUR',
      collectionMethod: 'ChargeAutomatically',
      billingReason: 'Manual',
      parentInvoiceId: null,
      creditNoteReason: null,
      periodStart: null,
      periodEnd: null,
    };

    result.current.mutate(request);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Validation failed');
  });
});

describe('useFinalizeInvoice', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('finalizes an invoice via POST', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue({ data: sampleInvoice });

    const { result } = renderHook(() => useFinalizeInvoice(), {
      wrapper: createWrapper(client),
    });

    const request: FinalizeInvoiceRequest = {
      issuedAt: '2026-03-01T00:00:00Z',
      dueAt: '2026-03-15T00:00:00Z',
    };

    result.current.mutate({ id: 'inv-1', request });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.post).toHaveBeenCalledWith('/api/v1/invoicing/invoices/inv-1/finalize', request);
  });
});

describe('useCancelInvoice', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('cancels an invoice via POST with a reason', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue({ data: sampleInvoice });

    const { result } = renderHook(() => useCancelInvoice(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({ id: 'inv-1', request: { reason: 'Duplicate' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.post).toHaveBeenCalledWith('/api/v1/invoicing/invoices/inv-1/cancel', {
      reason: 'Duplicate',
    });
  });

  it('cancels an invoice via POST without a body', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue({ data: sampleInvoice });

    const { result } = renderHook(() => useCancelInvoice(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({ id: 'inv-1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.post).toHaveBeenCalledWith('/api/v1/invoicing/invoices/inv-1/cancel', {});
  });
});

describe('useMarkInvoiceUncollectible', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('marks an invoice as uncollectible via POST', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue({ data: sampleInvoice });

    const { result } = renderHook(() => useMarkInvoiceUncollectible(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({ id: 'inv-1', request: { reason: 'Bankruptcy' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.post).toHaveBeenCalledWith(
      '/api/v1/invoicing/invoices/inv-1/mark-uncollectible',
      { reason: 'Bankruptcy' }
    );
  });
});
