import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  applySeoSuggestion,
  getSeoSuggestionDiff,
  listSeoSuggestions,
  rejectSeoSuggestion,
  suggestSeo,
  triggerBulkSeoAudit,
} from '../api/seo-ai';

import type { PagedResponse, SeoAiSuggestionResponse, SeoAiSuggestResponse } from '../types/index';

const BASE = 'https://cms.example.com';

const suggestion: SeoAiSuggestionResponse = {
  id: 'sug-1',
  contentType: 'page',
  contentId: 'page-1',
  culture: 'fr',
  status: 'Ready',
};

describe('suggestSeo', () => {
  it('POST /api/cms/seo/ai/suggest', async () => {
    const client = createMockClient();
    const response: SeoAiSuggestResponse = { outcome: 'Success', suggestion };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(response));

    const request = {
      contentType: 'page',
      contentId: 'page-1',
      culture: 'fr',
      contentTitle: 'Test',
    };
    const result = await suggestSeo(client, BASE, request);

    expect(client.post).toHaveBeenCalledWith(`${BASE}/api/cms/seo/ai/suggest`, request);
    expect(result).toEqual(response);
  });
});

describe('listSeoSuggestions', () => {
  it('GET /api/cms/seo/ai/suggestions', async () => {
    const client = createMockClient();
    const response: PagedResponse<SeoAiSuggestionResponse> = {
      items: [suggestion],
      totalCount: 1,
      page: 0,
      pageSize: 20,
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(response));

    const result = await listSeoSuggestions(client, BASE, { status: 'Ready' });

    expect(client.get).toHaveBeenCalledWith(`${BASE}/api/cms/seo/ai/suggestions`, {
      params: { status: 'Ready' },
    });
    expect(result).toEqual(response);
  });
});

describe('getSeoSuggestionDiff', () => {
  it('GET /api/cms/seo/ai/suggestions/{id}/diff', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(suggestion));

    const result = await getSeoSuggestionDiff(client, BASE, 'sug-1');

    expect(client.get).toHaveBeenCalledWith(`${BASE}/api/cms/seo/ai/suggestions/sug-1/diff`);
    expect(result).toEqual(suggestion);
  });
});

describe('applySeoSuggestion', () => {
  it('POST /api/cms/seo/ai/suggestions/{id}/apply', async () => {
    const client = createMockClient();
    const applied = { ...suggestion, status: 'Applied' as const };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(applied));

    const result = await applySeoSuggestion(client, BASE, 'sug-1', { fields: ['title'] });

    expect(client.post).toHaveBeenCalledWith(`${BASE}/api/cms/seo/ai/suggestions/sug-1/apply`, {
      fields: ['title'],
    });
    expect(result).toEqual(applied);
  });
});

describe('rejectSeoSuggestion', () => {
  it('POST /api/cms/seo/ai/suggestions/{id}/reject with reason', async () => {
    const client = createMockClient();
    const rejected = { ...suggestion, status: 'Rejected' as const };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(rejected));

    await rejectSeoSuggestion(client, BASE, 'sug-1', { reason: 'Not relevant' });

    expect(client.post).toHaveBeenCalledWith(`${BASE}/api/cms/seo/ai/suggestions/sug-1/reject`, {
      reason: 'Not relevant',
    });
  });

  it('defaults to empty body when no reason given', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(suggestion));

    await rejectSeoSuggestion(client, BASE, 'sug-1');

    expect(client.post).toHaveBeenCalledWith(`${BASE}/api/cms/seo/ai/suggestions/sug-1/reject`, {});
  });
});

describe('triggerBulkSeoAudit', () => {
  it('POST /api/cms/seo/ai/sites/{siteId}/audit — 202', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue({ status: 202, data: undefined });

    await triggerBulkSeoAudit(client, BASE, 'site-1');

    expect(client.post).toHaveBeenCalledWith(
      `${BASE}/api/cms/seo/ai/sites/site-1/audit`,
      null,
      expect.objectContaining({})
    );
  });
});
