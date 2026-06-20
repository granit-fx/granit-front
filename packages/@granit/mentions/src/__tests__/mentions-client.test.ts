import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { MENTIONS_SOURCE, parseMentionValue, resolveMention, searchMentions } from '../api/index';

import type { LookupItemResponse, LookupResultResponse } from '@granit/data-lookup';

const ADA: LookupItemResponse = {
  value: 'user:42',
  label: 'Ada Lovelace',
  extra: { type: 'user', email: 'ada@x.io' },
};

const INVOICE: LookupItemResponse = {
  value: 'invoice:inv-1',
  label: 'Invoice #1',
  extra: { type: 'invoice' },
};

function result(items: readonly LookupItemResponse[]): LookupResultResponse {
  return { items, totalCount: null, continuationToken: null };
}

describe('MENTIONS_SOURCE', () => {
  it('is the facade source name "mentions"', () => {
    expect(MENTIONS_SOURCE).toBe('mentions');
  });
});

describe('parseMentionValue', () => {
  it('splits on the first colon only', () => {
    expect(parseMentionValue('user:42')).toEqual({ type: 'user', id: '42' });
    expect(parseMentionValue('doc:a:b')).toEqual({ type: 'doc', id: 'a:b' });
  });

  it('treats a value without a colon as a bare id', () => {
    expect(parseMentionValue('42')).toEqual({ type: '', id: '42' });
  });
});

describe('searchMentions', () => {
  it('GETs /lookups/mentions with the search term and maps items (id from value, type/extra from item)', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(result([ADA, INVOICE])));

    const items = await searchMentions(client, { search: 'a' });

    expect(client.get).toHaveBeenCalledWith('/lookups/mentions', {
      params: { search: 'a' },
      signal: undefined,
    });
    expect(items).toEqual([
      { type: 'user', id: '42', label: 'Ada Lovelace', extra: { type: 'user', email: 'ada@x.io' } },
      { type: 'invoice', id: 'inv-1', label: 'Invoice #1', extra: { type: 'invoice' } },
    ]);
  });

  it('forwards the type filter as scope.type and an empty search verbatim (omitted by the query builder)', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(result([])));

    await searchMentions(client, { search: '', type: 'user' });

    expect(client.get).toHaveBeenCalledWith('/lookups/mentions', {
      params: { 'scope.type': 'user' },
      signal: undefined,
    });
  });

  it('forwards the abort signal', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(result([])));
    const controller = new AbortController();

    await searchMentions(client, { search: 'x' }, { signal: controller.signal });

    expect(client.get).toHaveBeenCalledWith('/lookups/mentions', {
      params: { search: 'x' },
      signal: controller.signal,
    });
  });
});

describe('resolveMention', () => {
  it('GETs /lookups/mentions/resolve?value=… and maps the item', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(ADA));

    const item = await resolveMention(client, 'user:42');

    expect(client.get).toHaveBeenCalledWith('/lookups/mentions/resolve', {
      params: { value: 'user:42' },
      signal: undefined,
    });
    expect(item).toEqual({
      type: 'user',
      id: '42',
      label: 'Ada Lovelace',
      extra: { type: 'user', email: 'ada@x.io' },
    });
  });

  it('returns null when the value is unknown (HTTP 404)', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue({ response: { status: 404 } });

    await expect(resolveMention(client, 'user:does-not-exist')).resolves.toBeNull();
  });
});
