import {
  DATE_OPERATORS,
  ENUM_OPERATORS,
  BOOLEAN_OPERATORS,
  STRING_OPERATORS,
} from '@granit/query-engine';
import { createQueryMetaHandler } from '@granit/react-query-engine/testing';
import { TemplateLifecycleStatus } from '@granit/templating';
import { noContent, notFound } from '@granit/testing/msw';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import {
  mockTemplateCategories,
  mockTemplatesData,
  toTemplateDetail,
  toTemplateListItem,
} from './data';

import type { MockTemplate } from './data';
import type { QueryMetadata } from '@granit/query-engine';
import type { SaveTemplateCategoryRequest, TemplateCategory } from '@granit/templating';

/**
 * Mock /meta payload for the templates resource.
 * NOTE: `lifecycleStatus` is a numeric enum on the wire (Int32) — see TemplateLifecycleStatus.
 */
export const templateQueryMetadata: QueryMetadata = {
  columns: [
    {
      name: 'name',
      label: 'Name',
      type: 'String',
      order: 0,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'culture',
      label: 'Culture',
      type: 'String',
      order: 1,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'category',
      label: 'Category',
      type: 'String',
      order: 2,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'layoutName',
      label: 'Layout',
      type: 'String',
      order: 3,
      isSortable: false,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'currentStatus',
      label: 'Status',
      type: 'Int32',
      order: 4,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'mimeType',
      label: 'MIME type',
      type: 'String',
      order: 5,
      isSortable: false,
      isFilterable: true,
      isVisible: false,
    },
    {
      name: 'hasPublishedVersion',
      label: 'Published',
      type: 'Boolean',
      order: 6,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'lastModifiedAt',
      label: 'Modified at',
      type: 'DateTime',
      order: 7,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'lastModifiedBy',
      label: 'Modified by',
      type: 'String',
      order: 8,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
  ],
  filterableFields: [
    { name: 'name', type: 'String', operators: STRING_OPERATORS },
    { name: 'culture', type: 'String', operators: ENUM_OPERATORS },
    { name: 'category', type: 'String', operators: STRING_OPERATORS },
    { name: 'layoutName', type: 'String', operators: STRING_OPERATORS },
    { name: 'currentStatus', type: 'Int32', operators: ENUM_OPERATORS },
    { name: 'mimeType', type: 'String', operators: ENUM_OPERATORS },
    { name: 'hasPublishedVersion', type: 'Boolean', operators: BOOLEAN_OPERATORS },
    { name: 'lastModifiedAt', type: 'DateTime', operators: DATE_OPERATORS },
    { name: 'lastModifiedBy', type: 'String', operators: STRING_OPERATORS },
  ],
  sortableFields: [
    { name: 'name' },
    { name: 'culture' },
    { name: 'category' },
    { name: 'currentStatus' },
    { name: 'hasPublishedVersion' },
    { name: 'lastModifiedAt' },
    { name: 'lastModifiedBy' },
  ],
  presetFilterGroups: [],
  quickFilters: [
    { name: 'draft', label: 'Drafts', isDefault: false },
    { name: 'published', label: 'Published', isDefault: true },
    { name: 'archived', label: 'Archived', isDefault: false },
  ],
  dateFilters: [],
  groupByFields: [
    { name: 'category', type: 'String' },
    { name: 'currentStatus', type: 'Int32' },
    { name: 'culture', type: 'String' },
  ],
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
    maxStreamSize: 10_000,
    supportsCursor: false,
  },
  defaultSort: 'name',
};

/**
 * Create stateful MSW handlers for templating endpoints.
 * Handlers mutate in-memory state — mutations are reflected by subsequent GETs.
 *
 * @param baseUrl - API base path (default: `/api/v1/templating`)
 */
export function createTemplatesHandlers(baseUrl = DEFAULT_BASE_PATH) {
  const BASE = `${baseUrl}/templates`;

  let templates = [...mockTemplatesData];
  const categories = [...mockTemplateCategories];
  let nextCatIdx = categories.length + 1;

  return [
    // GET /templates/meta — query metadata
    createQueryMetaHandler(BASE, templateQueryMetadata),

    // ── Static routes MUST come before parameterized /:name routes ────────────

    // Layouts
    http.get(`${BASE}/layouts`, () =>
      HttpResponse.json(['Layout.Email', 'Layout.Pdf', 'Layout.Letter'])
    ),

    // Categories — list. Categories are a sibling module resource, not nested
    // under /templates, matching the backend path `/api/v1/templating/categories`.
    http.get(`${baseUrl}/categories`, () => HttpResponse.json(categories)),

    // Categories — create
    http.post(`${baseUrl}/categories`, async ({ request }) => {
      const body = (await request.json()) as SaveTemplateCategoryRequest;
      const newCat: (typeof categories)[number] = {
        id: `cat_${nextCatIdx++}` as TemplateCategory['id'],
        name: body.name,
        description: body.description,
        icon: body.icon,
        sortOrder: body.sortOrder ?? categories.length + 1,
        templateCount: 0,
      };
      categories.push(newCat);
      return HttpResponse.json(newCat, { status: 201 });
    }),

    // Categories — update
    http.put(`${baseUrl}/categories/:id`, async ({ params, request }) => {
      const cat = categories.find((c) => c.id === params.id);
      if (!cat) return notFound();
      const body = (await request.json()) as SaveTemplateCategoryRequest;
      if (body.name !== undefined) cat.name = body.name;
      if (body.description !== undefined) cat.description = body.description;
      if (body.icon !== undefined) cat.icon = body.icon;
      if (body.sortOrder !== undefined) cat.sortOrder = body.sortOrder;
      return HttpResponse.json(cat);
    }),

    // Categories — delete
    http.delete(`${baseUrl}/categories/:id`, ({ params }) => {
      const idx = categories.findIndex((c) => c.id === params.id);
      if (idx === -1) return notFound();
      categories.splice(idx, 1);
      return noContent();
    }),

    // ── List templates (paginated) ─────────────────────────────────────────────

    http.get(BASE, ({ request }) => {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get('page') ?? 1);
      const pageSize = Number(url.searchParams.get('pageSize') ?? 20);
      const search = url.searchParams.get('search');

      let filtered = [...templates];
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter((t) => t.name.toLowerCase().includes(q));
      }

      filtered.sort((a, b) => a.name.localeCompare(b.name));

      const start = (page - 1) * pageSize;
      const items = filtered.slice(start, start + pageSize).map(toTemplateListItem);

      return HttpResponse.json({
        items,
        totalCount: filtered.length,
      });
    }),

    // ── Create template (save draft) ───────────────────────────────────────────

    http.post(BASE, async ({ request }) => {
      const body = (await request.json()) as Partial<MockTemplate>;
      const newTemplate: MockTemplate = {
        name: body.name ?? 'Unnamed.Template',
        culture: body.culture,
        category: body.category,
        layoutName: body.layoutName,
        content: body.content ?? '',
        mimeType: body.mimeType ?? 'text/html',
        status: TemplateLifecycleStatus.Draft,
        lastModifiedAt: new Date().toISOString(),
        lastModifiedBy: 'test@granit.local',
        hasPublishedVersion: false,
      };
      templates.push(newTemplate);
      return HttpResponse.json(toTemplateDetail(newTemplate), { status: 201 });
    }),

    // ── Parameterized /:name sub-routes (static sub-paths first) ──────────────

    // Delete draft
    http.delete(`${BASE}/:name/draft`, ({ params }) => {
      const name = params.name as string;
      const template = templates.find((t) => t.name === name);
      if (!template) return notFound();
      if (template.hasPublishedVersion) {
        template.status = TemplateLifecycleStatus.Published;
      } else {
        templates = templates.filter((t) => t.name !== name);
      }
      return noContent();
    }),

    // Publish
    http.post(`${BASE}/:name/publish`, ({ params }) => {
      const name = params.name as string;
      const template = templates.find((t) => t.name === name);
      if (!template) return notFound();
      template.status = TemplateLifecycleStatus.Published;
      template.hasPublishedVersion = true;
      return noContent();
    }),

    // Unpublish
    http.post(`${BASE}/:name/unpublish`, ({ params }) => {
      const name = params.name as string;
      const template = templates.find((t) => t.name === name);
      if (!template) return notFound();
      template.status = TemplateLifecycleStatus.Archived;
      return noContent();
    }),

    // Lifecycle info
    http.get(`${BASE}/:name/lifecycle`, ({ params }) => {
      const name = params.name as string;
      const template = templates.find((t) => t.name === name);
      if (!template) return notFound();

      const transitions: number[] = [];
      if (template.status === TemplateLifecycleStatus.Draft) {
        transitions.push(TemplateLifecycleStatus.Published);
      }
      if (template.status === TemplateLifecycleStatus.Published) {
        transitions.push(TemplateLifecycleStatus.Archived);
      }
      if (template.status === TemplateLifecycleStatus.Archived) {
        transitions.push(TemplateLifecycleStatus.Draft);
      }

      return HttpResponse.json({
        name: template.name,
        culture: template.culture,
        currentStatus: template.status,
        workflowEnabled: false,
        availableTransitions: transitions,
      });
    }),

    // History
    http.get(`${BASE}/:name/history`, ({ params }) => {
      const name = params.name as string;
      const template = templates.find((t) => t.name === name);
      if (!template) return notFound();
      return HttpResponse.json({
        revisions: [
          {
            revisionId: `rev_${name.replaceAll('.', '_')}_1`,
            status: template.status,
            createdAt: template.lastModifiedAt,
            createdBy: template.lastModifiedBy,
            mimeType: template.mimeType,
            contentLength: template.content.length,
          },
        ],
        totalCount: 1,
        page: 1,
        pageSize: 20,
      });
    }),

    // Get revision
    http.get(`${BASE}/:name/history/:revisionId`, ({ params }) => {
      const name = params.name as string;
      const template = templates.find((t) => t.name === name);
      if (!template) return notFound();
      return HttpResponse.json({
        revisionId: params.revisionId,
        content: template.content,
        mimeType: template.mimeType,
        layoutName: template.layoutName ?? null,
        status: template.status,
        createdAt: template.lastModifiedAt,
        createdBy: template.lastModifiedBy,
      });
    }),

    // Preview (JSON)
    http.post(`${BASE}/:name/preview`, async ({ params, request }) => {
      const name = params.name as string;
      const template = templates.find((t) => t.name === name);
      if (!template) return notFound();
      const body = (await request.json()) as Record<string, unknown>;
      const data = (body.data ?? {}) as Record<string, unknown>;
      let html = template.content;
      for (const [key, value] of Object.entries(data)) {
        html = html.replaceAll(new RegExp(String.raw`\{\{\s*${key}\s*\}\}`, 'g'), String(value));
      }
      return HttpResponse.json({
        html,
        revisionId: `rev_${name.replaceAll('.', '_')}_1`,
        renderTimeMs: 12,
      });
    }),

    // Variables
    http.get(`${BASE}/:name/variables`, ({ params }) => {
      const name = params.name as string;
      const template = templates.find((t) => t.name === name);
      if (!template) return notFound();

      const varRegex = /\{\{\s*([\w.]+)\s*\}\}/g;
      const vars: string[] = [];
      let match;
      while ((match = varRegex.exec(template.content)) !== null) {
        const varName = match[1];
        if (varName !== undefined && !vars.includes(varName)) vars.push(varName);
      }

      return HttpResponse.json({
        globalVariables: [
          { name: 'app.name', type: 'String' },
          { name: 'app.url', type: 'String' },
          { name: 'now.date', type: 'DateTime', description: 'Current date' },
          { name: 'now.year', type: 'Int32', description: 'Current year' },
        ],
        modelVariables: vars.map((v) => ({ name: v, type: 'String' })),
        enrichedVariables: [],
      });
    }),

    // ── Get / Update single template ──────────────────────────────────────────

    http.get(`${BASE}/:name`, ({ params }) => {
      const name = params.name as string;
      const template = templates.find((t) => t.name === name);
      if (!template) return notFound();
      return HttpResponse.json(toTemplateDetail(template));
    }),

    http.put(`${BASE}/:name`, async ({ params, request }) => {
      const name = params.name as string;
      const template = templates.find((t) => t.name === name);
      if (!template) return notFound();
      const body = (await request.json()) as Partial<MockTemplate>;
      if (body.content !== undefined) template.content = body.content;
      if (body.mimeType !== undefined) template.mimeType = body.mimeType;
      if (body.category !== undefined) template.category = body.category;
      if ('layoutName' in body) template.layoutName = body.layoutName;
      if (body.culture !== undefined) template.culture = body.culture;
      template.lastModifiedAt = new Date().toISOString();
      template.status = TemplateLifecycleStatus.Draft;
      return HttpResponse.json(toTemplateDetail(template));
    }),
  ];
}
