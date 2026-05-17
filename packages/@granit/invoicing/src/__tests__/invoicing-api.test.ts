import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  createInvoice,
  downloadInvoicePdf,
  getInvoiceById,
  listInvoices,
} from '../api/invoicing-api.js';

import type { InvoiceCreateRequest, InvoiceResponse } from '../types/index.js';

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
  describe('listInvoices', () => {
    it('should GET {basePath}/invoices', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [sampleInvoice] });

      const result = await listInvoices(client, '/invoicing');

      expect(client.get).toHaveBeenCalledWith('/invoicing/invoices');
      expect(result).toEqual([sampleInvoice]);
    });

    it('should work with custom basePath', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [] });

      await listInvoices(client, '/custom/invoicing');

      expect(client.get).toHaveBeenCalledWith('/custom/invoicing/invoices');
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
});
