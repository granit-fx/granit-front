import { getTaxRateByCountry, getTaxRates, validateTaxId } from '@granit/tax';
import { useMutation, useQuery } from '@tanstack/react-query';

import { buildTaxQueryKey, useTaxConfig } from '../providers/tax-provider.js';

import type { TaxRateResponse, TaxValidateRequest, TaxValidateResponse } from '@granit/tax';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/**
 * Validate a tax ID via the tax service.
 *
 * Returns a mutation — call `mutate(request)` or `mutateAsync(request)`.
 *
 * @example
 * ```tsx
 * const validate = useValidateTaxId();
 * validate.mutate({ taxId: 'BE0123456789', countryCode: 'BE' });
 * ```
 */
export function useValidateTaxId(): UseMutationResult<
  TaxValidateResponse,
  Error,
  TaxValidateRequest
> {
  const config = useTaxConfig();
  const basePath = config.basePath!;

  return useMutation({
    mutationFn: (request: TaxValidateRequest) => validateTaxId(config.client, basePath, request),
  });
}

/**
 * Fetch all available tax rates.
 *
 * @example
 * ```tsx
 * const { data: rates } = useTaxRates();
 * ```
 */
export function useTaxRates(): UseQueryResult<readonly TaxRateResponse[]> {
  const config = useTaxConfig();
  const basePath = config.basePath!;

  return useQuery({
    queryKey: buildTaxQueryKey(config, 'rates'),
    queryFn: () => getTaxRates(config.client, basePath),
  });
}

/**
 * Fetch the tax rate for a specific country.
 *
 * The query is disabled when `countryCode` is an empty string.
 *
 * @example
 * ```tsx
 * const { data: rate } = useTaxRateByCountry('BE');
 * ```
 */
export function useTaxRateByCountry(countryCode: string): UseQueryResult<TaxRateResponse> {
  const config = useTaxConfig();
  const basePath = config.basePath!;

  return useQuery({
    queryKey: buildTaxQueryKey(config, 'rates', countryCode),
    queryFn: () => getTaxRateByCountry(config.client, basePath, countryCode),
    enabled: countryCode.length > 0,
  });
}
