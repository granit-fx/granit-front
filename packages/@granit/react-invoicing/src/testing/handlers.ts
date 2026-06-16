import {
  DATE_OPERATORS,
  ENUM_OPERATORS,
  NUMBER_OPERATORS,
  STRING_OPERATORS,
} from '@granit/query-engine';
import { createQueryMetaHandler } from '@granit/react-query-engine/testing';
import { notFound } from '@granit/testing/msw';
import { toEntityId } from '@granit/types';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import { sampleInvoices } from './data';

import type {
  CancelInvoiceRequest,
  FinalizeInvoiceRequest,
  InvoiceCreateRequest,
  InvoiceResponse,
  MarkInvoiceUncollectibleRequest,
} from '@granit/invoicing';
import type { QueryMetadata } from '@granit/query-engine';

const INVOICE_DOCUMENT_TYPES = ['Invoice', 'CreditNote'];
const INVOICE_STATUSES = ['Draft', 'Open', 'Paid', 'Cancelled', 'Uncollectible'];
const COLLECTION_METHODS = ['ChargeAutomatically', 'SendInvoice'];
const BILLING_REASONS = ['SubscriptionCreate', 'SubscriptionCycle', 'SubscriptionUpdate', 'Manual'];

/** Mock /meta payload for the invoices resource. */
export const invoiceQueryMetadata: QueryMetadata = {
  columns: [
    {
      name: 'id',
      label: 'ID',
      type: 'Guid',
      order: 0,
      isSortable: false,
      isFilterable: false,
      isVisible: false,
    },
    {
      name: 'invoiceNumber',
      label: 'Invoice number',
      type: 'String',
      order: 1,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'documentType',
      label: 'Document type',
      type: 'String',
      order: 2,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'String',
      order: 3,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'currency',
      label: 'Currency',
      type: 'String',
      order: 4,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'total',
      label: 'Total',
      type: 'Decimal',
      order: 5,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'amountRemaining',
      label: 'Remaining',
      type: 'Decimal',
      order: 6,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'collectionMethod',
      label: 'Collection method',
      type: 'String',
      order: 7,
      isSortable: false,
      isFilterable: true,
      isVisible: false,
    },
    {
      name: 'billingReason',
      label: 'Billing reason',
      type: 'String',
      order: 8,
      isSortable: false,
      isFilterable: true,
      isVisible: false,
    },
    {
      name: 'issuedAt',
      label: 'Issued at',
      type: 'DateTime',
      order: 9,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'dueAt',
      label: 'Due at',
      type: 'DateTime',
      order: 10,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'paidAt',
      label: 'Paid at',
      type: 'DateTime',
      order: 11,
      isSortable: true,
      isFilterable: true,
      isVisible: false,
    },
  ],
  filterableFields: [
    { name: 'invoiceNumber', type: 'String', operators: STRING_OPERATORS },
    {
      name: 'documentType',
      type: 'String',
      operators: ENUM_OPERATORS,
      enumValues: INVOICE_DOCUMENT_TYPES,
    },
    { name: 'status', type: 'String', operators: ENUM_OPERATORS, enumValues: INVOICE_STATUSES },
    { name: 'currency', type: 'String', operators: ENUM_OPERATORS },
    {
      name: 'collectionMethod',
      type: 'String',
      operators: ENUM_OPERATORS,
      enumValues: COLLECTION_METHODS,
    },
    {
      name: 'billingReason',
      type: 'String',
      operators: ENUM_OPERATORS,
      enumValues: BILLING_REASONS,
    },
    { name: 'total', type: 'Decimal', operators: NUMBER_OPERATORS },
    { name: 'amountRemaining', type: 'Decimal', operators: NUMBER_OPERATORS },
    { name: 'issuedAt', type: 'DateTime', operators: DATE_OPERATORS },
    { name: 'dueAt', type: 'DateTime', operators: DATE_OPERATORS },
    { name: 'paidAt', type: 'DateTime', operators: DATE_OPERATORS },
  ],
  sortableFields: [
    { name: 'invoiceNumber' },
    { name: 'status' },
    { name: 'total' },
    { name: 'amountRemaining' },
    { name: 'issuedAt' },
    { name: 'dueAt' },
    { name: 'paidAt' },
  ],
  presetFilterGroups: [],
  quickFilters: [
    { name: 'open', label: 'Open', isDefault: true },
    { name: 'overdue', label: 'Overdue', isDefault: false },
    { name: 'paid', label: 'Paid', isDefault: false },
  ],
  dateFilters: [
    {
      name: 'issuedAt',
      defaultPeriod: 'ThisMonth',
      availablePeriods: [
        'Today',
        'ThisWeek',
        'ThisMonth',
        'LastMonth',
        'ThisQuarter',
        'ThisYear',
        'Custom',
      ],
    },
  ],
  groupByFields: [
    { name: 'status', type: 'String' },
    { name: 'documentType', type: 'String' },
    { name: 'currency', type: 'String' },
  ],
  pagination: {
    defaultPageSize: 25,
    maxPageSize: 100,
    maxStreamSize: 50_000,
    supportsCursor: false,
  },
  defaultSort: '-issuedAt',
};

/**
 * Create stateful MSW handlers for invoicing endpoints.
 * New invoices created via POST are appended to the in-memory list.
 *
 * @param baseUrl - API base path (default: `/api/v1/invoicing`)
 */
export function createInvoicingHandlers(baseUrl = DEFAULT_BASE_PATH) {
  return [
    // GET /invoices/meta — query metadata
    createQueryMetaHandler(`${baseUrl}/invoices`, invoiceQueryMetadata),

    // GET list all invoices (Query Engine — returns PagedResult)
    http.get(`${baseUrl}/invoices`, () => {
      return HttpResponse.json({ items: sampleInvoices, totalCount: sampleInvoices.length });
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
        partyId: body.partyId,
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

    // POST finalize invoice (Draft → Open)
    http.post(`${baseUrl}/invoices/:id/finalize`, async ({ params, request }) => {
      const invoice = sampleInvoices.find((inv) => inv.id === params.id);
      if (!invoice) return notFound();
      if (invoice.status !== 'Draft') {
        return HttpResponse.json(
          { detail: `Cannot finalize invoice in status '${invoice.status}'.` },
          { status: 409 }
        );
      }

      const body = (await request.json()) as FinalizeInvoiceRequest;
      const updated: InvoiceResponse = {
        ...invoice,
        status: 'Open',
        issuedAt: body.issuedAt,
        dueAt: body.dueAt,
      };
      replaceInvoice(updated);
      return HttpResponse.json(updated);
    }),

    // POST cancel invoice
    http.post(`${baseUrl}/invoices/:id/cancel`, async ({ params, request }) => {
      const invoice = sampleInvoices.find((inv) => inv.id === params.id);
      if (!invoice) return notFound();
      if (invoice.status !== 'Open' && invoice.status !== 'Uncollectible') {
        return HttpResponse.json(
          { detail: `Cannot cancel invoice in status '${invoice.status}'.` },
          { status: 409 }
        );
      }

      // Body is optional; consume if present so the mock surface matches the real endpoint.
      await readOptionalJson<CancelInvoiceRequest>(request);

      const updated: InvoiceResponse = { ...invoice, status: 'Cancelled' };
      replaceInvoice(updated);
      return HttpResponse.json(updated);
    }),

    // POST mark invoice uncollectible
    http.post(`${baseUrl}/invoices/:id/mark-uncollectible`, async ({ params, request }) => {
      const invoice = sampleInvoices.find((inv) => inv.id === params.id);
      if (!invoice) return notFound();
      if (invoice.status !== 'Open') {
        return HttpResponse.json(
          { detail: `Cannot mark invoice in status '${invoice.status}' as uncollectible.` },
          { status: 409 }
        );
      }

      await readOptionalJson<MarkInvoiceUncollectibleRequest>(request);

      const updated: InvoiceResponse = { ...invoice, status: 'Uncollectible' };
      replaceInvoice(updated);
      return HttpResponse.json(updated);
    }),
  ];
}

function replaceInvoice(updated: InvoiceResponse): void {
  const idx = sampleInvoices.findIndex((inv) => inv.id === updated.id);
  if (idx >= 0) sampleInvoices[idx] = updated;
}

async function readOptionalJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
