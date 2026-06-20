import { axiosResponse, createMockClient } from '@granit/testing';
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useDefaultMentionSearch } from '../hooks/use-default-mention-search';

import { createWrapper } from './test-utils';

import type { LookupResultResponse } from '@granit/data-lookup';

function lookupResult(items: LookupResultResponse['items']): LookupResultResponse {
  return { items, totalCount: null, continuationToken: null };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useDefaultMentionSearch', () => {
  it('searches /lookups/mentions and maps items onto MentionOption (email→description, null otherwise)', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse(
        lookupResult([
          { value: 'user:u-42', label: 'Ada Lovelace', extra: { type: 'user', email: 'ada@x.io' } },
          { value: 'invoice:inv-1', label: 'Invoice #1', extra: { type: 'invoice' } },
        ])
      )
    );

    const { result } = renderHook(() => useDefaultMentionSearch(), {
      wrapper: createWrapper(client),
    });

    const options = await result.current!('ad');

    // The picker hits the unified lookup base path, not the conversations base path.
    expect(client.get).toHaveBeenCalledWith('/lookups/mentions', {
      params: { search: 'ad' },
      signal: undefined,
    });
    expect(options).toEqual([
      { type: 'user', id: 'u-42', label: 'Ada Lovelace', description: 'ada@x.io' },
      { type: 'invoice', id: 'inv-1', label: 'Invoice #1', description: null },
    ]);
  });

  it('forwards an empty query verbatim (omitted by the lookup query builder) for the default set', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(lookupResult([])));

    const { result } = renderHook(() => useDefaultMentionSearch(), {
      wrapper: createWrapper(client),
    });
    await result.current!('');

    expect(client.get).toHaveBeenCalledWith('/lookups/mentions', {
      params: {},
      signal: undefined,
    });
  });

  it('returns undefined outside an AIChatProvider (picker stays disabled)', () => {
    const { result } = renderHook(() => useDefaultMentionSearch());
    expect(result.current).toBeUndefined();
  });
});
