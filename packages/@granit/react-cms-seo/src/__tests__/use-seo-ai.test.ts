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

import {
  useApplySeoSuggestion,
  useRejectSeoSuggestion,
  useSeoSuggestionDiff,
  useSeoSuggestions,
  useSuggestSeo,
  useTriggerBulkSeoAudit,
} from '../hooks/use-seo-ai';
import { CmsSeoProvider } from '../providers/cms-seo-provider';

import type { PagedResponse, SeoAiSuggestResponse, SeoAiSuggestionResponse } from '@granit/cms-seo';
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

const suggestion: SeoAiSuggestionResponse = {
  id: 'sug-1',
  contentType: 'page',
  contentId: 'page-1',
  culture: 'fr',
  status: 'Ready',
};

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
    const paged: PagedResponse<SeoAiSuggestionResponse> = {
      items: [suggestion],
      totalCount: 1,
      page: 0,
      pageSize: 20,
    };
    vi.mocked(listSeoSuggestions).mockResolvedValue(paged);

    const { result } = renderHook(() => useSeoSuggestions({ status: 'Ready' }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listSeoSuggestions).toHaveBeenCalledWith(client, '', { status: 'Ready' });
  });
});

describe('useSeoSuggestionDiff', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches diff for a suggestion', async () => {
    const client = createMockClient();
    vi.mocked(getSeoSuggestionDiff).mockResolvedValue(suggestion);

    const { result } = renderHook(() => useSeoSuggestionDiff('sug-1'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getSeoSuggestionDiff).toHaveBeenCalledWith(client, '', 'sug-1');
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
    const response: SeoAiSuggestResponse = { outcome: 'Success', suggestion };
    vi.mocked(suggestSeo).mockResolvedValue(response);

    const req = { contentType: 'page', contentId: 'page-1', culture: 'fr', contentTitle: 'Test' };
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
    vi.mocked(applySeoSuggestion).mockResolvedValue({ ...suggestion, status: 'Applied' });

    const { result } = renderHook(() => useApplySeoSuggestion(), {
      wrapper: createWrapper(client),
    });
    result.current.mutate({ id: 'sug-1', request: { fields: ['title'] } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(applySeoSuggestion).toHaveBeenCalledWith(client, '', 'sug-1', { fields: ['title'] });
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
    result.current.mutate({ id: 'sug-1', request: { reason: 'Not relevant' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(rejectSeoSuggestion).toHaveBeenCalledWith(client, '', 'sug-1', {
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
