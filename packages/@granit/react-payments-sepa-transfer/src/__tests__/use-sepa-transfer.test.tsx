import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useSepaTransferConfiguration,
  useUpsertSepaTransferConfiguration,
} from '../hooks/use-sepa-transfer';
import { SepaTransferProvider } from '../providers/sepa-transfer-provider';

import type { SepaTransferConfig } from '../providers/sepa-transfer-provider';
import type { SepaTransferConfigurationResponse } from '@granit/payments-sepa-transfer';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

const sampleConfiguration: SepaTransferConfigurationResponse = {
  beneficiaryName: 'Acme NV',
  isActive: true,
  companyPartyId: 'party-1',
  beneficiaryIbanMasked: 'BE** **** **** 9999',
  beneficiaryBic: 'GEBABEBB',
  tenantId: null,
  concurrencyStamp: 'stamp-1',
};

function createWrapper(client: AxiosInstance, basePath?: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    const config: SepaTransferConfig = { client, basePath };
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <SepaTransferProvider config={config}>{children}</SepaTransferProvider>
    );
  };
}

describe('use-sepa-transfer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useSepaTransferConfiguration', () => {
    it('fetches the tenant configuration', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleConfiguration });

      const { result } = renderHook(() => useSepaTransferConfiguration(), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/sepa-transfer/configuration');
      expect(result.current.data).toEqual(sampleConfiguration);
    });

    it('uses a custom basePath', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleConfiguration });

      const { result } = renderHook(() => useSepaTransferConfiguration(), {
        wrapper: createWrapper(client, '/custom/transfer'),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/custom/transfer/configuration');
    });
  });

  describe('useUpsertSepaTransferConfiguration', () => {
    it('upserts the tenant configuration', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue({ data: sampleConfiguration });

      const { result } = renderHook(() => useUpsertSepaTransferConfiguration(), {
        wrapper: createWrapper(client),
      });

      await result.current.mutateAsync({
        beneficiaryName: 'Acme NV',
        beneficiaryIban: 'BE68539007547034',
      });

      expect(client.put).toHaveBeenCalledWith('/api/v1/sepa-transfer/configuration', {
        beneficiaryName: 'Acme NV',
        beneficiaryIban: 'BE68539007547034',
      });
    });
  });
});
