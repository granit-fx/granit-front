import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { toEntityId } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useMergePartyMutation, useMergePartyPreviewQuery } from '../hooks/use-party-merge';
import { PartiesProvider } from '../providers/parties-provider';

import type { PartiesConfig } from '../providers/parties-provider';
import type { PartyId, PartyMergeRequest, PartyMergeResponse } from '@granit/parties';
import type { QueryClient } from '@tanstack/react-query';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

const survivorId: PartyId = toEntityId<'Party'>('00000000-0000-0000-0000-000000000001');
const loserId: PartyId = toEntityId<'Party'>('00000000-0000-0000-0000-000000000002');

const previewResponse: PartyMergeResponse = {
  survivorId,
  loserId,
  conflicts: [
    { fieldPath: 'Name', survivorValue: 'Acme S', loserValue: 'Acme L', default: 'Survivor' },
  ],
  rewriteCounts: { 'Invoice.PartyId': 17 },
  dryRun: true,
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

describe('useMergePartyPreviewQuery', () => {
  afterEach(() => vi.restoreAllMocks());

  it('GETs the preview with loserId as a query param', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: previewResponse });

    const { result } = renderHook(() => useMergePartyPreviewQuery({ survivorId, loserId }), {
      wrapper: makeWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith(`/api/v1/parties/${survivorId}/merge/preview`, {
      params: { loserId },
    });
    expect(result.current.data).toEqual(previewResponse);
  });

  it('does not fetch when loserId is missing', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useMergePartyPreviewQuery({ survivorId, loserId: null }), {
      wrapper: makeWrapper(client),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });

  it('does not fetch when survivor and loser are the same id', () => {
    const client = createMockClient();
    const { result } = renderHook(
      () => useMergePartyPreviewQuery({ survivorId, loserId: survivorId }),
      { wrapper: makeWrapper(client) }
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });
});

describe('useMergePartyMutation', () => {
  afterEach(() => vi.restoreAllMocks());

  it('POSTs the merge request and auto-generates an Idempotency-Key', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue({ data: { ...previewResponse, dryRun: false } });

    const { result } = renderHook(() => useMergePartyMutation(survivorId), {
      wrapper: makeWrapper(client),
    });

    const request: PartyMergeRequest = {
      loserId,
      choices: { Name: 'Loser' },
      reason: 'Duplicate from ERP sync',
    };

    result.current.mutate({ request });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const call = vi.mocked(client.post).mock.calls[0]!;
    expect(call[0]).toBe(`/api/v1/parties/${survivorId}/merge`);
    expect(call[1]).toEqual(request);
    expect(call[2]).toMatchObject({
      headers: expect.objectContaining({
        'Idempotency-Key': expect.any(String),
      }),
    });
    // UUID v4-ish — 36 chars including hyphens.
    const idempotencyKey = (call[2] as { headers: { 'Idempotency-Key': string } }).headers[
      'Idempotency-Key'
    ];
    expect(idempotencyKey).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it('uses the explicit idempotencyKey when provided', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue({ data: { ...previewResponse, dryRun: false } });

    const { result } = renderHook(() => useMergePartyMutation(survivorId), {
      wrapper: makeWrapper(client),
    });

    const explicit = '11111111-2222-4333-8444-555555555555';
    result.current.mutate({ request: { loserId }, idempotencyKey: explicit });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.post).toHaveBeenCalledWith(
      `/api/v1/parties/${survivorId}/merge`,
      { loserId },
      { headers: { 'Idempotency-Key': explicit } }
    );
  });

  it('invalidates list + both detail queries + the preview cache on success', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue({ data: { ...previewResponse, dryRun: false } });

    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useMergePartyMutation(survivorId), {
      wrapper: makeWrapper(client, queryClient),
    });

    result.current.mutate({ request: { loserId } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const invalidatedKeys = invalidateSpy.mock.calls.map(
      ([filters]) => filters?.queryKey as readonly unknown[]
    );
    expect(invalidatedKeys).toContainEqual(['parties', 'list']);
    expect(invalidatedKeys).toContainEqual(['parties', 'detail', survivorId]);
    expect(invalidatedKeys).toContainEqual(['parties', 'detail', loserId]);
    expect(invalidatedKeys).toContainEqual(['parties', 'merge', 'preview', survivorId, loserId]);
  });

  it('falls back to a Math.random UUID when crypto.randomUUID is unavailable', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue({ data: { ...previewResponse, dryRun: false } });

    const originalRandomUUID = globalThis.crypto.randomUUID;
    Object.defineProperty(globalThis.crypto, 'randomUUID', {
      configurable: true,
      writable: true,
      value: undefined,
    });

    try {
      const { result } = renderHook(() => useMergePartyMutation(survivorId), {
        wrapper: makeWrapper(client),
      });

      result.current.mutate({ request: { loserId } });
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

  it('does NOT invalidate caches when dryRun is true', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue({ data: previewResponse });

    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useMergePartyMutation(survivorId), {
      wrapper: makeWrapper(client, queryClient),
    });

    result.current.mutate({ request: { loserId, dryRun: true } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
