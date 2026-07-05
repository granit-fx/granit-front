import { getAuthor, listAuthors } from '@granit/blog';
import { createMockClient } from '@granit/testing';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { BLOG_SITE_ID, mockAuthors } from '@granit/react-blog/testing';

import { useAuthor, useAuthors } from '../hooks/use-authors';

import { createWrapper } from './test-utils';

vi.mock('@granit/blog', () => ({
  listAuthors: vi.fn(),
  getAuthor: vi.fn(),
}));

afterEach(() => vi.clearAllMocks());

describe('useAuthors', () => {
  it('lists authors for a site', async () => {
    const client = createMockClient();
    vi.mocked(listAuthors).mockResolvedValue(mockAuthors);

    const { result } = renderHook(() => useAuthors(BLOG_SITE_ID), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listAuthors).toHaveBeenCalledWith(
      client,
      '/api/blog',
      BLOG_SITE_ID,
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it('is disabled for an empty siteId', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useAuthors(''), { wrapper: createWrapper(client) });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useAuthor', () => {
  it('fetches an author by id', async () => {
    const client = createMockClient();
    vi.mocked(getAuthor).mockResolvedValue(mockAuthors[0]!);

    const { result } = renderHook(() => useAuthor('author-1'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getAuthor).toHaveBeenCalledWith(client, '/api/blog', 'author-1');
  });
});
