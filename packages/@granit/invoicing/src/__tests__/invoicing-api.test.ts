import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  cancelInvoice,
  createInvoice,
  downloadInvoicePdf,
  finalizeInvoice,
  getInvoiceById,
  markInvoiceUncollectible,
  queryInvoices,
} from '../api/invoicing-api';

import type { FinalizeInvoiceRequest, InvoiceCreateRequest, InvoiceResponse } from '../types/index';

const sampleLineItem = {
  id: 'li-1',
  description: 'Pro plan — monthly',
  quantity: 1,
  unitPrice: 4900,
  amount: 4900,
  taxRate: 0.21,
  taxAmount: 1029,
  sourceType: 'Subscription',
  sourceId: 'sub-1',
  periodStart: '2026-03-01T00:00:00Z',
  periodEnd: '2026-04-01T00:00:00Z',
} as const;

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
  lineItems: [sampleLineItem],
};

describe('invoicing-api', () => {
  describe('queryInvoices', () => {
    it('should GET {basePath}/invoices with QE params', async () => {
      const client = createMockClient();
      const page = { items: [sampleInvoice], totalCount: 1 };
      vi.mocked(client.get).mockResolvedValue({ data: page });

      const result = await queryInvoices(client, '/invoicing');

      expect(client.get).toHaveBeenCalled();
      expect(result.items).toEqual([sampleInvoice]);
    });

    it('should work with custom basePath', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: { items: [], totalCount: 0 } });

      await queryInvoices(client, '/custom/invoicing');

      expect(client.get).toHaveBeenCalled();
    });
  });

  describe('getInvoiceById', () => {
    it('should GET {basePath}/invoices/{id}', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleInvoice });

      const result = await getInvoiceById(client, '/invoicing', 'inv-1');

      expect(client.get).toHaveBeenCalledWith('/invoicing/invoices/inv-1');
      expect(result).toEqual(sampleInvoice);
    });

    it('should encode special characters in id', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleInvoice });

      await getInvoiceById(client, '/invoicing', 'inv/special&id');

      expect(client.get).toHaveBeenCalledWith(
        `/invoicing/invoices/${encodeURIComponent('inv/special&id')}`
      );
    });
  });

  describe('downloadInvoicePdf', () => {
    it('should GET {basePath}/invoices/{id}/pdf with responseType blob', async () => {
      const client = createMockClient();
      const pdfBlob = new Blob(['%PDF-1.4'], { type: 'application/pdf' });
      vi.mocked(client.get).mockResolvedValue({ data: pdfBlob });

      const result = await downloadInvoicePdf(client, '/invoicing', 'inv-1');

      expect(client.get).toHaveBeenCalledWith('/invoicing/invoices/inv-1/pdf', {
        responseType: 'blob',
      });
      expect(result).toBe(pdfBlob);
    });

    it('should encode special characters in id', async () => {
      const client = createMockClient();
      const pdfBlob = new Blob(['%PDF-1.4'], { type: 'application/pdf' });
      vi.mocked(client.get).mockResolvedValue({ data: pdfBlob });

      await downloadInvoicePdf(client, '/invoicing', 'inv/special&id');

      expect(client.get).toHaveBeenCalledWith(
        `/invoicing/invoices/${encodeURIComponent('inv/special&id')}/pdf`,
        { responseType: 'blob' }
      );
    });
  });

  describe('createInvoice', () => {
    it('should POST {basePath}/invoices', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleInvoice });

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

      const result = await createInvoice(client, '/invoicing', request);

      expect(client.post).toHaveBeenCalledWith('/invoicing/invoices', request);
      expect(result).toEqual(sampleInvoice);
    });

    it('should create a credit note with parent reference', async () => {
      const client = createMockClient();
      const creditNote: InvoiceResponse = {
        ...sampleInvoice,
        id: 'cn-1',
        documentType: 'CreditNote',
        invoiceNumber: 'CN-2026-0001',
        parentInvoiceId: 'inv-1',
        creditNoteReason: 'Duplicate charge',
      };
      vi.mocked(client.post).mockResolvedValue({ data: creditNote });

      const request: InvoiceCreateRequest = {
        partyId: 'party-1',
        documentType: 'CreditNote',
        currency: 'EUR',
        collectionMethod: 'SendInvoice',
        billingReason: 'Manual',
        parentInvoiceId: 'inv-1',
        creditNoteReason: 'Duplicate charge',
        periodStart: null,
        periodEnd: null,
      };

      const result = await createInvoice(client, '/invoicing', request);

      expect(result.documentType).toBe('CreditNote');
      expect(result.parentInvoiceId).toBe('inv-1');
    });
  });

  describe('finalizeInvoice', () => {
    it('should POST {basePath}/invoices/{id}/finalize with body', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleInvoice });

      const request: FinalizeInvoiceRequest = {
        issuedAt: '2026-03-01T00:00:00Z',
        dueAt: '2026-03-15T00:00:00Z',
        comment: 'Issued by ops',
      };

      const result = await finalizeInvoice(client, '/invoicing', 'inv-1', request);

      expect(client.post).toHaveBeenCalledWith('/invoicing/invoices/inv-1/finalize', request);
      expect(result).toEqual(sampleInvoice);
    });

    it('should encode special characters in id', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleInvoice });

      await finalizeInvoice(client, '/invoicing', 'inv/special&id', {
        issuedAt: '2026-03-01T00:00:00Z',
        dueAt: null,
      });

      expect(client.post).toHaveBeenCalledWith(
        `/invoicing/invoices/${encodeURIComponent('inv/special&id')}/finalize`,
        expect.objectContaining({ issuedAt: '2026-03-01T00:00:00Z', dueAt: null })
      );
    });
  });

  describe('cancelInvoice', () => {
    it('should POST {basePath}/invoices/{id}/cancel with reason', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleInvoice });

      const result = await cancelInvoice(client, '/invoicing', 'inv-1', { reason: 'Duplicate' });

      expect(client.post).toHaveBeenCalledWith('/invoicing/invoices/inv-1/cancel', {
        reason: 'Duplicate',
      });
      expect(result).toEqual(sampleInvoice);
    });

    it('should POST with an empty body when no request is provided', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleInvoice });

      await cancelInvoice(client, '/invoicing', 'inv-1');

      expect(client.post).toHaveBeenCalledWith('/invoicing/invoices/inv-1/cancel', {});
    });
  });

  describe('markInvoiceUncollectible', () => {
    it('should POST {basePath}/invoices/{id}/mark-uncollectible with reason', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleInvoice });

      const result = await markInvoiceUncollectible(client, '/invoicing', 'inv-1', {
        reason: 'Bankruptcy',
      });

      expect(client.post).toHaveBeenCalledWith('/invoicing/invoices/inv-1/mark-uncollectible', {
        reason: 'Bankruptcy',
      });
      expect(result).toEqual(sampleInvoice);
    });

    it('should POST with an empty body when no request is provided', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleInvoice });

      await markInvoiceUncollectible(client, '/invoicing', 'inv-1');

      expect(client.post).toHaveBeenCalledWith('/invoicing/invoices/inv-1/mark-uncollectible', {});
    });
  });
});
