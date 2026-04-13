import type { TaxRateResponse, TaxValidateRequest, TaxValidateResponse } from '../types.js';
import type { AxiosInstance } from 'axios';

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
 * Fetch all available tax rates.
 *
 * `GET {basePath}/rates`
 */
export async function getTaxRates(
  client: AxiosInstance,
  basePath: string
): Promise<readonly TaxRateResponse[]> {
  const response = await client.get<readonly TaxRateResponse[]>(`${basePath}/rates`);
  return response.data;
}

/**
 * Fetch the tax rate for a specific country.
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
