import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useCancelMandate,
  useConfirmMandate,
  useCreateMandate,
  useMandate,
  useSepaConfiguration,
  useUpsertSepaConfiguration,
} from '../hooks/use-sepa-direct-debit';
import { SepaDirectDebitProvider } from '../providers/sepa-direct-debit-provider';

import type { SepaDirectDebitConfig } from '../providers/sepa-direct-debit-provider';
import type {
  MandateResponse,
  MandateSetupResponse,
  SepaConfigurationResponse,
} from '@granit/payments-sepa-direct-debit';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

const sampleMandate: MandateResponse = {
  id: 'mdt-1',
  mandateReference: 'RUM-0001',
  status: 'Active',
  scheme: 'Core',
  debtorName: 'Alice Martin',
  debtorIbanMasked: 'BE** **** **** 1234',
  creditorId: 'BE68ZZZ0123456789',
  providerName: 'GoCardless',
  providerMandateId: 'MD0001',
  signedAt: toISODateString('2026-05-01T10:00:00Z'),
  activatedAt: toISODateString('2026-05-01T10:05:00Z'),
  cancelledAt: null,
  tenantId: null,
  concurrencyStamp: 'stamp-1',
};

const sampleSetup: MandateSetupResponse = {
  id: 'mdt-1',
  mandateReference: 'RUM-0001',
  status: 'Pending',
  redirectUrl: null,
};

const sampleConfiguration: SepaConfigurationResponse = {
  creditorId: 'BE68ZZZ0123456789',
  creditorName: 'Acme NV',
  defaultScheme: 'Core',
  defaultProviderName: 'GoCardless',
  isActive: true,
  companyPartyId: null,
  creditorIbanMasked: 'BE** **** **** 9999',
  creditorBic: 'GEBABEBB',
  tenantId: null,
  concurrencyStamp: 'stamp-cfg',
};

function createWrapper(client: AxiosInstance, basePath?: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    const config: SepaDirectDebitConfig = { client, basePath };
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <SepaDirectDebitProvider config={config}>{children}</SepaDirectDebitProvider>
    );
  };
}

describe('use-sepa-direct-debit', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useMandate', () => {
    it('fetches a mandate by id', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleMandate });

      const { result } = renderHook(() => useMandate('mdt-1'), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/sepa-direct-debit/mandates/mdt-1');
      expect(result.current.data).toEqual(sampleMandate);
    });

    it('is disabled for an empty id', () => {
      const client = createMockClient();

      const { result } = renderHook(() => useMandate(''), {
        wrapper: createWrapper(client),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(client.get).not.toHaveBeenCalled();
    });
  });

  describe('useSepaConfiguration', () => {
    it('fetches the tenant configuration with a custom basePath', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleConfiguration });

      const { result } = renderHook(() => useSepaConfiguration(), {
        wrapper: createWrapper(client, '/custom/sdd'),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/custom/sdd/configuration');
      expect(result.current.data).toEqual(sampleConfiguration);
    });
  });

  describe('useCreateMandate', () => {
    it('creates a mandate and returns the setup response', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleSetup });

      const { result } = renderHook(() => useCreateMandate(), {
        wrapper: createWrapper(client),
      });

      await result.current.mutateAsync({
        debtorPartyId: 'party-1',
        debtorName: 'Alice Martin',
        debtorIban: 'BE68539007547034',
      });

      expect(client.post).toHaveBeenCalledWith('/api/v1/sepa-direct-debit/mandates', {
        debtorPartyId: 'party-1',
        debtorName: 'Alice Martin',
        debtorIban: 'BE68539007547034',
      });
    });
  });

  describe('useConfirmMandate', () => {
    it('confirms a mandate with the signature payload', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleMandate });

      const { result } = renderHook(() => useConfirmMandate(), {
        wrapper: createWrapper(client),
      });

      await result.current.mutateAsync({
        id: 'mdt-1',
        request: { signedAt: toISODateString('2026-05-01T10:00:00Z') },
      });

      expect(client.post).toHaveBeenCalledWith('/api/v1/sepa-direct-debit/mandates/mdt-1/confirm', {
        signedAt: toISODateString('2026-05-01T10:00:00Z'),
      });
    });
  });

  describe('useCancelMandate', () => {
    it('cancels a mandate by id', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({
        data: { ...sampleMandate, status: 'Cancelled' },
      });

      const { result } = renderHook(() => useCancelMandate(), {
        wrapper: createWrapper(client),
      });

      const mandate = await result.current.mutateAsync('mdt-1');

      expect(client.post).toHaveBeenCalledWith('/api/v1/sepa-direct-debit/mandates/mdt-1/cancel');
      expect(mandate.status).toBe('Cancelled');
    });
  });

  describe('useUpsertSepaConfiguration', () => {
    it('upserts the tenant configuration', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue({ data: sampleConfiguration });

      const { result } = renderHook(() => useUpsertSepaConfiguration(), {
        wrapper: createWrapper(client),
      });

      await result.current.mutateAsync({
        creditorId: 'BE68ZZZ0123456789',
        defaultScheme: 'Core',
      });

      expect(client.put).toHaveBeenCalledWith('/api/v1/sepa-direct-debit/configuration', {
        creditorId: 'BE68ZZZ0123456789',
        defaultScheme: 'Core',
      });
    });
  });
});
