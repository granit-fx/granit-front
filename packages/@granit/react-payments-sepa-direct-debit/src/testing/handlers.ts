import { DATE_OPERATORS, ENUM_OPERATORS, STRING_OPERATORS } from '@granit/query-engine';
import { createQueryMetaHandler } from '@granit/react-query-engine/testing';
import { created, notFound } from '@granit/testing/msw';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import { sampleConfiguration, sampleMandates } from './data';

import type {
  ConfirmMandateRequest,
  CreateMandateRequest,
  MandateSetupResponse,
} from '@granit/payments-sepa-direct-debit';
import type { QueryMetadata } from '@granit/query-engine';

const MANDATE_STATUSES = ['Pending', 'Active', 'Suspended', 'Cancelled', 'Failed', 'Expired'];
const MANDATE_SCHEMES = ['Core', 'B2B'];

/** Mock `/meta` payload for the mandate query-engine grid. */
export const mandateQueryMetadata: QueryMetadata = {
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
      name: 'mandateReference',
      label: 'Reference',
      type: 'String',
      order: 1,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'String',
      order: 2,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'scheme',
      label: 'Scheme',
      type: 'String',
      order: 3,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'debtorName',
      label: 'Debtor',
      type: 'String',
      order: 4,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'creditorId',
      label: 'Creditor ID',
      type: 'String',
      order: 5,
      isSortable: false,
      isFilterable: true,
      isVisible: false,
    },
    {
      name: 'signedAt',
      label: 'Signed at',
      type: 'DateTime',
      order: 6,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'activatedAt',
      label: 'Activated at',
      type: 'DateTime',
      order: 7,
      isSortable: true,
      isFilterable: true,
      isVisible: false,
    },
  ],
  filterableFields: [
    { name: 'mandateReference', type: 'String', operators: STRING_OPERATORS },
    { name: 'status', type: 'String', operators: ENUM_OPERATORS, enumValues: MANDATE_STATUSES },
    { name: 'scheme', type: 'String', operators: ENUM_OPERATORS, enumValues: MANDATE_SCHEMES },
    { name: 'debtorName', type: 'String', operators: STRING_OPERATORS },
    { name: 'creditorId', type: 'String', operators: STRING_OPERATORS },
    { name: 'signedAt', type: 'DateTime', operators: DATE_OPERATORS },
    { name: 'activatedAt', type: 'DateTime', operators: DATE_OPERATORS },
  ],
  sortableFields: [
    { name: 'mandateReference' },
    { name: 'status' },
    { name: 'scheme' },
    { name: 'debtorName' },
    { name: 'signedAt' },
    { name: 'activatedAt' },
  ],
  presetFilterGroups: [],
  quickFilters: [
    { name: 'active', label: 'Active', isDefault: false },
    { name: 'pending', label: 'Pending', isDefault: false },
  ],
  dateFilters: [
    {
      name: 'signedAt',
      defaultPeriod: 'ThisYear',
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
    { name: 'scheme', type: 'String' },
  ],
  pagination: {
    defaultPageSize: 25,
    maxPageSize: 100,
    maxStreamSize: 50_000,
    supportsCursor: false,
  },
  defaultSort: '-signedAt',
};

/**
 * Create stateful MSW handlers for SEPA Direct Debit endpoints: the mandate
 * query-engine grid (`/mandates/meta`), single-mandate read, mandate lifecycle
 * (create / confirm / cancel), and the per-tenant configuration.
 *
 * @param baseUrl - API base path (default: `/api/v1/sepa-direct-debit`)
 */
export function createSepaDirectDebitHandlers(baseUrl = DEFAULT_BASE_PATH) {
  return [
    // GET /mandates/meta — query metadata for the admin grid
    createQueryMetaHandler(`${baseUrl}/mandates`, mandateQueryMetadata),

    // GET single mandate by ID
    http.get(`${baseUrl}/mandates/:id`, ({ params }) => {
      const mandate = sampleMandates.find((m) => m.id === params.id);
      if (!mandate) return notFound();
      return HttpResponse.json(mandate);
    }),

    // POST /mandates — set up a mandate → 201 Created
    http.post(`${baseUrl}/mandates`, async ({ request }) => {
      const body = (await request.json()) as CreateMandateRequest;
      const setup: MandateSetupResponse = {
        id: `mdt_mock_${String(sampleMandates.length + 1).padStart(2, '0')}`,
        mandateReference: `RUM-MOCK-${String(sampleMandates.length + 1).padStart(7, '0')}`,
        status: 'Pending',
        redirectUrl: body.redirectUrl ?? null,
      };
      return created(setup);
    }),

    // POST /mandates/:id/confirm — activate a pending mandate
    http.post(`${baseUrl}/mandates/:id/confirm`, async ({ params, request }) => {
      const mandate = sampleMandates.find((m) => m.id === params.id);
      if (!mandate) return notFound();
      const body = (await request.json()) as ConfirmMandateRequest;
      return HttpResponse.json({
        ...mandate,
        status: 'Active',
        signedAt: body.signedAt,
        activatedAt: body.signedAt,
      });
    }),

    // POST /mandates/:id/cancel — revoke a mandate
    http.post(`${baseUrl}/mandates/:id/cancel`, ({ params }) => {
      const mandate = sampleMandates.find((m) => m.id === params.id);
      if (!mandate) return notFound();
      return HttpResponse.json({
        ...mandate,
        status: 'Cancelled',
        cancelledAt: '2026-06-15T00:00:00Z',
      });
    }),

    // GET /configuration — tenant SEPA configuration
    http.get(`${baseUrl}/configuration`, () => {
      return HttpResponse.json(sampleConfiguration);
    }),

    // PUT /configuration — upsert tenant SEPA configuration
    http.put(`${baseUrl}/configuration`, async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json({ ...sampleConfiguration, ...body });
    }),
  ];
}
