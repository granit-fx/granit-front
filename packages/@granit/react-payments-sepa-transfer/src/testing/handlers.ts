import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import { sampleConfiguration } from './data';

import type { SepaTransferConfigurationRequest } from '@granit/payments-sepa-transfer';

/**
 * Create MSW handlers for the SEPA bank transfer endpoints: the per-tenant
 * beneficiary configuration (read + upsert).
 *
 * @param baseUrl - API base path (default: `/api/v1/sepa-transfer`)
 */
export function createSepaTransferHandlers(baseUrl = DEFAULT_BASE_PATH) {
  return [
    // GET /configuration — tenant SEPA transfer configuration
    http.get(`${baseUrl}/configuration`, () => {
      return HttpResponse.json(sampleConfiguration);
    }),

    // PUT /configuration — upsert tenant SEPA transfer configuration.
    // The raw IBAN is never echoed back; the response carries only the masked form.
    http.put(`${baseUrl}/configuration`, async ({ request }) => {
      const body = (await request.json()) as SepaTransferConfigurationRequest;
      return HttpResponse.json({
        ...sampleConfiguration,
        beneficiaryName: body.beneficiaryName ?? sampleConfiguration.beneficiaryName,
        isActive: body.isActive ?? sampleConfiguration.isActive,
        beneficiaryBic: body.beneficiaryBic ?? sampleConfiguration.beneficiaryBic,
      });
    }),
  ];
}
