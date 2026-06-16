import { axiosResponse, createMockClient } from '@granit/testing';
import { toISODateString } from '@granit/types';
import { describe, expect, it, vi } from 'vitest';

import {
  cancelMandate,
  confirmMandate,
  createMandate,
  getMandate,
  getSepaConfiguration,
  upsertSepaConfiguration,
} from '../api/sepa-direct-debit-api';

import type {
  ConfirmMandateRequest,
  CreateMandateRequest,
  MandateResponse,
  MandateSetupResponse,
  SepaConfigurationRequest,
  SepaConfigurationResponse,
} from '../types/index';

const basePath = '/sepa-direct-debit';

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
  redirectUrl: 'https://pay.gocardless.com/flow/abc',
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

describe('sepa-direct-debit-api', () => {
  describe('createMandate', () => {
    it('should POST {basePath}/mandates and return the setup response', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleSetup));
      const request: CreateMandateRequest = {
        debtorPartyId: 'party-1',
        debtorName: 'Alice Martin',
        debtorIban: 'BE68539007547034',
      };

      const result = await createMandate(client, basePath, request);

      expect(client.post).toHaveBeenCalledWith(`${basePath}/mandates`, request);
      expect(result).toEqual(sampleSetup);
    });
  });

  describe('getMandate', () => {
    it('should GET {basePath}/mandates/{id}', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleMandate));

      const result = await getMandate(client, basePath, 'mdt-1');

      expect(client.get).toHaveBeenCalledWith(`${basePath}/mandates/mdt-1`);
      expect(result).toEqual(sampleMandate);
    });

    it('should encode id with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleMandate));

      await getMandate(client, basePath, 'mdt/special@id');

      expect(client.get).toHaveBeenCalledWith(
        `${basePath}/mandates/${encodeURIComponent('mdt/special@id')}`
      );
    });
  });

  describe('confirmMandate', () => {
    it('should POST {basePath}/mandates/{id}/confirm with the signature payload', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleMandate));
      const request: ConfirmMandateRequest = { signedAt: toISODateString('2026-05-01T10:00:00Z') };

      const result = await confirmMandate(client, basePath, 'mdt-1', request);

      expect(client.post).toHaveBeenCalledWith(`${basePath}/mandates/mdt-1/confirm`, request);
      expect(result).toEqual(sampleMandate);
    });
  });

  describe('cancelMandate', () => {
    it('should POST {basePath}/mandates/{id}/cancel', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue(
        axiosResponse({
          ...sampleMandate,
          status: 'Cancelled',
          cancelledAt: toISODateString('2026-06-01T00:00:00Z'),
        })
      );

      const result = await cancelMandate(client, basePath, 'mdt-1');

      expect(client.post).toHaveBeenCalledWith(`${basePath}/mandates/mdt-1/cancel`);
      expect(result.status).toBe('Cancelled');
    });
  });

  describe('getSepaConfiguration', () => {
    it('should GET {basePath}/configuration', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleConfiguration));

      const result = await getSepaConfiguration(client, basePath);

      expect(client.get).toHaveBeenCalledWith(`${basePath}/configuration`);
      expect(result).toEqual(sampleConfiguration);
    });
  });

  describe('upsertSepaConfiguration', () => {
    it('should PUT {basePath}/configuration', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue(axiosResponse(sampleConfiguration));
      const request: SepaConfigurationRequest = {
        creditorId: 'BE68ZZZ0123456789',
        defaultScheme: 'Core',
      };

      const result = await upsertSepaConfiguration(client, basePath, request);

      expect(client.put).toHaveBeenCalledWith(`${basePath}/configuration`, request);
      expect(result).toEqual(sampleConfiguration);
    });
  });
});
