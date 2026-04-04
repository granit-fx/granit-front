import { createTestQueryClient } from '@granit/react-testing';
import { TemplateLifecycleStatus } from '@granit/templating';
import { toEntityId, toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  useTemplateCategories,
  useTemplateCategoryMutations,
} from '../hooks/use-template-categories.js';
import { useTemplateHistory, useTemplateRevision } from '../hooks/use-template-history.js';
import { useTemplateLayouts } from '../hooks/use-template-layouts.js';
import { useTemplateMutations } from '../hooks/use-template-mutations.js';
import { useTemplateBinaryPreview, useTemplatePreview } from '../hooks/use-template-preview.js';
import { useTemplateVariables } from '../hooks/use-template-variables.js';
import { useTemplate } from '../hooks/use-template.js';
import { useTemplates } from '../hooks/use-templates.js';
import { TemplatingProvider } from '../providers/templating-provider.js';

import { axiosResponse, createMockClient, createWrapper } from './test-utils.tsx';

import type { PagedResult } from '@granit/query-engine';
import type {
  TemplateCategory,
  TemplateDetail,
  TemplateHistory,
  TemplateListItem,
  TemplatePreviewResponse,
  TemplateRevision,
  TemplateVariables,
} from '@granit/templating';
import type { AxiosInstance } from 'axios';

/**
 * Create a wrapper that exposes the QueryClient for cache invalidation assertions.
 */
function createWrapperWithQueryClient(client: AxiosInstance) {
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: Readonly<{ children: React.ReactNode }>) => (
    <QueryClientProvider client={queryClient}>
      <TemplatingProvider client={client}>{children}</TemplatingProvider>
    </QueryClientProvider>
  );
  return { wrapper, queryClient };
}

// ---------------------------------------------------------------------------
// useTemplates
// ---------------------------------------------------------------------------

describe('useTemplates', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch templates list', async () => {
    const client = createMockClient();
    const response: PagedResult<TemplateListItem> = {
      items: [
        {
          name: 'Billing.Invoice',
          layoutName: 'Layout.Email',
          currentStatus: TemplateLifecycleStatus.Draft,
          mimeType: 'text/html',
          lastModifiedAt: toISODateString('2026-03-01T10:00:00Z'),
          lastModifiedBy: 'admin',
          hasPublishedVersion: false,
        },
      ],
      totalCount: 1,
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(response));

    const { result } = renderHook(() => useTemplates(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(response);
  });

  it('should pass params to API', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse({ items: [], total: 0, page: 1, pageSize: 20 })
    );

    const params = {
      status: TemplateLifecycleStatus.Published,
      categoryId: toEntityId<'TemplateCategory'>('billing'),
    };
    renderHook(() => useTemplates(params), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(client.get).toHaveBeenCalled());
    expect(client.get).toHaveBeenCalledWith('/api/v1/templates', { params });
  });

  it('should expose error state on failure', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('Network Error'));

    const { result } = renderHook(() => useTemplates(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Network Error');
  });
});

// ---------------------------------------------------------------------------
// useTemplate
// ---------------------------------------------------------------------------

describe('useTemplate', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch template detail', async () => {
    const client = createMockClient();
    const detail: TemplateDetail = {
      name: 'Billing.Invoice',
      layoutName: 'Layout.Email',
      draft: {
        revisionId: toEntityId<'TemplateRevision'>('rev-1'),
        content: '<p>Hello</p>',
        mimeType: 'text/html',
        status: TemplateLifecycleStatus.Draft,
        layoutName: 'Layout.Email',
        createdAt: toISODateString('2026-03-01T10:00:00Z'),
        createdBy: 'admin',
      },
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(detail));

    const { result } = renderHook(() => useTemplate('Billing.Invoice'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(detail);
  });

  it('should not fetch when name is empty', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useTemplate(''), {
      wrapper: createWrapper(client),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });

  it('should pass culture param', async () => {
    const client = createMockClient();
    const detail: TemplateDetail = { name: 'Billing.Invoice', culture: 'fr-BE', layoutName: null };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(detail));

    renderHook(() => useTemplate('Billing.Invoice', 'fr-BE'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(client.get).toHaveBeenCalled());
    expect(client.get).toHaveBeenCalledWith('/api/v1/templates/Billing.Invoice', {
      params: { culture: 'fr-BE' },
    });
  });

  it('should expose error state on failure', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('Not Found'));

    const { result } = renderHook(() => useTemplate('unknown'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Not Found');
  });
});

// ---------------------------------------------------------------------------
// useTemplateMutations
// ---------------------------------------------------------------------------

describe('useTemplateMutations', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should save draft and invalidate queries', async () => {
    const client = createMockClient();
    const detail: TemplateDetail = { name: 'Billing.Invoice', layoutName: null };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(detail));

    const { result } = renderHook(() => useTemplateMutations(), {
      wrapper: createWrapper(client),
    });

    result.current.saveDraft.mutate({ name: 'Billing.Invoice', content: '<p>Hello</p>' });

    await waitFor(() => expect(result.current.saveDraft.isSuccess).toBe(true));
    expect(client.post).toHaveBeenCalledWith('/api/v1/templates', {
      name: 'Billing.Invoice',
      content: '<p>Hello</p>',
    });
  });

  it('should publish template', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(undefined));

    const { result } = renderHook(() => useTemplateMutations(), {
      wrapper: createWrapper(client),
    });

    result.current.publish.mutate({ name: 'Billing.Invoice' });

    await waitFor(() => expect(result.current.publish.isSuccess).toBe(true));
    expect(client.post).toHaveBeenCalledWith('/api/v1/templates/Billing.Invoice/publish', null, {
      params: { culture: undefined },
    });
  });

  it('should unpublish template', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(undefined));

    const { result } = renderHook(() => useTemplateMutations(), {
      wrapper: createWrapper(client),
    });

    result.current.unpublish.mutate({ name: 'Billing.Invoice', culture: 'fr-BE' });

    await waitFor(() => expect(result.current.unpublish.isSuccess).toBe(true));
    expect(client.post).toHaveBeenCalledWith('/api/v1/templates/Billing.Invoice/unpublish', null, {
      params: { culture: 'fr-BE' },
    });
  });

  it('should delete draft', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

    const { result } = renderHook(() => useTemplateMutations(), {
      wrapper: createWrapper(client),
    });

    result.current.deleteDraft.mutate({ name: 'Billing.Invoice' });

    await waitFor(() => expect(result.current.deleteDraft.isSuccess).toBe(true));
    expect(client.delete).toHaveBeenCalledWith('/api/v1/templates/Billing.Invoice/draft', {
      params: { culture: undefined },
    });
  });

  it('should update draft', async () => {
    const client = createMockClient();
    const detail: TemplateDetail = { name: 'Billing.Invoice', layoutName: null };
    vi.mocked(client.put).mockResolvedValue(axiosResponse(detail));

    const { result } = renderHook(() => useTemplateMutations(), {
      wrapper: createWrapper(client),
    });

    result.current.updateDraft.mutate({
      name: 'Billing.Invoice',
      request: { name: 'Billing.Invoice', content: '<p>Updated</p>' },
    });

    await waitFor(() => expect(result.current.updateDraft.isSuccess).toBe(true));
    expect(client.put).toHaveBeenCalledWith('/api/v1/templates/Billing.Invoice', {
      name: 'Billing.Invoice',
      content: '<p>Updated</p>',
    });
  });

  it('should expose error state when saveDraft fails', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValue(new Error('Conflict'));

    const { result } = renderHook(() => useTemplateMutations(), {
      wrapper: createWrapper(client),
    });

    result.current.saveDraft.mutate({ name: 'Billing.Invoice', content: '<p>Hello</p>' });

    await waitFor(() => expect(result.current.saveDraft.isError).toBe(true));
    expect(result.current.saveDraft.error?.message).toBe('Conflict');
  });

  it('should expose error state when publish fails', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValue(new Error('Forbidden'));

    const { result } = renderHook(() => useTemplateMutations(), {
      wrapper: createWrapper(client),
    });

    result.current.publish.mutate({ name: 'Billing.Invoice' });

    await waitFor(() => expect(result.current.publish.isError).toBe(true));
    expect(result.current.publish.error?.message).toBe('Forbidden');
  });

  it('should invalidate cache after saveDraft succeeds', async () => {
    const client = createMockClient();
    const detail: TemplateDetail = { name: 'Billing.Invoice', layoutName: null };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(detail));

    const { wrapper, queryClient } = createWrapperWithQueryClient(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useTemplateMutations(), { wrapper });

    result.current.saveDraft.mutate({ name: 'Billing.Invoice', content: '<p>Hello</p>' });

    await waitFor(() => expect(result.current.saveDraft.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['templates'] })
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['templates', 'detail', 'Billing.Invoice'] })
    );
  });

  it('should invalidate cache after publish succeeds', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(undefined));

    const { wrapper, queryClient } = createWrapperWithQueryClient(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useTemplateMutations(), { wrapper });

    result.current.publish.mutate({ name: 'Billing.Invoice' });

    await waitFor(() => expect(result.current.publish.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['templates'] })
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['templates', 'detail', 'Billing.Invoice'] })
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['templates', 'history', 'Billing.Invoice'] })
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['templates', 'lifecycle', 'Billing.Invoice'] })
    );
  });

  it('should invalidate cache after unpublish succeeds', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(undefined));

    const { wrapper, queryClient } = createWrapperWithQueryClient(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useTemplateMutations(), { wrapper });

    result.current.unpublish.mutate({ name: 'Billing.Invoice' });

    await waitFor(() => expect(result.current.unpublish.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['templates'] })
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['templates', 'detail', 'Billing.Invoice'] })
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['templates', 'history', 'Billing.Invoice'] })
    );
  });

  it('should invalidate cache after deleteDraft succeeds', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

    const { wrapper, queryClient } = createWrapperWithQueryClient(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useTemplateMutations(), { wrapper });

    result.current.deleteDraft.mutate({ name: 'Billing.Invoice' });

    await waitFor(() => expect(result.current.deleteDraft.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['templates'] })
    );
  });

  it('should invalidate cache after updateDraft succeeds', async () => {
    const client = createMockClient();
    const detail: TemplateDetail = { name: 'Billing.Invoice', layoutName: null };
    vi.mocked(client.put).mockResolvedValue(axiosResponse(detail));

    const { wrapper, queryClient } = createWrapperWithQueryClient(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useTemplateMutations(), { wrapper });

    result.current.updateDraft.mutate({
      name: 'Billing.Invoice',
      request: { name: 'Billing.Invoice', content: '<p>Updated</p>' },
    });

    await waitFor(() => expect(result.current.updateDraft.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['templates'] })
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['templates', 'detail', 'Billing.Invoice'] })
    );
  });
});

// ---------------------------------------------------------------------------
// useTemplateHistory
// ---------------------------------------------------------------------------

describe('useTemplateHistory', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch history', async () => {
    const client = createMockClient();
    const history: TemplateHistory = {
      revisions: [],
      totalCount: 0,
      page: 1,
      pageSize: 20,
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(history));

    const { result } = renderHook(() => useTemplateHistory('Billing.Invoice'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(history);
  });

  it('should not fetch when name is empty', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useTemplateHistory(''), {
      wrapper: createWrapper(client),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });

  it('should expose error state on failure', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('Server Error'));

    const { result } = renderHook(() => useTemplateHistory('Billing.Invoice'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Server Error');
  });
});

// ---------------------------------------------------------------------------
// useTemplateRevision
// ---------------------------------------------------------------------------

describe('useTemplateRevision', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch a specific revision', async () => {
    const client = createMockClient();
    const revision: TemplateRevision = {
      revisionId: toEntityId<'TemplateRevision'>('rev-1'),
      content: '<p>Hello</p>',
      mimeType: 'text/html',
      status: TemplateLifecycleStatus.Published,
      layoutName: null,
      createdAt: toISODateString('2026-03-01T10:00:00Z'),
      createdBy: 'admin',
      publishedAt: toISODateString('2026-03-02T10:00:00Z'),
      publishedBy: 'admin',
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(revision));

    const { result } = renderHook(() => useTemplateRevision('Billing.Invoice', 'rev-1'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(revision);
    expect(client.get).toHaveBeenCalledWith('/api/v1/templates/Billing.Invoice/history/rev-1');
  });

  it('should not fetch when name is empty', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useTemplateRevision('', 'rev-1'), {
      wrapper: createWrapper(client),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });

  it('should not fetch when revisionId is empty', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useTemplateRevision('Billing.Invoice', ''), {
      wrapper: createWrapper(client),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });

  it('should expose error state on failure', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('Not Found'));

    const { result } = renderHook(() => useTemplateRevision('Billing.Invoice', 'rev-999'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Not Found');
  });
});

// ---------------------------------------------------------------------------
// useTemplatePreview
// ---------------------------------------------------------------------------

describe('useTemplatePreview', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should preview template via mutation', async () => {
    const client = createMockClient();
    const response: TemplatePreviewResponse = {
      html: '<p>Rendered</p>',
      revisionId: toEntityId<'TemplateRevision'>('rev-1'),
      renderTimeMs: 42,
    };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(response));

    const { result } = renderHook(() => useTemplatePreview(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({ name: 'Billing.Invoice', request: { data: { title: 'Test' } } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(response);
  });

  it('should expose error state on failure', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValue(new Error('Parse Error'));

    const { result } = renderHook(() => useTemplatePreview(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({ name: 'Billing.Invoice', request: { data: { title: 'Test' } } });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Parse Error');
  });
});

// ---------------------------------------------------------------------------
// useTemplateBinaryPreview
// ---------------------------------------------------------------------------

describe('useTemplateBinaryPreview', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should preview template as binary via mutation', async () => {
    const client = createMockClient();
    const blob = new Blob(['pdf-content'], { type: 'application/pdf' });
    vi.mocked(client.post).mockResolvedValue(axiosResponse(blob));

    const { result } = renderHook(() => useTemplateBinaryPreview(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({ name: 'Billing.Invoice', request: { data: { total: 100 } } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeInstanceOf(Blob);
    expect(client.post).toHaveBeenCalledWith(
      '/api/v1/templates/Billing.Invoice/preview',
      { data: { total: 100 } },
      { responseType: 'blob' }
    );
  });

  it('should expose error state on failure', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValue(new Error('Render Failed'));

    const { result } = renderHook(() => useTemplateBinaryPreview(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({ name: 'Billing.Invoice', request: {} });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Render Failed');
  });
});

// ---------------------------------------------------------------------------
// useTemplateVariables
// ---------------------------------------------------------------------------

describe('useTemplateVariables', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch variables', async () => {
    const client = createMockClient();
    const variables: TemplateVariables = {
      globalVariables: [{ name: 'AppName', type: 'string' }],
      modelVariables: [],
      enrichedVariables: [],
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(variables));

    const { result } = renderHook(() => useTemplateVariables('Billing.Invoice'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(variables);
  });

  it('should not fetch when name is empty', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useTemplateVariables(''), {
      wrapper: createWrapper(client),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('should expose error state on failure', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('Server Error'));

    const { result } = renderHook(() => useTemplateVariables('Billing.Invoice'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Server Error');
  });
});

// ---------------------------------------------------------------------------
// useTemplateCategories
// ---------------------------------------------------------------------------

describe('useTemplateCategories', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch categories', async () => {
    const client = createMockClient();
    const categories: TemplateCategory[] = [
      {
        id: toEntityId<'TemplateCategory'>('cat-1'),
        name: 'Billing',
        sortOrder: 1,
        templateCount: 5,
      },
    ];
    vi.mocked(client.get).mockResolvedValue(axiosResponse(categories));

    const { result } = renderHook(() => useTemplateCategories(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(categories);
  });

  it('should expose error state on failure', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('Forbidden'));

    const { result } = renderHook(() => useTemplateCategories(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Forbidden');
  });
});

// ---------------------------------------------------------------------------
// useTemplateLayouts
// ---------------------------------------------------------------------------

describe('useTemplateLayouts', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch layouts', async () => {
    const client = createMockClient();
    const layouts = ['Layout.Email', 'Layout.Pdf', 'Layout.Letter'];
    vi.mocked(client.get).mockResolvedValue(axiosResponse(layouts));

    const { result } = renderHook(() => useTemplateLayouts(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(layouts);
    expect(client.get).toHaveBeenCalledWith('/api/v1/templates/layouts');
  });

  it('should expose error state on failure', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('Server Error'));

    const { result } = renderHook(() => useTemplateLayouts(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Server Error');
  });
});

// ---------------------------------------------------------------------------
// useTemplateCategoryMutations
// ---------------------------------------------------------------------------

describe('useTemplateCategoryMutations', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should create a category', async () => {
    const client = createMockClient();
    const created: TemplateCategory = {
      id: toEntityId<'TemplateCategory'>('cat-2'),
      name: 'Legal',
      sortOrder: 2,
      templateCount: 0,
    };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(created));

    const { result } = renderHook(() => useTemplateCategoryMutations(), {
      wrapper: createWrapper(client),
    });

    result.current.create.mutate({ name: 'Legal', sortOrder: 2 });

    await waitFor(() => expect(result.current.create.isSuccess).toBe(true));
    expect(client.post).toHaveBeenCalledWith('/api/v1/templates/categories', {
      name: 'Legal',
      sortOrder: 2,
    });
    expect(result.current.create.data).toEqual(created);
  });

  it('should update a category', async () => {
    const client = createMockClient();
    const updated: TemplateCategory = {
      id: toEntityId<'TemplateCategory'>('cat-1'),
      name: 'Billing Updated',
      sortOrder: 1,
      templateCount: 5,
    };
    vi.mocked(client.put).mockResolvedValue(axiosResponse(updated));

    const { result } = renderHook(() => useTemplateCategoryMutations(), {
      wrapper: createWrapper(client),
    });

    result.current.update.mutate({
      id: 'cat-1',
      request: { name: 'Billing Updated', sortOrder: 1 },
    });

    await waitFor(() => expect(result.current.update.isSuccess).toBe(true));
    expect(client.put).toHaveBeenCalledWith('/api/v1/templates/categories/cat-1', {
      name: 'Billing Updated',
      sortOrder: 1,
    });
    expect(result.current.update.data).toEqual(updated);
  });

  it('should delete a category', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

    const { result } = renderHook(() => useTemplateCategoryMutations(), {
      wrapper: createWrapper(client),
    });

    result.current.delete.mutate('cat-1');

    await waitFor(() => expect(result.current.delete.isSuccess).toBe(true));
    expect(client.delete).toHaveBeenCalledWith('/api/v1/templates/categories/cat-1');
  });

  it('should expose error state when create fails', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValue(new Error('Duplicate Name'));

    const { result } = renderHook(() => useTemplateCategoryMutations(), {
      wrapper: createWrapper(client),
    });

    result.current.create.mutate({ name: 'Billing' });

    await waitFor(() => expect(result.current.create.isError).toBe(true));
    expect(result.current.create.error?.message).toBe('Duplicate Name');
  });

  it('should invalidate categories cache after create', async () => {
    const client = createMockClient();
    const created: TemplateCategory = {
      id: toEntityId<'TemplateCategory'>('cat-2'),
      name: 'Legal',
      sortOrder: 2,
      templateCount: 0,
    };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(created));

    const { wrapper, queryClient } = createWrapperWithQueryClient(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useTemplateCategoryMutations(), { wrapper });

    result.current.create.mutate({ name: 'Legal' });

    await waitFor(() => expect(result.current.create.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['templates', 'categories'] })
    );
  });

  it('should invalidate categories cache after update', async () => {
    const client = createMockClient();
    const updated: TemplateCategory = {
      id: toEntityId<'TemplateCategory'>('cat-1'),
      name: 'Billing v2',
      sortOrder: 1,
      templateCount: 5,
    };
    vi.mocked(client.put).mockResolvedValue(axiosResponse(updated));

    const { wrapper, queryClient } = createWrapperWithQueryClient(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useTemplateCategoryMutations(), { wrapper });

    result.current.update.mutate({
      id: 'cat-1',
      request: { name: 'Billing v2', sortOrder: 1 },
    });

    await waitFor(() => expect(result.current.update.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['templates', 'categories'] })
    );
  });

  it('should invalidate categories cache after delete', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

    const { wrapper, queryClient } = createWrapperWithQueryClient(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useTemplateCategoryMutations(), { wrapper });

    result.current.delete.mutate('cat-1');

    await waitFor(() => expect(result.current.delete.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['templates', 'categories'] })
    );
  });
});
