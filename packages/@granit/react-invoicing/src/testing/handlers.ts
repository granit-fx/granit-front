import { notFound } from '@granit/testing/msw';
import { toEntityId } from '@granit/types';
import { http, HttpResponse } from 'msw';

import { sampleInvoices } from './data.js';

import type { InvoiceCreateRequest } from '@granit/invoicing';

/**
 * Create stateful MSW handlers for invoicing endpoints.
 * New invoices created via POST are appended to the in-memory list.
 *
 * @param baseUrl - API base path (default: `/api/v1/granit/invoicing`)
 */
export function createInvoicingHandlers(baseUrl = '/api/v1/granit/invoicing') {
  return [
    // GET list all invoices
    http.get(`${baseUrl}/invoices`, () => {
      return HttpResponse.json(sampleInvoices);
    }),

    // GET single invoice by ID
    http.get(`${baseUrl}/invoices/:id`, ({ params }) => {
      const invoice = sampleInvoices.find((inv) => inv.id === params.id);
      if (!invoice) return notFound();
      return HttpResponse.json(invoice);
    }),

    // POST create invoice
    http.post(`${baseUrl}/invoices`, async ({ request }) => {
      const body = (await request.json()) as InvoiceCreateRequest;

      const newInvoice = {
        id: toEntityId<'Invoice'>(`inv_${String(sampleInvoices.length + 1).padStart(3, '0')}`),
        invoiceNumber: `INV-2026-${String(sampleInvoices.length + 1).padStart(4, '0')}`,
        status: 'Draft' as const,
        documentType: body.documentType ?? 'Invoice',
        currency: body.currency ?? 'EUR',
        subtotal: 0,
        taxTotal: 0,
        total: 0,
        amountPaid: 0,
        amountCredited: 0,
        amountRemaining: 0,
        parentInvoiceId: null,
        creditNoteReason: null,
        issuedAt: null,
        dueAt: null,
        paidAt: null,
        periodStart: null,
        periodEnd: null,
        collectionMethod: body.collectionMethod ?? 'ChargeAutomatically',
        billingReason: body.billingReason ?? 'Manual',
        lineItems: [],
      };

      sampleInvoices.push(newInvoice);
      return HttpResponse.json(newInvoice, { status: 201 });
    }),

    // GET invoice PDF
    http.get(`${baseUrl}/invoices/:id/pdf`, () => {
      const pdfContent = new Uint8Array([37, 80, 68, 70]); // %PDF magic bytes
      return new HttpResponse(pdfContent, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="invoice.pdf"',
        },
      });
    }),
  ];
}
