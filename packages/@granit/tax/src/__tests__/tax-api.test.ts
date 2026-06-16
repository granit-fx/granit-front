import { createMockClient } from '@granit/testing';
import { toISODateString } from '@granit/types';
import { describe, expect, it, vi } from 'vitest';

import { getTaxRateByCountry, getTaxRatesMeta, queryTaxRates, validateTaxId } from '../api/tax-api';

import type {
  TaxRateEntry,
  TaxRateResponse,
  TaxValidateRequest,
  TaxValidateResponse,
} from '../types/index';
import type { PagedResult, QueryMetadata } from '@granit/query-engine';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockValidateRequest: TaxValidateRequest = {
  taxId: 'BE0123456789',
  countryCode: 'BE',
};

const mockValidateResponse: TaxValidateResponse = {
  isValid: true,
  companyName: 'Digital Dynamics SRL',
  companyAddress: 'Rue de la Loi 1, 1000 Bruxelles',
  requestIdentifier: 'req-abc-123',
  validatedAt: toISODateString('2026-04-04T10:00:00Z'),
  source: 'VIES',
};

const mockBelgiumEntry: TaxRateEntry = {
  countryCode: 'BE',
  standardRate: 21,
  reducedRate: 6,
  superReducedRate: null,
  parkingRate: 12,
  effectiveFrom: toISODateString('2024-01-01T00:00:00Z'),
  effectiveTo: null,
};

const mockLuxembourgEntry: TaxRateEntry = {
  countryCode: 'LU',
  standardRate: 17,
  reducedRate: 8,
  superReducedRate: 3,
  parkingRate: 14,
  effectiveFrom: toISODateString('2024-01-01T00:00:00Z'),
  effectiveTo: null,
};

const mockBelgiumRate: TaxRateResponse = {
  countryCode: 'BE',
  standardRate: 21,
  reducedRate: 6,
  superReducedRate: null,
  parkingRate: 12,
  effectiveFrom: toISODateString('2024-01-01'),
  effectiveTo: null,
};

const mockLuxembourgRate: TaxRateResponse = {
  countryCode: 'LU',
  standardRate: 17,
  reducedRate: 8,
  superReducedRate: 3,
  parkingRate: 14,
  effectiveFrom: toISODateString('2024-01-01'),
  effectiveTo: null,
};

const mockPagedRates: PagedResult<TaxRateEntry> = {
  items: [mockBelgiumEntry, mockLuxembourgEntry],
  totalCount: 2,
  hasMore: false,
};

const mockMeta: QueryMetadata = {
  columns: [],
  filterableFields: [],
  sortableFields: [],
  presetFilterGroups: [],
  quickFilters: [],
  dateFilters: [],
  groupByFields: [],
  pagination: { defaultPageSize: 25, maxPageSize: 500, maxStreamSize: 1000, supportsCursor: true },
};

// ---------------------------------------------------------------------------
// validateTaxId
// ---------------------------------------------------------------------------

describe('validateTaxId', () => {
  it('should POST {basePath}/ids/validate', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue({ data: mockValidateResponse });

    const result = await validateTaxId(client, '/tax', mockValidateRequest);

    expect(client.post).toHaveBeenCalledWith('/tax/ids/validate', mockValidateRequest);
    expect(result).toEqual(mockValidateResponse);
  });

  it('should work with custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue({ data: mockValidateResponse });

    await validateTaxId(client, '/custom/tax', mockValidateRequest);

    expect(client.post).toHaveBeenCalledWith('/custom/tax/ids/validate', mockValidateRequest);
  });

  it('should return invalid validation response', async () => {
    const invalid: TaxValidateResponse = {
      isValid: false,
      companyName: null,
      companyAddress: null,
      requestIdentifier: 'req-def-456',
      validatedAt: toISODateString('2026-04-04T10:00:00Z'),
      source: 'VIES',
    };
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue({ data: invalid });

    const result = await validateTaxId(client, '/tax', mockValidateRequest);

    expect(result.isValid).toBe(false);
    expect(result.companyName).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// queryTaxRates
// ---------------------------------------------------------------------------

describe('queryTaxRates', () => {
  it('should GET {basePath}/rates and return PagedResult', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: mockPagedRates });

    const result = await queryTaxRates(client, '/tax');

    const [url] = vi.mocked(client.get).mock.calls[0]!;
    expect(url).toContain('/tax/rates');
    expect(result).toEqual(mockPagedRates);
    expect(result.items).toHaveLength(2);
  });

  it('should forward query params', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({
      data: { items: [mockBelgiumEntry], totalCount: 1, hasMore: false },
    });

    await queryTaxRates(client, '/tax', { page: 2, pageSize: 10, search: 'BE' });

    const [url] = vi.mocked(client.get).mock.calls[0]!;
    expect(url).toContain('/tax/rates');
  });

  it('should work with custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: mockPagedRates });

    await queryTaxRates(client, '/custom/tax');

    const [url] = vi.mocked(client.get).mock.calls[0]!;
    expect(url).toContain('/custom/tax/rates');
  });

  it('should return empty page when no rates', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { items: [], totalCount: 0, hasMore: false } });

    const result = await queryTaxRates(client, '/tax');

    expect(result.items).toEqual([]);
    expect(result.totalCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getTaxRatesMeta
// ---------------------------------------------------------------------------

describe('getTaxRatesMeta', () => {
  it('should GET {basePath}/rates/meta', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: mockMeta });

    const result = await getTaxRatesMeta(client, '/tax');

    const [url] = vi.mocked(client.get).mock.calls[0]!;
    expect(url).toContain('/tax/rates/meta');
    expect(result).toEqual(mockMeta);
  });

  it('should work with custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: mockMeta });

    await getTaxRatesMeta(client, '/custom/tax');

    const [url] = vi.mocked(client.get).mock.calls[0]!;
    expect(url).toContain('/custom/tax/rates/meta');
  });
});

// ---------------------------------------------------------------------------
// getTaxRateByCountry
// ---------------------------------------------------------------------------

describe('getTaxRateByCountry', () => {
  it('should GET {basePath}/rates/{countryCode}', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: mockBelgiumRate });

    const result = await getTaxRateByCountry(client, '/tax', 'BE');

    expect(client.get).toHaveBeenCalledWith('/tax/rates/BE');
    expect(result).toEqual(mockBelgiumRate);
  });

  it('should encode countryCode in URL', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: mockBelgiumRate });

    await getTaxRateByCountry(client, '/tax', 'GB/NI');

    expect(client.get).toHaveBeenCalledWith('/tax/rates/GB%2FNI');
  });

  it('should work with custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: mockLuxembourgRate });

    await getTaxRateByCountry(client, '/custom/tax', 'LU');

    expect(client.get).toHaveBeenCalledWith('/custom/tax/rates/LU');
  });
});
