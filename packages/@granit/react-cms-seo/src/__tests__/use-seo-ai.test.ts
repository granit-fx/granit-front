import {
  applySeoSuggestion,
  getSeoSuggestionDiff,
  listSeoSuggestions,
  rejectSeoSuggestion,
  suggestSeo,
  triggerBulkSeoAudit,
} from '@granit/cms-seo';
import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockSeoSuggestions } from '@granit/react-cms-seo/testing';

import {
  useApplySeoSuggestion,
  useRejectSeoSuggestion,
  useSeoSuggestionDiff,
  useSeoSuggestions,
  useSuggestSeo,
  useTriggerBulkSeoAudit,
} from '../hooks/use-seo-ai';
import { CmsSeoProvider } from '../providers/cms-seo-provider';

import type {
  SeoSuggestRequest,
  SeoSuggestResponse,
  SeoSuggestionDiff,
  SeoSuggestionListResponse,
} from '@granit/cms-seo';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/cms-seo', () => ({
  listSeoSuggestions: vi.fn(),
  getSeoSuggestionDiff: vi.fn(),
  suggestSeo: vi.fn(),
  applySeoSuggestion: vi.fn(),
  rejectSeoSuggestion: vi.fn(),
  triggerBulkSeoAudit: vi.fn(),
}));

const suggestion = mockSeoSuggestions[0]!;

function createWrapper(client: AxiosInstance) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(CmsSeoProvider, { config: { client }, children })
    );
  };
}

describe('useSeoSuggestions', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches paged suggestions', async () => {
    const client = createMockClient();
    const list: SeoSuggestionListResponse = { items: [suggestion], total: 1 };
    vi.mocked(listSeoSuggestions).mockResolvedValue(list);

    const { result } = renderHook(() => useSeoSuggestions({ status: 'Pending' }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listSeoSuggestions).toHaveBeenCalledWith(client, '', { status: 'Pending' });
  });
});

describe('useSeoSuggestionDiff', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches diff for a suggestion', async () => {
    const client = createMockClient();
    const diff: SeoSuggestionDiff = {
      suggestionId: suggestion.id,
      scope: 'Title, Description',
      fields: [{ field: 'Title', inScope: true, current: null, proposed: 'New' }],
    };
    vi.mocked(getSeoSuggestionDiff).mockResolvedValue(diff);

    const { result } = renderHook(() => useSeoSuggestionDiff(suggestion.id), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getSeoSuggestionDiff).toHaveBeenCalledWith(client, '', suggestion.id);
  });

  it('is disabled when id is empty', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useSeoSuggestionDiff(''), {
      wrapper: createWrapper(client),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useSuggestSeo', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls suggestSeo', async () => {
    const client = createMockClient();
    const response: SeoSuggestResponse = { outcome: 'Succeeded', suggestion };
    vi.mocked(suggestSeo).mockResolvedValue(response);

    const req: SeoSuggestRequest = {
      siteId: 'site-1',
      contentType: 'page',
      contentId: 'page-1',
      culture: 'fr',
      contentTitle: 'Test',
      contentBody: null,
      scope: 'Title, Description',
    };
    const { result } = renderHook(() => useSuggestSeo(), { wrapper: createWrapper(client) });
    result.current.mutate(req);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(suggestSeo).toHaveBeenCalledWith(client, '', req);
  });
});

describe('useApplySeoSuggestion', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls applySeoSuggestion', async () => {
    const client = createMockClient();
    vi.mocked(applySeoSuggestion).mockResolvedValue({ ...suggestion, status: 'Accepted' });

    const { result } = renderHook(() => useApplySeoSuggestion(), {
      wrapper: createWrapper(client),
    });
    result.current.mutate({ id: suggestion.id, request: { fields: 'Title' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(applySeoSuggestion).toHaveBeenCalledWith(client, '', suggestion.id, { fields: 'Title' });
  });
});

describe('useRejectSeoSuggestion', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls rejectSeoSuggestion', async () => {
    const client = createMockClient();
    vi.mocked(rejectSeoSuggestion).mockResolvedValue({ ...suggestion, status: 'Rejected' });

    const { result } = renderHook(() => useRejectSeoSuggestion(), {
      wrapper: createWrapper(client),
    });
    result.current.mutate({ id: suggestion.id, request: { reason: 'Not relevant' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(rejectSeoSuggestion).toHaveBeenCalledWith(client, '', suggestion.id, {
      reason: 'Not relevant',
    });
  });
});

describe('useTriggerBulkSeoAudit', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls triggerBulkSeoAudit', async () => {
    const client = createMockClient();
    vi.mocked(triggerBulkSeoAudit).mockResolvedValue(undefined);

    const { result } = renderHook(() => useTriggerBulkSeoAudit(), {
      wrapper: createWrapper(client),
    });
    result.current.mutate('site-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(triggerBulkSeoAudit).toHaveBeenCalledWith(client, '', 'site-1');
  });
});
