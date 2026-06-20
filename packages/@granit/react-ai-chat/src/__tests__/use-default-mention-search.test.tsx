import { axiosResponse, createMockClient } from '@granit/testing';
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useDefaultMentionSearch } from '../hooks/use-default-mention-search';

import { createWrapper, TEST_BASE_PATH } from './test-utils';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useDefaultMentionSearch', () => {
  it('searches /mentions and maps the response 1:1 to MentionOption (description preserved, null kept)', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse({
        items: [
          { type: 'contact', id: 'c-42', label: 'Acme Corp', description: 'Customer' },
          { type: 'document', id: 'doc-7', label: 'Q2 Contract.pdf', description: null },
        ],
      })
    );

    const { result } = renderHook(() => useDefaultMentionSearch(), {
      wrapper: createWrapper(client),
    });

    const options = await result.current!('ac');

    expect(client.get).toHaveBeenCalledWith(`${TEST_BASE_PATH}/mentions`, {
      params: { q: 'ac', limit: 8 },
    });
    expect(options).toEqual([
      { type: 'contact', id: 'c-42', label: 'Acme Corp', description: 'Customer' },
      { type: 'document', id: 'doc-7', label: 'Q2 Contract.pdf', description: null },
    ]);
  });

  it('honours a custom limit', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ items: [] }));

    const { result } = renderHook(() => useDefaultMentionSearch(3), {
      wrapper: createWrapper(client),
    });
    await result.current!('');

    expect(client.get).toHaveBeenCalledWith(`${TEST_BASE_PATH}/mentions`, {
      params: { q: '', limit: 3 },
    });
  });

  it('returns undefined outside an AIChatProvider (picker stays disabled)', () => {
    const { result } = renderHook(() => useDefaultMentionSearch());
    expect(result.current).toBeUndefined();
  });
});
