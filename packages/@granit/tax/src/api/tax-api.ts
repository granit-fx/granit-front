import { getPage, getQueryMeta } from '@granit/query-engine';

import type {
  TaxRateEntry,
  TaxRateResponse,
  TaxValidateRequest,
  TaxValidateResponse,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';
import type { PagedResult, QueryMetadata, QueryRequest } from '@granit/query-engine';

/**
 * Validate a tax ID (e.g. VAT number) against the configured tax service.
 *
 * `POST {basePath}/ids/validate`
 */
export async function validateTaxId(
  client: AxiosInstance,
  basePath: string,
  request: TaxValidateRequest
): Promise<TaxValidateResponse> {
  const response = await client.post<TaxValidateResponse>(`${basePath}/ids/validate`, request);
  return response.data;
}

/**
 * Query tax rates with filtering, sorting, and pagination (Query Engine).
 *
 * `GET {basePath}/rates`
 */
export async function queryTaxRates(
  client: AxiosInstance,
  basePath: string,
  request: QueryRequest = {}
): Promise<PagedResult<TaxRateEntry>> {
  return getPage<TaxRateEntry>(client, `${basePath}/rates`, request);
}

/**
 * Get query metadata for tax rates (columns, filters, sorts, presets).
 *
 * `GET {basePath}/rates/meta`
 */
export async function getTaxRatesMeta(
  client: AxiosInstance,
  basePath: string
): Promise<QueryMetadata> {
  return getQueryMeta(client, `${basePath}/rates`);
}

/**
 * Get the tax rate for a specific country.
 *
 * `GET {basePath}/rates/{countryCode}`
 */
export async function getTaxRateByCountry(
  client: AxiosInstance,
  basePath: string,
  countryCode: string
): Promise<TaxRateResponse> {
  const response = await client.get<TaxRateResponse>(
    `${basePath}/rates/${encodeURIComponent(countryCode)}`
  );
  return response.data;
}
