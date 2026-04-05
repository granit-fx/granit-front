import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useTaxRateByCountry, useTaxRates, useValidateTaxId } from '../hooks/use-tax.js';
import { TaxProvider } from '../providers/tax-provider.js';

import type { TaxConfig } from '../providers/tax-provider.js';
import type { TaxRateResponse, TaxValidateResponse } from '@granit/tax';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWrapper(client: AxiosInstance, basePath?: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    const config: TaxConfig = { client, basePath };
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <TaxProvider config={config}>{children}</TaxProvider>
    );
  };
}

const mockValidateResponse: TaxValidateResponse = {
  isValid: true,
  companyName: 'Digital Dynamics SRL',
  companyAddress: 'Rue de la Loi 1, 1000 Bruxelles',
  requestIdentifier: 'req-abc-123',
  validatedAt: '2026-04-04T10:00:00Z',
  source: 'VIES',
};

const mockBelgiumRate: TaxRateResponse = {
  countryCode: 'BE',
  standardRate: 21,
  reducedRate: 6,
  superReducedRate: null,
  parkingRate: 12,
  effectiveFrom: '2024-01-01',
  effectiveTo: null,
};

const mockLuxembourgRate: TaxRateResponse = {
  countryCode: 'LU',
  standardRate: 17,
  reducedRate: 8,
  superReducedRate: 3,
  parkingRate: 14,
  effectiveFrom: '2024-01-01',
  effectiveTo: null,
};

// ---------------------------------------------------------------------------
// useValidateTaxId
// ---------------------------------------------------------------------------

describe('useValidateTaxId', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('validates a tax ID with default basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue({ data: mockValidateResponse });

    const { result } = renderHook(() => useValidateTaxId(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({ taxId: 'BE0123456789', countryCode: 'BE' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.post).toHaveBeenCalledWith('/api/granit/tax/validate', {
      taxId: 'BE0123456789',
      countryCode: 'BE',
    });
    expect(result.current.data).toEqual(mockValidateResponse);
  });

  it('validates a tax ID with custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue({ data: mockValidateResponse });

    const { result } = renderHook(() => useValidateTaxId(), {
      wrapper: createWrapper(client, '/custom/tax'),
    });

    result.current.mutate({ taxId: 'BE0123456789', countryCode: 'BE' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.post).toHaveBeenCalledWith('/custom/tax/validate', {
      taxId: 'BE0123456789',
      countryCode: 'BE',
    });
  });

  it('exposes error state on failure', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValue(new Error('Validation service unavailable'));

    const { result } = renderHook(() => useValidateTaxId(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({ taxId: 'INVALID', countryCode: 'XX' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Validation service unavailable');
  });
});

// ---------------------------------------------------------------------------
// useTaxRates
// ---------------------------------------------------------------------------

describe('useTaxRates', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches all tax rates with default basePath', async () => {
    const client = createMockClient();
    const rates = [mockBelgiumRate, mockLuxembourgRate];
    vi.mocked(client.get).mockResolvedValue({ data: rates });

    const { result } = renderHook(() => useTaxRates(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/granit/tax/rates');
    expect(result.current.data).toEqual(rates);
  });

  it('fetches all tax rates with custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useTaxRates(), {
      wrapper: createWrapper(client, '/custom/tax'),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/custom/tax/rates');
  });

  it('exposes error state on failure', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useTaxRates(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Network error');
  });
});

// ---------------------------------------------------------------------------
// useTaxRateByCountry
// ---------------------------------------------------------------------------

describe('useTaxRateByCountry', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches rate for a specific country', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: mockBelgiumRate });

    const { result } = renderHook(() => useTaxRateByCountry('BE'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/granit/tax/rates/BE');
    expect(result.current.data).toEqual(mockBelgiumRate);
  });

  it('fetches rate with custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: mockLuxembourgRate });

    const { result } = renderHook(() => useTaxRateByCountry('LU'), {
      wrapper: createWrapper(client, '/custom/tax'),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/custom/tax/rates/LU');
  });

  it('is disabled when countryCode is empty', () => {
    const client = createMockClient();

    const { result } = renderHook(() => useTaxRateByCountry(''), {
      wrapper: createWrapper(client),
    });

    expect(result.current.isFetching).toBe(false);
    expect(client.get).not.toHaveBeenCalled();
  });

  it('exposes error state on failure', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => useTaxRateByCountry('XX'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Not found');
  });
});
