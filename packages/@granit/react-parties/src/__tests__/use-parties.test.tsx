import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { toEntityId } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useActivatePartyMutation,
  useAddPartyAddressMutation,
  useAddPartyEmailMutation,
  useAddPartyExternalMappingMutation,
  useAddPartyPhoneMutation,
  useAddPartyRoleMutation,
  useArchivePartyMutation,
  useClearPartyTaxStatusMutation,
  useCreatePartyMutation,
  usePartiesQuery,
  usePartyQuery,
  useRemovePartyAddressMutation,
  useRemovePartyEmailMutation,
  useRemovePartyExternalMappingMutation,
  useRemovePartyPhoneMutation,
  useRemovePartyRoleMutation,
  useReplacePartyMetadataMutation,
  useSetPartyTaxStatusMutation,
  useSuspendPartyMutation,
  useUpdatePartyMutation,
} from '../hooks/use-parties.js';
import { PartiesProvider } from '../providers/parties-provider.js';

import type { PartiesConfig } from '../providers/parties-provider.js';
import type {
  PartyAddressId,
  PartyAddressRequest,
  PartyCreateRequest,
  PartyEmailId,
  PartyEmailRequest,
  PartyExternalMappingRequest,
  PartyId,
  PartyListItemResponse,
  PartyMetadataRequest,
  PartyPhoneId,
  PartyPhoneRequest,
  PartyResponse,
  PartyTaxStatusRequest,
  PartyUpdateRequest,
} from '@granit/parties';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

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
  parentContactId: null,
  userId: null,
  avatarBlobId: null,
  roles: 'Customer',
  status: 'Active',
  addresses: [],
  emails: [],
  phones: [],
  externalMappings: [],
  taxStatus: { isExempt: false, reverseCharge: false, vatin: null, evidenceBlobId: null },
  metadata: {},
  internalNotes: null,
};

function createWrapper(client: AxiosInstance, basePath?: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    const config: PartiesConfig = { client, basePath };
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <PartiesProvider config={config}>{children}</PartiesProvider>
    );
  };
}

describe('use-parties', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('usePartiesQuery', () => {
    it('lists parties without role filter', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [sampleListItem] });

      const { result } = renderHook(() => usePartiesQuery(), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/parties', { params: undefined });
      expect(result.current.data).toEqual([sampleListItem]);
    });

    it('passes role as query param', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [] });

      const { result } = renderHook(() => usePartiesQuery({ role: 'Customer' }), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isFetched).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/parties', {
        params: { role: 'Customer' },
      });
    });

    it('uses custom basePath', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [] });

      const { result } = renderHook(() => usePartiesQuery(), {
        wrapper: createWrapper(client, '/custom/parties'),
      });

      await waitFor(() => expect(result.current.isFetched).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/custom/parties', { params: undefined });
    });
  });

  describe('usePartyQuery', () => {
    it('fetches a party by id', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleParty });

      const { result } = renderHook(() => usePartyQuery(partyId), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith(`/api/v1/parties/${partyId}`);
      expect(result.current.data).toEqual(sampleParty);
    });

    it('does not fetch when id is null', () => {
      const client = createMockClient();
      const { result } = renderHook(() => usePartyQuery(null), {
        wrapper: createWrapper(client),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(client.get).not.toHaveBeenCalled();
    });
  });

  describe('useCreatePartyMutation', () => {
    it('POSTs and invalidates the list query', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleParty });

      const request: PartyCreateRequest = {
        kind: 'Company',
        name: 'Acme',
        defaultCurrency: 'EUR',
      };

      const { result } = renderHook(() => useCreatePartyMutation(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({ request });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith('/api/v1/parties', request, {
        params: undefined,
        headers: undefined,
      });
    });

    it('forwards force + skipDuplicateCheck options to the request', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleParty });

      const request: PartyCreateRequest = {
        kind: 'Company',
        name: 'Acme',
        defaultCurrency: 'EUR',
      };

      const { result } = renderHook(() => useCreatePartyMutation(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({
        request,
        options: { force: true, skipDuplicateCheck: true },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith('/api/v1/parties', request, {
        params: { force: true },
        headers: { 'X-Skip-Duplicate-Check': 'true' },
      });
    });
  });

  describe('useUpdatePartyMutation', () => {
    it('PATCHes the party', async () => {
      const client = createMockClient();
      vi.mocked(client.patch).mockResolvedValue({ data: sampleParty });

      const request: PartyUpdateRequest = { name: 'Acme Intl' };

      const { result } = renderHook(() => useUpdatePartyMutation(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({ id: partyId, request });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.patch).toHaveBeenCalledWith(`/api/v1/parties/${partyId}`, request);
    });
  });

  describe('lifecycle mutations', () => {
    it('suspends', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: undefined });

      const { result } = renderHook(() => useSuspendPartyMutation(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({ id: partyId, request: { reason: 'overdue' } });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith(`/api/v1/parties/${partyId}/suspend`, {
        reason: 'overdue',
      });
    });

    it('activates', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: undefined });

      const { result } = renderHook(() => useActivatePartyMutation(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate(partyId);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith(`/api/v1/parties/${partyId}/activate`);
    });

    it('archives', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: undefined });

      const { result } = renderHook(() => useArchivePartyMutation(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate(partyId);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith(`/api/v1/parties/${partyId}/archive`);
    });
  });

  describe('useAddPartyAddressMutation', () => {
    it('POSTs the address', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleParty });

      const request: PartyAddressRequest = {
        kind: 'Billing',
        line1: '1 rue',
        city: 'Paris',
        postalCode: '75001',
        country: 'FR',
      };

      const { result } = renderHook(() => useAddPartyAddressMutation(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({ id: partyId, request });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith(`/api/v1/parties/${partyId}/addresses`, request);
    });
  });

  describe('tax status mutations', () => {
    it('PUTs the tax status', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue({ data: sampleParty });

      const request: PartyTaxStatusRequest = {
        isExempt: false,
        reverseCharge: true,
        vatin: 'BE0123456789',
      };

      const { result } = renderHook(() => useSetPartyTaxStatusMutation(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({ id: partyId, request });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.put).toHaveBeenCalledWith(`/api/v1/parties/${partyId}/tax-status`, request);
    });

    it('DELETEs to clear the tax status', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue({ data: sampleParty });

      const { result } = renderHook(() => useClearPartyTaxStatusMutation(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate(partyId);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.delete).toHaveBeenCalledWith(`/api/v1/parties/${partyId}/tax-status`);
    });
  });

  describe('address mutations', () => {
    it('removes an address', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue({ data: undefined });

      const addressId = toEntityId<'PartyAddress'>('a1') as PartyAddressId;
      const { result } = renderHook(() => useRemovePartyAddressMutation(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({ id: partyId, addressId });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.delete).toHaveBeenCalledWith(
        `/api/v1/parties/${partyId}/addresses/${addressId}`
      );
    });
  });

  describe('email mutations', () => {
    it('adds an email', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleParty });

      const request: PartyEmailRequest = { address: 'a@b.test', isPrimary: true };
      const { result } = renderHook(() => useAddPartyEmailMutation(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({ id: partyId, request });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith(`/api/v1/parties/${partyId}/emails`, request);
    });

    it('removes an email', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue({ data: undefined });

      const emailId = toEntityId<'PartyEmail'>('e1') as PartyEmailId;
      const { result } = renderHook(() => useRemovePartyEmailMutation(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({ id: partyId, emailId });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.delete).toHaveBeenCalledWith(`/api/v1/parties/${partyId}/emails/${emailId}`);
    });
  });

  describe('phone mutations', () => {
    it('adds a phone', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleParty });

      const request: PartyPhoneRequest = { kind: 'Mobile', number: '+32123' };
      const { result } = renderHook(() => useAddPartyPhoneMutation(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({ id: partyId, request });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith(`/api/v1/parties/${partyId}/phones`, request);
    });

    it('removes a phone', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue({ data: undefined });

      const phoneId = toEntityId<'PartyPhone'>('p1') as PartyPhoneId;
      const { result } = renderHook(() => useRemovePartyPhoneMutation(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({ id: partyId, phoneId });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.delete).toHaveBeenCalledWith(`/api/v1/parties/${partyId}/phones/${phoneId}`);
    });
  });

  describe('external-mapping mutations', () => {
    it('adds an external mapping', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleParty });

      const request: PartyExternalMappingRequest = {
        providerName: 'stripe',
        externalId: 'cus_123',
      };
      const { result } = renderHook(() => useAddPartyExternalMappingMutation(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({ id: partyId, request });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith(
        `/api/v1/parties/${partyId}/external-mappings`,
        request
      );
    });

    it('removes an external mapping by provider name', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue({ data: undefined });

      const { result } = renderHook(() => useRemovePartyExternalMappingMutation(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({ id: partyId, providerName: 'stripe' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.delete).toHaveBeenCalledWith(
        `/api/v1/parties/${partyId}/external-mappings/stripe`
      );
    });
  });

  describe('role mutations', () => {
    it('adds a role flag', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: undefined });

      const { result } = renderHook(() => useAddPartyRoleMutation(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({ id: partyId, request: { role: 'Customer' } });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith(`/api/v1/parties/${partyId}/roles`, {
        role: 'Customer',
      });
    });

    it('removes a role flag', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue({ data: undefined });

      const { result } = renderHook(() => useRemovePartyRoleMutation(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({ id: partyId, role: 'Supplier' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.delete).toHaveBeenCalledWith(`/api/v1/parties/${partyId}/roles/Supplier`);
    });
  });

  describe('useReplacePartyMetadataMutation', () => {
    it('PUTs the metadata replace request', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue({ data: sampleParty });

      const request: PartyMetadataRequest = {
        metadata: { segment: 'enterprise', tier: 'gold' },
      };

      const { result } = renderHook(() => useReplacePartyMetadataMutation(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({ id: partyId, request });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.put).toHaveBeenCalledWith(`/api/v1/parties/${partyId}/metadata`, request);
    });
  });
});
