import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  getSepaTransferConfiguration,
  upsertSepaTransferConfiguration,
} from '../api/sepa-transfer-api';

import type {
  SepaTransferConfigurationRequest,
  SepaTransferConfigurationResponse,
} from '../types/index';

const basePath = '/sepa-transfer';

const sampleConfiguration: SepaTransferConfigurationResponse = {
  beneficiaryName: 'Acme NV',
  isActive: true,
  companyPartyId: 'party-1',
  beneficiaryIbanMasked: 'BE** **** **** 9999',
  beneficiaryBic: 'GEBABEBB',
  tenantId: null,
  concurrencyStamp: 'stamp-1',
};

describe('sepa-transfer-api', () => {
  describe('getSepaTransferConfiguration', () => {
    it('should GET {basePath}/configuration', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleConfiguration));

      const result = await getSepaTransferConfiguration(client, basePath);

      expect(client.get).toHaveBeenCalledWith(`${basePath}/configuration`);
      expect(result).toEqual(sampleConfiguration);
    });
  });

  describe('upsertSepaTransferConfiguration', () => {
    it('should PUT {basePath}/configuration', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue(axiosResponse(sampleConfiguration));
      const request: SepaTransferConfigurationRequest = {
        beneficiaryName: 'Acme NV',
        beneficiaryIban: 'BE68539007547034',
      };

      const result = await upsertSepaTransferConfiguration(client, basePath, request);

      expect(client.put).toHaveBeenCalledWith(`${basePath}/configuration`, request);
      expect(result).toEqual(sampleConfiguration);
    });
  });
});
