import { axiosResponse, createMockClient } from '@granit/api-client/test-utils';
import { describe, expect, it, vi } from 'vitest';

import {
  createCategory,
  deleteCategory,
  deleteDraft,
  getCategories,
  getHistory,
  getLifecycleInfo,
  getRevision,
  getTemplate,
  getTemplates,
  getVariables,
  previewTemplate,
  publishTemplate,
  saveDraft,
  unpublishTemplate,
  updateCategory,
  updateDraft,
} from '../api/templates-api.js';
import { TemplateLifecycleStatus } from '../types/index.js';

import type {
  TemplateCategory,
  TemplateDetail,
  TemplateHistory,
  TemplateLifecycle,
  TemplateListItem,
  TemplatePreviewResponse,
  TemplateRevision,
  TemplateVariables,
} from '../types/index.js';
import type { PagedResult } from '@granit/query-engine';

const basePath = '/api/v1';

describe('templates-api', () => {
  describe('getTemplates', () => {
    it('should call GET /templates with params', async () => {
      const client = createMockClient();
      const response: PagedResult<TemplateListItem> = {
        items: [
          {
            name: 'Billing.Invoice',
            currentStatus: TemplateLifecycleStatus.Draft,
            mimeType: 'text/html',
            lastModifiedAt: '2026-03-01T10:00:00Z',
            lastModifiedBy: 'admin',
            hasPublishedVersion: false,
          },
        ],
        totalCount: 1,
      };
      vi.mocked(client.get).mockResolvedValue(axiosResponse(response));

      const result = await getTemplates(client, basePath, {
        status: TemplateLifecycleStatus.Draft,
      });

      expect(client.get).toHaveBeenCalledWith('/api/v1/templates', {
        params: { status: TemplateLifecycleStatus.Draft },
      });
      expect(result).toEqual(response);
    });

    it('should call GET /templates without params', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse({ items: [], totalCount: 0 }));

      await getTemplates(client, basePath);

      expect(client.get).toHaveBeenCalledWith('/api/v1/templates', { params: undefined });
    });
  });

  describe('getTemplate', () => {
    it('should call GET /templates/{name} with culture', async () => {
      const client = createMockClient();
      const detail: TemplateDetail = {
        name: 'Billing.Invoice',
        category: 'billing',
        draft: {
          revisionId: 'rev-1',
          content: '<p>Hello</p>',
          mimeType: 'text/html',
          status: TemplateLifecycleStatus.Draft,
          createdAt: '2026-03-01T10:00:00Z',
          createdBy: 'admin',
        },
      };
      vi.mocked(client.get).mockResolvedValue(axiosResponse(detail));

      const result = await getTemplate(client, basePath, 'Billing.Invoice', 'fr-BE');

      expect(client.get).toHaveBeenCalledWith('/api/v1/templates/Billing.Invoice', {
        params: { culture: 'fr-BE' },
      });
      expect(result).toEqual(detail);
    });
  });

  describe('saveDraft', () => {
    it('should call POST /templates', async () => {
      const client = createMockClient();
      const request = { name: 'Billing.Invoice', content: '<p>Hello</p>' };
      const detail: TemplateDetail = { name: 'Billing.Invoice' };
      vi.mocked(client.post).mockResolvedValue(axiosResponse(detail));

      const result = await saveDraft(client, basePath, request);

      expect(client.post).toHaveBeenCalledWith('/api/v1/templates', request);
      expect(result).toEqual(detail);
    });
  });

  describe('updateDraft', () => {
    it('should call PUT /templates/{name}', async () => {
      const client = createMockClient();
      const request = { name: 'Billing.Invoice', content: '<p>Updated</p>' };
      const detail: TemplateDetail = { name: 'Billing.Invoice' };
      vi.mocked(client.put).mockResolvedValue(axiosResponse(detail));

      const result = await updateDraft(client, basePath, 'Billing.Invoice', request);

      expect(client.put).toHaveBeenCalledWith('/api/v1/templates/Billing.Invoice', request);
      expect(result).toEqual(detail);
    });
  });

  describe('deleteDraft', () => {
    it('should call DELETE /templates/{name}/draft', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

      await deleteDraft(client, basePath, 'Billing.Invoice', 'fr-BE');

      expect(client.delete).toHaveBeenCalledWith('/api/v1/templates/Billing.Invoice/draft', {
        params: { culture: 'fr-BE' },
      });
    });
  });

  describe('publishTemplate', () => {
    it('should call POST /templates/{name}/publish', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue(axiosResponse(undefined));

      await publishTemplate(client, basePath, 'Billing.Invoice');

      expect(client.post).toHaveBeenCalledWith('/api/v1/templates/Billing.Invoice/publish', null, {
        params: { culture: undefined },
      });
    });
  });

  describe('unpublishTemplate', () => {
    it('should call POST /templates/{name}/unpublish', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue(axiosResponse(undefined));

      await unpublishTemplate(client, basePath, 'Billing.Invoice', 'fr-BE');

      expect(client.post).toHaveBeenCalledWith(
        '/api/v1/templates/Billing.Invoice/unpublish',
        null,
        { params: { culture: 'fr-BE' } }
      );
    });
  });

  describe('getLifecycleInfo', () => {
    it('should call GET /templates/{name}/lifecycle', async () => {
      const client = createMockClient();
      const info: TemplateLifecycle = {
        name: 'Billing.Invoice',
        currentStatus: TemplateLifecycleStatus.Draft,
        workflowEnabled: true,
        availableTransitions: [TemplateLifecycleStatus.Published],
      };
      vi.mocked(client.get).mockResolvedValue(axiosResponse(info));

      const result = await getLifecycleInfo(client, basePath, 'Billing.Invoice');

      expect(client.get).toHaveBeenCalledWith('/api/v1/templates/Billing.Invoice/lifecycle', {
        params: { culture: undefined },
      });
      expect(result).toEqual(info);
    });
  });

  describe('getHistory', () => {
    it('should call GET /templates/{name}/history', async () => {
      const client = createMockClient();
      const history: TemplateHistory = {
        revisions: [],
        totalCount: 0,
        page: 1,
        pageSize: 20,
      };
      vi.mocked(client.get).mockResolvedValue(axiosResponse(history));

      const result = await getHistory(client, basePath, 'Billing.Invoice', {
        page: 1,
        pageSize: 20,
      });

      expect(client.get).toHaveBeenCalledWith('/api/v1/templates/Billing.Invoice/history', {
        params: { page: 1, pageSize: 20 },
      });
      expect(result).toEqual(history);
    });
  });

  describe('getRevision', () => {
    it('should call GET /templates/{name}/history/{revisionId}', async () => {
      const client = createMockClient();
      const revision: TemplateRevision = {
        revisionId: 'rev-1',
        content: '<p>Hello</p>',
        mimeType: 'text/html',
        status: TemplateLifecycleStatus.Published,
        createdAt: '2026-03-01T10:00:00Z',
        createdBy: 'admin',
        publishedAt: '2026-03-02T10:00:00Z',
        publishedBy: 'admin',
      };
      vi.mocked(client.get).mockResolvedValue(axiosResponse(revision));

      const result = await getRevision(client, basePath, 'Billing.Invoice', 'rev-1');

      expect(client.get).toHaveBeenCalledWith('/api/v1/templates/Billing.Invoice/history/rev-1');
      expect(result).toEqual(revision);
    });
  });

  describe('previewTemplate', () => {
    it('should call POST /templates/{name}/preview', async () => {
      const client = createMockClient();
      const response: TemplatePreviewResponse = {
        html: '<p>Rendered</p>',
        revisionId: 'rev-1',
        renderTimeMs: 42,
      };
      vi.mocked(client.post).mockResolvedValue(axiosResponse(response));

      const result = await previewTemplate(client, basePath, 'Billing.Invoice', {
        data: { title: 'Test' },
      });

      expect(client.post).toHaveBeenCalledWith('/api/v1/templates/Billing.Invoice/preview', {
        data: { title: 'Test' },
      });
      expect(result).toEqual(response);
    });
  });

  describe('getVariables', () => {
    it('should call GET /templates/{name}/variables', async () => {
      const client = createMockClient();
      const variables: TemplateVariables = {
        globalVariables: [{ name: 'AppName', type: 'string' }],
        modelVariables: [],
        enrichedVariables: [],
      };
      vi.mocked(client.get).mockResolvedValue(axiosResponse(variables));

      const result = await getVariables(client, basePath, 'Billing.Invoice');

      expect(client.get).toHaveBeenCalledWith('/api/v1/templates/Billing.Invoice/variables');
      expect(result).toEqual(variables);
    });
  });

  describe('categories', () => {
    it('should call GET /template-categories', async () => {
      const client = createMockClient();
      const categories: TemplateCategory[] = [
        { id: 'cat-1', name: 'Billing', sortOrder: 1, templateCount: 5 },
      ];
      vi.mocked(client.get).mockResolvedValue(axiosResponse(categories));

      const result = await getCategories(client, basePath);

      expect(client.get).toHaveBeenCalledWith('/api/v1/templates/categories');
      expect(result).toEqual(categories);
    });

    it('should call POST /template-categories', async () => {
      const client = createMockClient();
      const request = { name: 'Billing', sortOrder: 1 };
      const category: TemplateCategory = {
        id: 'cat-1',
        name: 'Billing',
        sortOrder: 1,
        templateCount: 0,
      };
      vi.mocked(client.post).mockResolvedValue(axiosResponse(category));

      const result = await createCategory(client, basePath, request);

      expect(client.post).toHaveBeenCalledWith('/api/v1/templates/categories', request);
      expect(result).toEqual(category);
    });

    it('should call PUT /template-categories/{id}', async () => {
      const client = createMockClient();
      const request = { name: 'Updated', sortOrder: 2 };
      const category: TemplateCategory = {
        id: 'cat-1',
        name: 'Updated',
        sortOrder: 2,
        templateCount: 5,
      };
      vi.mocked(client.put).mockResolvedValue(axiosResponse(category));

      const result = await updateCategory(client, basePath, 'cat-1', request);

      expect(client.put).toHaveBeenCalledWith('/api/v1/templates/categories/cat-1', request);
      expect(result).toEqual(category);
    });

    it('should call DELETE /template-categories/{id}', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

      await deleteCategory(client, basePath, 'cat-1');

      expect(client.delete).toHaveBeenCalledWith('/api/v1/templates/categories/cat-1');
    });
  });
});
