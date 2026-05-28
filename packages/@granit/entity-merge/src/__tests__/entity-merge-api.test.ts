import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { executeMerge, previewMerge } from '../api/entity-merge-api.js';

import type { MergeResult } from '../types/index.js';

const result: MergeResult = {
  survivorId: 's1',
  loserId: 'l1',
  conflicts: [],
  rewriteCounts: {},
  dryRun: true,
};

describe('previewMerge', () => {
  it('GETs the preview URL with the loserId query param', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(result));

    const out = await previewMerge(client, '/api/v1/parties', 's1', 'l1');

    expect(client.get).toHaveBeenCalledWith('/api/v1/parties/s1/merge/preview', {
      params: { loserId: 'l1' },
    });
    expect(out).toEqual(result);
  });

  it('URL-encodes the survivor id', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(result));

    await previewMerge(client, '/api/v1/parties', 'a/b', 'l1');

    expect(client.get).toHaveBeenCalledWith('/api/v1/parties/a%2Fb/merge/preview', {
      params: { loserId: 'l1' },
    });
  });
});

describe('executeMerge', () => {
  it('POSTs the body and forwards the idempotency key as a header', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse({ ...result, dryRun: false }));

    await executeMerge(
      client,
      '/api/v1/parties',
      's1',
      { loserId: 'l1', choices: { Name: 'Loser' }, reason: 'dup', dryRun: false },
      'key-123'
    );

    expect(client.post).toHaveBeenCalledWith(
      '/api/v1/parties/s1/merge',
      { loserId: 'l1', choices: { Name: 'Loser' }, reason: 'dup', dryRun: false },
      { headers: { 'Idempotency-Key': 'key-123' } }
    );
  });

  it('omits the request config when no idempotency key is given', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(result));

    await executeMerge(client, '/api/v1/parties', 's1', { loserId: 'l1' });

    expect(client.post).toHaveBeenCalledWith(
      '/api/v1/parties/s1/merge',
      { loserId: 'l1' },
      undefined
    );
  });
});
