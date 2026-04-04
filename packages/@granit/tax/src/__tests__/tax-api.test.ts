import { createMockClient } from '@granit/testing';
import { toISODateString } from '@granit/types';
import { describe, expect, it, vi } from 'vitest';

import { getTaxRateByCountry, getTaxRates, validateTaxId } from '../api/tax-api.js';

import type { TaxRateResponse, TaxValidateRequest, TaxValidateResponse } from '../types.js';

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

// ---------------------------------------------------------------------------
// validateTaxId
// ---------------------------------------------------------------------------

describe('validateTaxId', () => {
  it('should POST {basePath}/validate', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue({ data: mockValidateResponse });

    const result = await validateTaxId(client, '/api/granit/tax', mockValidateRequest);

    expect(client.post).toHaveBeenCalledWith('/api/granit/tax/validate', mockValidateRequest);
    expect(result).toEqual(mockValidateResponse);
  });

  it('should work with custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue({ data: mockValidateResponse });

    await validateTaxId(client, '/custom/tax', mockValidateRequest);

    expect(client.post).toHaveBeenCalledWith('/custom/tax/validate', mockValidateRequest);
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

    const result = await validateTaxId(client, '/api/granit/tax', mockValidateRequest);

    expect(result.isValid).toBe(false);
    expect(result.companyName).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getTaxRates
// ---------------------------------------------------------------------------

describe('getTaxRates', () => {
  it('should GET {basePath}/rates', async () => {
    const client = createMockClient();
    const rates = [mockBelgiumRate, mockLuxembourgRate];
    vi.mocked(client.get).mockResolvedValue({ data: rates });

    const result = await getTaxRates(client, '/api/granit/tax');

    expect(client.get).toHaveBeenCalledWith('/api/granit/tax/rates');
    expect(result).toEqual(rates);
    expect(result).toHaveLength(2);
  });

  it('should work with custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [] });

    await getTaxRates(client, '/custom/tax');

    expect(client.get).toHaveBeenCalledWith('/custom/tax/rates');
  });

  it('should return empty array when no rates', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [] });

    const result = await getTaxRates(client, '/api/granit/tax');

    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getTaxRateByCountry
// ---------------------------------------------------------------------------

describe('getTaxRateByCountry', () => {
  it('should GET {basePath}/rates/{countryCode}', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: mockBelgiumRate });

    const result = await getTaxRateByCountry(client, '/api/granit/tax', 'BE');

    expect(client.get).toHaveBeenCalledWith('/api/granit/tax/rates/BE');
    expect(result).toEqual(mockBelgiumRate);
  });

  it('should encode countryCode in URL', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: mockBelgiumRate });

    await getTaxRateByCountry(client, '/api/granit/tax', 'GB/NI');

    expect(client.get).toHaveBeenCalledWith('/api/granit/tax/rates/GB%2FNI');
  });

  it('should work with custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: mockLuxembourgRate });

    await getTaxRateByCountry(client, '/custom/tax', 'LU');

    expect(client.get).toHaveBeenCalledWith('/custom/tax/rates/LU');
  });
});
