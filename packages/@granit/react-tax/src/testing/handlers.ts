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
    // GET /rates/meta — query metadata (must come before /rates/:countryCode)
    http.get(`${baseUrl}/rates/meta`, () =>
      HttpResponse.json({
        columns: [],
        filterableFields: [],
        sortableFields: [],
        presetFilterGroups: [],
        quickFilters: [],
        dateFilters: [],
        groupByFields: [],
        pagination: {
          defaultPageSize: 25,
          maxPageSize: 500,
          maxStreamSize: 1000,
          supportsCursor: true,
        },
      })
    ),

    // GET /rates — query engine list (PagedResult)
    http.get(`${baseUrl}/rates`, () =>
      HttpResponse.json({
        items: sampleTaxRates,
        totalCount: sampleTaxRates.length,
        hasMore: false,
      })
    ),

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
