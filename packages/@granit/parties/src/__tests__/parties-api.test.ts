import { createMockClient } from '@granit/testing';
import { toEntityId, toISODateString } from '@granit/types';
import { describe, expect, it, vi } from 'vitest';

import {
  activateParty,
  addPartyAddress,
  addPartyEmail,
  addPartyExternalMapping,
  addPartyPhone,
  addPartyRole,
  archiveParty,
  clearPartyTaxStatus,
  confirmPartyAddress,
  createParty,
  downloadPartyVCard,
  getPartyById,
  listParties,
  mergeParty,
  previewPartyMerge,
  removePartyAddress,
  removePartyEmail,
  removePartyExternalMapping,
  removePartyPhone,
  removePartyRole,
  replacePartyMetadata,
  setPartyTaxStatus,
  suspendParty,
  updateParty,
} from '../api/parties-api';

import type {
  PartyAddressConfirmRequest,
  PartyAddressId,
  PartyAddressRequest,
  PartyCreateRequest,
  PartyEmailId,
  PartyEmailRequest,
  PartyExternalMappingRequest,
  PartyId,
  PartyListItemResponse,
  PartyMergeRequest,
  PartyMergeResponse,
  PartyMetadataRequest,
  PartyPhoneId,
  PartyPhoneRequest,
  PartyResponse,
  PartyTaxStatusRequest,
  PartyUpdateRequest,
} from '../types/index';

const basePath = '/api/v1/parties';
const partyId: PartyId = toEntityId<'Party'>('00000000-0000-0000-0000-000000000001');

const sampleListItem: PartyListItemResponse = {
  id: partyId,
  tenantId: null,
  kind: 'Company',
  name: 'Acme Corp',
  roles: 'Customer',
  status: 'Active',
  defaultCurrency: 'EUR',
  primaryEmail: 'billing@acme.example',
  primaryPhone: null,
};

const sampleParty: PartyResponse = {
  id: partyId,
  tenantId: null,
  kind: 'Company',
  name: 'Acme Corp',
  defaultCurrency: 'EUR',
  timezone: 'UTC',
  language: null,
  website: null,
  taxId: null,
  registrationNumber: null,
  parentPartyId: null,
  userId: null,
  avatar: null,
  roles: 'Customer',
  status: 'Active',
  addresses: [],
  emails: [],
  phones: [],
  externalMappings: [],
  taxStatus: { isExempt: false, reverseCharge: false, vatin: null, evidenceBlobId: null },
  metadata: {},
  internalNotes: null,
  createdAt: toISODateString('2026-01-01T00:00:00Z'),
  modifiedAt: null,
};

describe('parties-api', () => {
  describe('listParties', () => {
    it('GETs {basePath} without role filter', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: { items: [sampleListItem] } });

      const result = await listParties(client, basePath);

      expect(client.get).toHaveBeenCalledWith(basePath, { params: { pageSize: 100 } });
      expect(result).toEqual([sampleListItem]);
    });

    it('unwraps the paged envelope returned by MapGranitQuery', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({
        data: { items: [sampleListItem], totalCount: 1, hasMore: false },
      });

      const result = await listParties(client, basePath);

      expect(result).toEqual([sampleListItem]);
    });

    it('translates a role filter to the query-engine filter contract', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: { items: [] } });

      await listParties(client, basePath, { role: 'Customer' });

      expect(client.get).toHaveBeenCalledWith(basePath, {
        params: { pageSize: 100, 'filter[roles.Eq]': 'Customer' },
      });
    });
  });

  describe('getPartyById', () => {
    it('GETs {basePath}/{id}', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleParty });

      const result = await getPartyById(client, basePath, partyId);

      expect(client.get).toHaveBeenCalledWith(`${basePath}/${partyId}`);
      expect(result).toEqual(sampleParty);
    });
  });

  describe('createParty', () => {
    it('POSTs the create request to {basePath}', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleParty });

      const request: PartyCreateRequest = {
        kind: 'Company',
        name: 'Acme Corp',
        defaultCurrency: 'EUR',
      };

      const result = await createParty(client, basePath, request);

      expect(client.post).toHaveBeenCalledWith(basePath, request, {
        params: undefined,
        headers: undefined,
      });
      expect(result).toEqual(sampleParty);
    });

    it('forwards force=true as a query-string flag', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleParty });

      const request: PartyCreateRequest = {
        kind: 'Company',
        name: 'Acme Corp',
        defaultCurrency: 'EUR',
      };

      await createParty(client, basePath, request, { force: true });

      expect(client.post).toHaveBeenCalledWith(basePath, request, {
        params: { force: true },
        headers: undefined,
      });
    });

    it('forwards skipDuplicateCheck as the X-Skip-Duplicate-Check header', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleParty });

      const request: PartyCreateRequest = {
        kind: 'Company',
        name: 'Acme Corp',
        defaultCurrency: 'EUR',
      };

      await createParty(client, basePath, request, { skipDuplicateCheck: true });

      expect(client.post).toHaveBeenCalledWith(basePath, request, {
        params: undefined,
        headers: { 'X-Skip-Duplicate-Check': 'true' },
      });
    });
  });

  describe('updateParty', () => {
    it('PATCHes {basePath}/{id} with the update request', async () => {
      const client = createMockClient();
      vi.mocked(client.patch).mockResolvedValue({ data: sampleParty });

      const request: PartyUpdateRequest = { name: 'Acme International' };

      await updateParty(client, basePath, partyId, request);

      expect(client.patch).toHaveBeenCalledWith(`${basePath}/${partyId}`, request);
    });
  });

  describe('lifecycle', () => {
    it('suspends with optional reason', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: undefined });

      await suspendParty(client, basePath, partyId, { reason: 'overdue' });

      expect(client.post).toHaveBeenCalledWith(`${basePath}/${partyId}/suspend`, {
        reason: 'overdue',
      });
    });

    it('suspends with empty body when no request supplied', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: undefined });

      await suspendParty(client, basePath, partyId);

      expect(client.post).toHaveBeenCalledWith(`${basePath}/${partyId}/suspend`, {});
    });

    it('activates', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: undefined });

      await activateParty(client, basePath, partyId);

      expect(client.post).toHaveBeenCalledWith(`${basePath}/${partyId}/activate`);
    });

    it('archives', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: undefined });

      await archiveParty(client, basePath, partyId);

      expect(client.post).toHaveBeenCalledWith(`${basePath}/${partyId}/archive`);
    });
  });

  describe('addresses', () => {
    it('POSTs the address request', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleParty });

      const request: PartyAddressRequest = {
        kind: 'Billing',
        street1: '1 rue de la Paix',
        city: 'Paris',
        postalCode: '75001',
        country: 'FR',
      };

      await addPartyAddress(client, basePath, partyId, request);

      expect(client.post).toHaveBeenCalledWith(`${basePath}/${partyId}/addresses`, request);
    });

    it('DELETEs the address by id', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue({ data: undefined });

      const addressId: PartyAddressId = toEntityId<'PartyAddress'>('addr-1');

      await removePartyAddress(client, basePath, partyId, addressId);

      expect(client.delete).toHaveBeenCalledWith(`${basePath}/${partyId}/addresses/${addressId}`);
    });

    it('POSTs a confirmation with evidence and returns the refreshed party', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleParty });

      const addressId: PartyAddressId = toEntityId<'PartyAddress'>('addr-1');
      const request: PartyAddressConfirmRequest = { evidence: 'Returned mail check' };

      const result = await confirmPartyAddress(client, basePath, partyId, addressId, request);

      expect(client.post).toHaveBeenCalledWith(
        `${basePath}/${partyId}/addresses/${addressId}/confirm`,
        request
      );
      expect(result).toEqual(sampleParty);
    });

    it('POSTs an empty body when no evidence is supplied', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleParty });

      const addressId: PartyAddressId = toEntityId<'PartyAddress'>('addr-1');

      await confirmPartyAddress(client, basePath, partyId, addressId);

      expect(client.post).toHaveBeenCalledWith(
        `${basePath}/${partyId}/addresses/${addressId}/confirm`,
        {}
      );
    });
  });

  describe('emails', () => {
    it('POSTs the email request', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleParty });

      const request: PartyEmailRequest = { address: 'a@b.com', isPrimary: true };

      await addPartyEmail(client, basePath, partyId, request);

      expect(client.post).toHaveBeenCalledWith(`${basePath}/${partyId}/emails`, request);
    });

    it('DELETEs the email by id', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue({ data: undefined });

      const emailId: PartyEmailId = toEntityId<'PartyEmail'>('email-1');

      await removePartyEmail(client, basePath, partyId, emailId);

      expect(client.delete).toHaveBeenCalledWith(`${basePath}/${partyId}/emails/${emailId}`);
    });
  });

  describe('phones', () => {
    it('POSTs the phone request', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleParty });

      const request: PartyPhoneRequest = { kind: 'Mobile', number: '+33600000000' };

      await addPartyPhone(client, basePath, partyId, request);

      expect(client.post).toHaveBeenCalledWith(`${basePath}/${partyId}/phones`, request);
    });

    it('DELETEs the phone by id', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue({ data: undefined });

      const phoneId: PartyPhoneId = toEntityId<'PartyPhone'>('phone-1');

      await removePartyPhone(client, basePath, partyId, phoneId);

      expect(client.delete).toHaveBeenCalledWith(`${basePath}/${partyId}/phones/${phoneId}`);
    });
  });

  describe('external mappings', () => {
    it('POSTs the external mapping request', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleParty });

      const request: PartyExternalMappingRequest = {
        providerName: 'stripe',
        externalId: 'cus_123',
      };

      await addPartyExternalMapping(client, basePath, partyId, request);

      expect(client.post).toHaveBeenCalledWith(`${basePath}/${partyId}/external-mappings`, request);
    });

    it('DELETEs the external mapping by provider name (URL-encoded)', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue({ data: undefined });

      await removePartyExternalMapping(client, basePath, partyId, 'odoo prod');

      expect(client.delete).toHaveBeenCalledWith(
        `${basePath}/${partyId}/external-mappings/odoo%20prod`
      );
    });
  });

  describe('roles', () => {
    it('POSTs a role to add', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: undefined });

      await addPartyRole(client, basePath, partyId, { role: 'Supplier' });

      expect(client.post).toHaveBeenCalledWith(`${basePath}/${partyId}/roles`, {
        role: 'Supplier',
      });
    });

    it('DELETEs a role flag by name', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue({ data: undefined });

      await removePartyRole(client, basePath, partyId, 'Supplier');

      expect(client.delete).toHaveBeenCalledWith(`${basePath}/${partyId}/roles/Supplier`);
    });
  });

  describe('tax status', () => {
    it('PUTs the tax-status request', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue({ data: sampleParty });

      const request: PartyTaxStatusRequest = {
        isExempt: false,
        reverseCharge: true,
        vatin: 'BE0123456789',
        evidenceBlobId: null,
      };

      await setPartyTaxStatus(client, basePath, partyId, request);

      expect(client.put).toHaveBeenCalledWith(`${basePath}/${partyId}/tax-status`, request);
    });

    it('DELETEs the tax-status to clear it', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue({ data: sampleParty });

      const result = await clearPartyTaxStatus(client, basePath, partyId);

      expect(client.delete).toHaveBeenCalledWith(`${basePath}/${partyId}/tax-status`);
      expect(result).toEqual(sampleParty);
    });
  });

  describe('metadata', () => {
    it('PUTs the metadata replace request', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue({ data: sampleParty });

      const request: PartyMetadataRequest = {
        metadata: { segment: 'enterprise', tier: 'gold' },
      };

      const result = await replacePartyMetadata(client, basePath, partyId, request);

      expect(client.put).toHaveBeenCalledWith(`${basePath}/${partyId}/metadata`, request);
      expect(result).toEqual(sampleParty);
    });

    it('PUTs an empty metadata to clear all entries', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue({ data: sampleParty });

      await replacePartyMetadata(client, basePath, partyId, { metadata: {} });

      expect(client.put).toHaveBeenCalledWith(`${basePath}/${partyId}/metadata`, {
        metadata: {},
      });
    });
  });

  describe('vCard', () => {
    it('GETs the vCard as a Blob', async () => {
      const client = createMockClient();
      const blob = new Blob(['BEGIN:VCARD'], { type: 'text/vcard; charset=utf-8' });
      vi.mocked(client.get).mockResolvedValue({ data: blob });

      const result = await downloadPartyVCard(client, basePath, partyId);

      expect(client.get).toHaveBeenCalledWith(`${basePath}/${partyId}/vcard`, {
        responseType: 'blob',
      });
      expect(result).toBe(blob);
    });
  });

  describe('merge', () => {
    const loserId: PartyId = toEntityId<'Party'>('00000000-0000-0000-0000-000000000002');
    const sampleMergeResponse: PartyMergeResponse = {
      survivorId: partyId,
      loserId,
      conflicts: [
        {
          fieldPath: 'Name',
          survivorValue: 'Acme S',
          loserValue: 'Acme L',
          default: 'Survivor',
        },
      ],
      rewriteCounts: { 'Invoice.PartyId': 17, 'Subscription.PartyId': 3 },
      dryRun: true,
    };

    it('GETs the merge preview with loserId as a query param', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleMergeResponse });

      const result = await previewPartyMerge(client, basePath, partyId, loserId);

      expect(client.get).toHaveBeenCalledWith(`${basePath}/${partyId}/merge/preview`, {
        params: { loserId },
      });
      expect(result).toEqual(sampleMergeResponse);
    });

    it('POSTs the merge request without an Idempotency-Key by default', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({
        data: { ...sampleMergeResponse, dryRun: false },
      });

      const request: PartyMergeRequest = {
        loserId,
        choices: { Name: 'Survivor', TaxStatus: 'Loser' },
        reason: 'Doublon créé par sync ERP',
        dryRun: false,
      };

      await mergeParty(client, basePath, partyId, request);

      expect(client.post).toHaveBeenCalledWith(`${basePath}/${partyId}/merge`, request, undefined);
    });

    it('POSTs the merge request with an Idempotency-Key header when provided', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({
        data: { ...sampleMergeResponse, dryRun: false },
      });

      const idempotencyKey = '11111111-2222-4333-8444-555555555555';
      const request: PartyMergeRequest = { loserId };

      await mergeParty(client, basePath, partyId, request, idempotencyKey);

      expect(client.post).toHaveBeenCalledWith(`${basePath}/${partyId}/merge`, request, {
        headers: { 'Idempotency-Key': idempotencyKey },
      });
    });

    it('passes through dryRun=true on the merge endpoint for re-validation', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleMergeResponse });

      const request: PartyMergeRequest = { loserId, dryRun: true };

      const result = await mergeParty(client, basePath, partyId, request, 'idem-1');

      expect(client.post).toHaveBeenCalledWith(`${basePath}/${partyId}/merge`, request, {
        headers: { 'Idempotency-Key': 'idem-1' },
      });
      expect(result.dryRun).toBe(true);
    });
  });
});
