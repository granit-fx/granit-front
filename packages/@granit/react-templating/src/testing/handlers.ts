import { TemplateLifecycleStatus } from '@granit/templating';
import { noContent, notFound } from '@granit/testing/msw';
import { http, HttpResponse } from 'msw';

import {
  mockTemplateCategories,
  mockTemplatesData,
  toTemplateDetail,
  toTemplateListItem,
} from './data.js';

import type { MockTemplate } from './data.js';
import type { SaveTemplateCategoryRequest, TemplateCategory } from '@granit/templating';

/**
 * Create stateful MSW handlers for templating endpoints.
 * Handlers mutate in-memory state — mutations are reflected by subsequent GETs.
 *
 * @param baseUrl - API base path (default: `/api/v1`)
 */
export function createTemplatesHandlers(baseUrl = '/api/v1') {
  const BASE = `${baseUrl}/templates`;

  let templates = [...mockTemplatesData];
  const categories = [...mockTemplateCategories];
  let nextCatIdx = categories.length + 1;

  return [
    // ── Static routes MUST come before parameterized /:name routes ────────────

    // Layouts
    http.get(`${BASE}/layouts`, () =>
      HttpResponse.json(['Layout.Email', 'Layout.Pdf', 'Layout.Letter'])
    ),

    // Categories — list
    http.get(`${BASE}/categories`, () => HttpResponse.json(categories)),

    // Categories — create
    http.post(`${BASE}/categories`, async ({ request }) => {
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
    http.put(`${BASE}/categories/:id`, async ({ params, request }) => {
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
    http.delete(`${BASE}/categories/:id`, ({ params }) => {
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
      if (!template.hasPublishedVersion) {
        templates = templates.filter((t) => t.name !== name);
      } else {
        template.status = TemplateLifecycleStatus.Published;
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
            revisionId: `rev_${name.replace(/\./g, '_')}_1`,
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
        html = html.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), String(value));
      }
      return HttpResponse.json({
        html,
        revisionId: `rev_${name.replace(/\./g, '_')}_1`,
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
