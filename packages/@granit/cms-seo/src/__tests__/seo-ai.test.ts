import { axiosResponse, createMockClient } from '@granit/testing';
import { toISODateString } from '@granit/types';
import { describe, expect, it, vi } from 'vitest';

import {
  applySeoSuggestion,
  getSeoSuggestionDiff,
  listSeoSuggestions,
  rejectSeoSuggestion,
  suggestSeo,
  triggerBulkSeoAudit,
} from '../api/seo-ai';

import type {
  SeoSuggestRequest,
  SeoSuggestResponse,
  SeoSuggestionResponse,
  SeoSuggestionDiff,
  SeoSuggestionListResponse,
} from '../types/index';

const BASE = 'https://cms.example.com';

const suggestion: SeoSuggestionResponse = {
  id: 'sug-1',
  siteId: 'site-1',
  contentType: 'page',
  contentId: 'page-1',
  culture: 'fr',
  status: 'Pending',
  scope: 'Title, Description',
  appliedFields: 'None',
  title: 'A title',
  description: 'A description',
  keywords: ['k'],
  ogImageAltText: null,
  structuredDataJson: null,
  modelId: 'gpt-4o-mini',
  promptTemplateVersion: 'v1',
  createdAt: toISODateString('2026-06-01T10:00:00.000Z'),
  reviewedBy: null,
  reviewedAt: null,
  failureReason: null,
  rejectionReason: null,
};

describe('suggestSeo', () => {
  it('POST /api/cms/seo/ai/suggest', async () => {
    const client = createMockClient();
    const response: SeoSuggestResponse = { outcome: 'Succeeded', suggestion };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(response));

    const request: SeoSuggestRequest = {
      siteId: 'site-1',
      contentType: 'page',
      contentId: 'page-1',
      culture: 'fr',
      contentTitle: 'Test',
      contentBody: 'Body text',
      scope: 'Title, Description',
    };
    const result = await suggestSeo(client, BASE, request);

    expect(client.post).toHaveBeenCalledWith(`${BASE}/api/cms/seo/ai/suggest`, request);
    expect(result).toEqual(response);
  });
});

describe('listSeoSuggestions', () => {
  it('GET /api/cms/seo/ai/suggestions', async () => {
    const client = createMockClient();
    const response: SeoSuggestionListResponse = { items: [suggestion], total: 1 };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(response));

    const result = await listSeoSuggestions(client, BASE, { status: 'Pending', skip: 0, take: 25 });

    expect(client.get).toHaveBeenCalledWith(`${BASE}/api/cms/seo/ai/suggestions`, {
      params: { status: 'Pending', skip: 0, take: 25 },
    });
    expect(result).toEqual(response);
  });
});

describe('getSeoSuggestionDiff', () => {
  it('GET /api/cms/seo/ai/suggestions/{id}/diff', async () => {
    const client = createMockClient();
    const diff: SeoSuggestionDiff = {
      suggestionId: 'sug-1',
      scope: 'Title, Description',
      fields: [
        { field: 'Title', inScope: true, current: 'Old', proposed: 'New' },
        { field: 'Description', inScope: true, current: null, proposed: 'New desc' },
      ],
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(diff));

    const result = await getSeoSuggestionDiff(client, BASE, 'sug-1');

    expect(client.get).toHaveBeenCalledWith(`${BASE}/api/cms/seo/ai/suggestions/sug-1/diff`);
    expect(result).toEqual(diff);
  });
});

describe('applySeoSuggestion', () => {
  it('POST /api/cms/seo/ai/suggestions/{id}/apply with the flags string', async () => {
    const client = createMockClient();
    const applied: SeoSuggestionResponse = { ...suggestion, status: 'Accepted' };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(applied));

    const result = await applySeoSuggestion(client, BASE, 'sug-1', {
      fields: 'Title, Description',
    });

    expect(client.post).toHaveBeenCalledWith(`${BASE}/api/cms/seo/ai/suggestions/sug-1/apply`, {
      fields: 'Title, Description',
    });
    expect(result).toEqual(applied);
  });
});

describe('rejectSeoSuggestion', () => {
  it('POST /api/cms/seo/ai/suggestions/{id}/reject with reason', async () => {
    const client = createMockClient();
    const rejected: SeoSuggestionResponse = { ...suggestion, status: 'Rejected' };
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
