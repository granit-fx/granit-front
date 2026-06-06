import { getTaxRateByCountry, getTaxRatesMeta, queryTaxRates, validateTaxId } from '@granit/tax';
import { useMutation, useQuery } from '@tanstack/react-query';

import { buildTaxQueryKey, useTaxConfig } from '../providers/tax-provider';

import type { PagedResult, QueryMetadata, QueryRequest } from '@granit/query-engine';
import type {
  TaxRateEntry,
  TaxRateResponse,
  TaxValidateRequest,
  TaxValidateResponse,
} from '@granit/tax';
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
 * Query tax rates with filtering, sorting, and pagination (Query Engine).
 *
 * @example
 * ```tsx
 * const { data } = useTaxRates();
 * const rows = data?.items ?? [];
 * ```
 */
export function useTaxRates(request: QueryRequest = {}): UseQueryResult<PagedResult<TaxRateEntry>> {
  const config = useTaxConfig();
  const basePath = config.basePath!;

  return useQuery({
    queryKey: [...buildTaxQueryKey(config, 'rates', 'list'), request],
    queryFn: () => queryTaxRates(config.client, basePath, request),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch query metadata for tax rates (columns, filters, sorts, presets).
 *
 * Metadata is stable — cached indefinitely until the page is refreshed.
 *
 * @example
 * ```tsx
 * const { data: meta } = useTaxRatesMeta();
 * ```
 */
export function useTaxRatesMeta(): UseQueryResult<QueryMetadata> {
  const config = useTaxConfig();
  const basePath = config.basePath!;

  return useQuery({
    queryKey: buildTaxQueryKey(config, 'rates', 'meta'),
    queryFn: () => getTaxRatesMeta(config.client, basePath),
    staleTime: Infinity,
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
    staleTime: 5 * 60 * 1000,
  });
}
