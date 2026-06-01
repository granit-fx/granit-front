import { notFound } from '@granit/testing/msw';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import { sampleTaxRates, sampleValidation } from './data';

/**
 * Create MSW handlers for tax rate and VAT validation endpoints.
 *
 * @param baseUrl - API base path (default: `/api/v1/tax`)
 */
export function createTaxHandlers(baseUrl = DEFAULT_BASE_PATH) {
  return [
    // GET /rates — all rates
    http.get(`${baseUrl}/rates`, () => HttpResponse.json(sampleTaxRates)),

    // GET /rates/:countryCode — single rate by country
    http.get(`${baseUrl}/rates/:countryCode`, ({ params }) => {
      const rate = sampleTaxRates.find(
        (r) => r.countryCode === (params.countryCode as string).toUpperCase()
      );
      if (!rate) return notFound();
      return HttpResponse.json(rate);
    }),

    // POST /ids/validate — validate a VAT number
    http.post(`${baseUrl}/ids/validate`, () => HttpResponse.json(sampleValidation)),
  ];
}
