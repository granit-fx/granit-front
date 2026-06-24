import { axiosResponse, createMockClient } from '@granit/testing';
import { toEntityId, toISODateString } from '@granit/types';
import { describe, expect, it, vi } from 'vitest';

import {
  createCategory,
  deleteCategory,
  deleteDraft,
  getCategories,
  getHistory,
  getLayouts,
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
} from '../api/templates-api';
import { TemplateLifecycleStatus } from '../types/index';

import type {
  TemplateCategory,
  TemplateDetail,
  TemplateHistory,
  TemplateLifecycle,
  TemplateListItem,
  TemplatePreviewResponse,
  TemplateRevision,
  TemplateVariables,
} from '../types/index';
import type { PagedResult } from '@granit/query-engine';

const basePath = '/api/v1/templating';

describe('templates-api', () => {
  describe('getTemplates', () => {
    it('should call GET /templates with params', async () => {
      const client = createMockClient();
      const response: PagedResult<TemplateListItem> = {
        items: [
          {
            name: 'Billing.Invoice',
            culture: null,
            layoutName: 'Layout.Email',
            currentStatus: TemplateLifecycleStatus.Draft,
            mimeType: 'text/html',
            lastModifiedAt: toISODateString('2026-03-01T10:00:00Z'),
            lastModifiedBy: 'admin',
            hasPublishedVersion: false,
          },
        ],
        totalCount: 1,
        hasMore: false,
      };
      vi.mocked(client.get).mockResolvedValue(axiosResponse(response));

      const result = await getTemplates(client, basePath, {
        status: TemplateLifecycleStatus.Draft,
      });

      expect(client.get).toHaveBeenCalledWith('/api/v1/templating/templates', {
        params: { status: TemplateLifecycleStatus.Draft },
      });
      expect(result).toEqual(response);
    });

    it('should call GET /templates without params', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(
        axiosResponse({ items: [], totalCount: 0, hasMore: false })
      );

      await getTemplates(client, basePath);

      expect(client.get).toHaveBeenCalledWith('/api/v1/templating/templates', {
        params: undefined,
      });
    });
  });

  describe('getTemplate', () => {
    it('should call GET /templates/{name} with culture', async () => {
      const client = createMockClient();
      const detail: TemplateDetail = {
        name: 'Billing.Invoice',
        culture: null,
        layoutName: 'Layout.Email',
        draft: {
          revisionId: toEntityId<'TemplateRevision'>('rev-1'),
          content: '<p>Hello</p>',
          mimeType: 'text/html',
          status: 'Draft',
          layoutName: 'Layout.Email',
          createdAt: toISODateString('2026-03-01T10:00:00Z'),
          createdBy: 'admin',
          publishedAt: null,
          publishedBy: null,
          concurrencyStamp: 'stamp-1',
        },
        published: null,
      };
      vi.mocked(client.get).mockResolvedValue(axiosResponse(detail));

      const result = await getTemplate(client, basePath, 'Billing.Invoice', 'fr-BE');

      expect(client.get).toHaveBeenCalledWith('/api/v1/templating/templates/Billing.Invoice', {
        params: { culture: 'fr-BE' },
      });
      expect(result).toEqual(detail);
    });
  });

  describe('saveDraft', () => {
    it('should call POST /templates', async () => {
      const client = createMockClient();
      const request = { name: 'Billing.Invoice', content: '<p>Hello</p>' };
      const detail: TemplateDetail = {
        name: 'Billing.Invoice',
        culture: null,
        layoutName: null,
        draft: null,
        published: null,
      };
      vi.mocked(client.post).mockResolvedValue(axiosResponse(detail));

      const result = await saveDraft(client, basePath, request);

      expect(client.post).toHaveBeenCalledWith('/api/v1/templating/templates', request);
      expect(result).toEqual(detail);
    });
  });

  describe('updateDraft', () => {
    it('should call PUT /templates/{name}', async () => {
      const client = createMockClient();
      const request = { name: 'Billing.Invoice', content: '<p>Updated</p>' };
      const detail: TemplateDetail = {
        name: 'Billing.Invoice',
        culture: null,
        layoutName: null,
        draft: null,
        published: null,
      };
      vi.mocked(client.put).mockResolvedValue(axiosResponse(detail));

      const result = await updateDraft(client, basePath, 'Billing.Invoice', request);

      expect(client.put).toHaveBeenCalledWith(
        '/api/v1/templating/templates/Billing.Invoice',
        request
      );
      expect(result).toEqual(detail);
    });
  });

  describe('deleteDraft', () => {
    it('should call DELETE /templates/{name}/draft', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

      await deleteDraft(client, basePath, 'Billing.Invoice', 'fr-BE');

      expect(client.delete).toHaveBeenCalledWith(
        '/api/v1/templating/templates/Billing.Invoice/draft',
        {
          params: { culture: 'fr-BE' },
        }
      );
    });
  });

  describe('publishTemplate', () => {
    it('should call POST /templates/{name}/publish and return detail', async () => {
      const client = createMockClient();
      const detail: TemplateDetail = {
        name: 'Billing.Invoice',
        culture: null,
        layoutName: null,
        draft: null,
        published: null,
      };
      vi.mocked(client.post).mockResolvedValue(axiosResponse(detail));

      const result = await publishTemplate(client, basePath, 'Billing.Invoice');

      expect(client.post).toHaveBeenCalledWith(
        '/api/v1/templating/templates/Billing.Invoice/publish',
        null,
        {
          params: { culture: undefined },
        }
      );
      expect(result).toEqual(detail);
    });
  });

  describe('unpublishTemplate', () => {
    it('should call POST /templates/{name}/unpublish', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue(axiosResponse(undefined));

      await unpublishTemplate(client, basePath, 'Billing.Invoice', 'fr-BE');

      expect(client.post).toHaveBeenCalledWith(
        '/api/v1/templating/templates/Billing.Invoice/unpublish',
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
        culture: null,
        currentStatus: 'Draft',
        workflowEnabled: true,
        availableTransitions: ['Published'],
      };
      vi.mocked(client.get).mockResolvedValue(axiosResponse(info));

      const result = await getLifecycleInfo(client, basePath, 'Billing.Invoice');

      expect(client.get).toHaveBeenCalledWith(
        '/api/v1/templating/templates/Billing.Invoice/lifecycle',
        {
          params: { culture: undefined },
        }
      );
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

      expect(client.get).toHaveBeenCalledWith(
        '/api/v1/templating/templates/Billing.Invoice/history',
        {
          params: { page: 1, pageSize: 20 },
        }
      );
      expect(result).toEqual(history);
    });
  });

  describe('getRevision', () => {
    it('should call GET /templates/{name}/history/{revisionId}', async () => {
      const client = createMockClient();
      const revision: TemplateRevision = {
        revisionId: toEntityId<'TemplateRevision'>('rev-1'),
        content: '<p>Hello</p>',
        mimeType: 'text/html',
        status: 'Published',
        layoutName: null,
        createdAt: toISODateString('2026-03-01T10:00:00Z'),
        createdBy: 'admin',
        publishedAt: toISODateString('2026-03-02T10:00:00Z'),
        publishedBy: 'admin',
        concurrencyStamp: 'stamp-2',
      };
      vi.mocked(client.get).mockResolvedValue(axiosResponse(revision));

      const result = await getRevision(client, basePath, 'Billing.Invoice', 'rev-1');

      expect(client.get).toHaveBeenCalledWith(
        '/api/v1/templating/templates/Billing.Invoice/history/rev-1'
      );
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

      expect(client.post).toHaveBeenCalledWith(
        '/api/v1/templating/templates/Billing.Invoice/preview',
        {
          data: { title: 'Test' },
        }
      );
      expect(result).toEqual(response);
    });
  });

  describe('getVariables', () => {
    it('should call GET /templates/{name}/variables', async () => {
      const client = createMockClient();
      const variables: TemplateVariables = {
        globalVariables: [{ name: 'AppName', type: 'string', description: null }],
        modelVariables: [],
        enrichedVariables: [],
      };
      vi.mocked(client.get).mockResolvedValue(axiosResponse(variables));

      const result = await getVariables(client, basePath, 'Billing.Invoice');

      expect(client.get).toHaveBeenCalledWith(
        '/api/v1/templating/templates/Billing.Invoice/variables'
      );
      expect(result).toEqual(variables);
    });
  });

  describe('getLayouts', () => {
    it('should call GET /layouts', async () => {
      const client = createMockClient();
      const layouts = ['Layout.Email', 'Layout.Pdf', 'Layout.Letter'];
      vi.mocked(client.get).mockResolvedValue(axiosResponse(layouts));

      const result = await getLayouts(client, basePath);

      expect(client.get).toHaveBeenCalledWith('/api/v1/templating/layouts');
      expect(result).toEqual(layouts);
    });

    it('should return empty array when no layouts exist', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse([]));

      const result = await getLayouts(client, basePath);

      expect(result).toEqual([]);
    });
  });

  describe('categories', () => {
    it('should call GET /categories', async () => {
      const client = createMockClient();
      const categories: TemplateCategory[] = [
        {
          id: toEntityId<'TemplateCategory'>('cat-1'),
          name: 'Billing',
          description: null,
          icon: null,
          sortOrder: 1,
          templateCount: 5,
        },
      ];
      vi.mocked(client.get).mockResolvedValue(axiosResponse(categories));

      const result = await getCategories(client, basePath);

      expect(client.get).toHaveBeenCalledWith('/api/v1/templating/categories');
      expect(result).toEqual(categories);
    });

    it('should call POST /categories', async () => {
      const client = createMockClient();
      const request = { name: 'Billing', sortOrder: 1 };
      const category: TemplateCategory = {
        id: toEntityId<'TemplateCategory'>('cat-1'),
        name: 'Billing',
        description: null,
        icon: null,
        sortOrder: 1,
        templateCount: 0,
      };
      vi.mocked(client.post).mockResolvedValue(axiosResponse(category));

      const result = await createCategory(client, basePath, request);

      expect(client.post).toHaveBeenCalledWith('/api/v1/templating/categories', request);
      expect(result).toEqual(category);
    });

    it('should call PUT /categories/{id}', async () => {
      const client = createMockClient();
      const request = { name: 'Updated', sortOrder: 2 };
      const category: TemplateCategory = {
        id: toEntityId<'TemplateCategory'>('cat-1'),
        name: 'Updated',
        description: null,
        icon: null,
        sortOrder: 2,
        templateCount: 5,
      };
      vi.mocked(client.put).mockResolvedValue(axiosResponse(category));

      const result = await updateCategory(client, basePath, 'cat-1', request);

      expect(client.put).toHaveBeenCalledWith('/api/v1/templating/categories/cat-1', request);
      expect(result).toEqual(category);
    });

    it('should call DELETE /categories/{id}', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

      await deleteCategory(client, basePath, 'cat-1');

      expect(client.delete).toHaveBeenCalledWith('/api/v1/templating/categories/cat-1');
    });
  });
});
