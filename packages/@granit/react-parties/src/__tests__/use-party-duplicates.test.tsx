import { createTestQueryClient } from '@granit/react-testing';
import { axiosResponse, createMockClient } from '@granit/testing';
import { toEntityId, toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useDismissPartyDuplicateMutation,
  useMergePartyFromDuplicateMutation,
  usePartyDuplicateCandidatesForPartyQuery,
} from '../hooks/use-party-duplicates';
import { PartiesProvider } from '../providers/parties-provider';

import type { PartiesConfig } from '../providers/parties-provider';
import type {
  PartyDuplicateCandidateId,
  PartyDuplicateCandidateResponse,
  PartyId,
  PartyMergeResponse,
} from '@granit/parties';
import type { QueryClient } from '@tanstack/react-query';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

const partyA: PartyId = toEntityId<'Party'>('00000000-0000-0000-0000-000000000001');
const partyB: PartyId = toEntityId<'Party'>('00000000-0000-0000-0000-000000000002');
const dupId: PartyDuplicateCandidateId = toEntityId<'PartyDuplicateCandidate'>('dup-001');

const candidate: PartyDuplicateCandidateResponse = {
  id: dupId,
  partyId: partyA,
  candidateId: partyB,
  score: 0.92,
  tier: 'Deterministic',
  signals: [{ kind: 'TaxIdEqual', score: 1.0 }],
  dismissedAt: null,
  createdAt: toISODateString('2026-04-26T08:00:00Z'),
  updatedAt: null,
};

function makeWrapper(client: AxiosInstance, queryClient: QueryClient = createTestQueryClient()) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const config: PartiesConfig = { client };
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <PartiesProvider config={config}>{children}</PartiesProvider>
    );
  };
}

describe('usePartyDuplicateCandidatesForPartyQuery', () => {
  afterEach(() => vi.restoreAllMocks());

  it('GETs the per-party candidates endpoint', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([candidate]));

    const { result } = renderHook(() => usePartyDuplicateCandidatesForPartyQuery(partyA), {
      wrapper: makeWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith(`/api/v1/parties/${partyA}/duplicate-candidates`);
    expect(result.current.data).toEqual([candidate]);
  });

  it('does not fetch when partyId is null', () => {
    const client = createMockClient();
    const { result } = renderHook(() => usePartyDuplicateCandidatesForPartyQuery(null), {
      wrapper: makeWrapper(client),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });
});

describe('useDismissPartyDuplicateMutation', () => {
  afterEach(() => vi.restoreAllMocks());

  it('POSTs the dismiss endpoint and invalidates the duplicates cache', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(undefined));

    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDismissPartyDuplicateMutation(), {
      wrapper: makeWrapper(client, queryClient),
    });

    result.current.mutate({ id: dupId });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.post).toHaveBeenCalledWith(`/api/v1/parties/duplicates/${dupId}/dismiss`);

    const invalidatedKeys = invalidateSpy.mock.calls.map(
      ([filters]) => filters?.queryKey as readonly unknown[]
    );
    expect(invalidatedKeys).toContainEqual(['parties', 'duplicates']);
  });
});

describe('useMergePartyFromDuplicateMutation', () => {
  afterEach(() => vi.restoreAllMocks());

  const mergeResponse: PartyMergeResponse = {
    survivorId: partyA,
    loserId: partyB,
    conflicts: [],
    rewriteCounts: { 'Invoice.PartyId': 5 },
    dryRun: false,
  };

  it('POSTs with auto-generated Idempotency-Key and invalidates duplicates + parties caches', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(mergeResponse));

    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useMergePartyFromDuplicateMutation(), {
      wrapper: makeWrapper(client, queryClient),
    });

    result.current.mutate({
      id: dupId,
      request: { survivorId: partyA, reason: 'Confirmed by ops review' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const call = vi.mocked(client.post).mock.calls[0]!;
    expect(call[0]).toBe(`/api/v1/parties/duplicates/${dupId}/merge`);
    expect(call[1]).toEqual({ survivorId: partyA, reason: 'Confirmed by ops review' });
    expect(call[2]).toMatchObject({
      headers: expect.objectContaining({
        'Idempotency-Key': expect.stringMatching(/^[0-9a-f-]{36}$/i),
      }),
    });

    const invalidatedKeys = invalidateSpy.mock.calls.map(
      ([filters]) => filters?.queryKey as readonly unknown[]
    );
    expect(invalidatedKeys).toContainEqual(['parties', 'duplicates']);
    expect(invalidatedKeys).toContainEqual(['parties', 'list']);
    expect(invalidatedKeys).toContainEqual(['parties', 'detail', partyA]);
    expect(invalidatedKeys).toContainEqual(['parties', 'detail', partyB]);
  });

  it('falls back to a Math.random UUID when crypto.randomUUID is unavailable', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(mergeResponse));

    const originalRandomUUID = globalThis.crypto.randomUUID;
    Object.defineProperty(globalThis.crypto, 'randomUUID', {
      configurable: true,
      writable: true,
      value: undefined,
    });

    try {
      const { result } = renderHook(() => useMergePartyFromDuplicateMutation(), {
        wrapper: makeWrapper(client),
      });

      result.current.mutate({ id: dupId, request: { survivorId: partyA } });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const call = vi.mocked(client.post).mock.calls[0]!;
      const idempotencyKey = (call[2] as { headers: { 'Idempotency-Key': string } }).headers[
        'Idempotency-Key'
      ];
      expect(idempotencyKey).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    } finally {
      Object.defineProperty(globalThis.crypto, 'randomUUID', {
        configurable: true,
        writable: true,
        value: originalRandomUUID,
      });
    }
  });

  it('uses an explicit idempotencyKey when supplied', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(mergeResponse));

    const { result } = renderHook(() => useMergePartyFromDuplicateMutation(), {
      wrapper: makeWrapper(client),
    });

    const explicitKey = '11111111-2222-4333-8444-555555555555';
    result.current.mutate({
      id: dupId,
      request: { survivorId: partyA },
      idempotencyKey: explicitKey,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.post).toHaveBeenCalledWith(
      `/api/v1/parties/duplicates/${dupId}/merge`,
      { survivorId: partyA },
      { headers: { 'Idempotency-Key': explicitKey } }
    );
  });
});
