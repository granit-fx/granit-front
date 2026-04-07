import { groupBy as groupByField, paginate } from '@granit/testing/msw';
import { http, HttpResponse } from 'msw';

import { mockUsageRecords, mockWorkspaces } from './data.js';

import type {
  AIWorkspaceCreateRequest,
  AIWorkspaceResponse,
  AIWorkspaceUpdateRequest,
} from '@granit/ai';
import type { PagedResult, QueryMetadata } from '@granit/query-engine';
import type { Mutable } from '@granit/testing';

// ---------------------------------------------------------------------------
// Query metadata for usage endpoint (Granit.QueryEngine contract)
// ---------------------------------------------------------------------------

function buildUsageMeta(): QueryMetadata {
  return {
    columns: [
      {
        name: 'workspaceName',
        label: 'Workspace',
        type: 'String',
        order: 1,
        isSortable: true,
        isFilterable: true,
        isVisible: true,
      },
      {
        name: 'provider',
        label: 'Provider',
        type: 'String',
        order: 2,
        isSortable: true,
        isFilterable: true,
        isVisible: true,
      },
      {
        name: 'model',
        label: 'Model',
        type: 'String',
        order: 3,
        isSortable: true,
        isFilterable: true,
        isVisible: true,
      },
      {
        name: 'inputTokens',
        label: 'Input Tokens',
        type: 'Number',
        order: 4,
        isSortable: true,
        isFilterable: false,
        isVisible: true,
      },
      {
        name: 'outputTokens',
        label: 'Output Tokens',
        type: 'Number',
        order: 5,
        isSortable: true,
        isFilterable: false,
        isVisible: true,
      },
      {
        name: 'estimatedCostUsd',
        label: 'Est. Cost (USD)',
        type: 'Number',
        order: 6,
        isSortable: true,
        isFilterable: false,
        isVisible: true,
      },
      {
        name: 'timestamp',
        label: 'Timestamp',
        type: 'DateTime',
        order: 7,
        isSortable: true,
        isFilterable: true,
        isVisible: true,
      },
      {
        name: 'duration',
        label: 'Duration',
        type: 'String',
        order: 8,
        isSortable: false,
        isFilterable: false,
        isVisible: true,
      },
    ],
    filterableFields: [
      { name: 'workspaceName', type: 'String', operators: ['Eq', 'Contains', 'In'] },
      { name: 'provider', type: 'String', operators: ['Eq', 'In'] },
      { name: 'model', type: 'String', operators: ['Eq', 'In'] },
      { name: 'timestamp', type: 'DateTime', operators: ['Gte', 'Lte'] },
    ],
    sortableFields: [
      { name: 'timestamp' },
      { name: 'inputTokens' },
      { name: 'outputTokens' },
      { name: 'estimatedCostUsd' },
    ],
    presetFilterGroups: [
      {
        name: 'provider',
        label: 'Provider',
        presets: [
          { name: 'openai', label: 'OpenAI', isDefault: false },
          { name: 'azureopenai', label: 'Azure OpenAI', isDefault: false },
          { name: 'ollama', label: 'Ollama', isDefault: false },
        ],
      },
    ],
    quickFilters: [],
    dateFilters: [],
    groupByFields: [
      { name: 'workspaceName', type: 'String' },
      { name: 'provider', type: 'String' },
      { name: 'model', type: 'String' },
    ],
    pagination: {
      defaultPageSize: 20,
      maxPageSize: 100,
      maxStreamSize: 1000,
      supportsCursor: false,
    },
  };
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/**
 * Create stateful MSW handlers for AI endpoints (workspaces, chat, embeddings, usage).
 * Mutations to workspaces are reflected in subsequent GET calls.
 *
 * @param baseUrl - API base path (default: `/api/v1/ai`)
 */
export function createAIHandlers(baseUrl = '/api/v1/ai') {
  let workspaces: Mutable<AIWorkspaceResponse>[] = [...mockWorkspaces];

  return [
    // --- Workspaces -----------------------------------------------------------

    // GET list
    http.get(`${baseUrl}/workspaces`, () => {
      return HttpResponse.json({
        workspaces: workspaces,
        totalCount: workspaces.length,
      });
    }),

    // GET single
    http.get(`${baseUrl}/workspaces/:name`, ({ params }) => {
      const ws = workspaces.find((w) => w.name === params.name);
      if (!ws) return new HttpResponse(null, { status: 404 });
      return HttpResponse.json(ws);
    }),

    // POST create
    http.post(`${baseUrl}/workspaces`, async ({ request }) => {
      const body = (await request.json()) as AIWorkspaceCreateRequest;

      if (workspaces.some((w) => w.name === body.name)) {
        return HttpResponse.json(
          {
            title: 'Conflict',
            status: 409,
            detail: `A workspace named '${body.name}' already exists.`,
          },
          { status: 409 }
        );
      }

      const created: AIWorkspaceResponse = {
        name: body.name,
        provider: body.provider,
        model: body.model,
        systemPrompt: body.systemPrompt ?? null,
        temperature: body.temperature ?? null,
        maxOutputTokens: body.maxOutputTokens ?? null,
        kind: 'Dynamic',
        isActive: true,
      };

      workspaces = [...workspaces, created];
      return HttpResponse.json(created, { status: 201 });
    }),

    // PUT update
    http.put(`${baseUrl}/workspaces/:name`, async ({ params, request }) => {
      const name = params.name as string;
      const index = workspaces.findIndex((w) => w.name === name);

      if (index === -1) return new HttpResponse(null, { status: 404 });

      const existing = workspaces[index]!;

      if (existing.kind === 'System') {
        return HttpResponse.json(
          {
            title: 'Unprocessable Entity',
            status: 422,
            detail: `System workspace '${name}' cannot be modified.`,
          },
          { status: 422 }
        );
      }

      const body = (await request.json()) as AIWorkspaceUpdateRequest;
      const updated: AIWorkspaceResponse = {
        ...existing,
        provider: body.provider,
        model: body.model,
        systemPrompt: body.systemPrompt ?? null,
        temperature: body.temperature ?? null,
        maxOutputTokens: body.maxOutputTokens ?? null,
        isActive: body.isActive,
      };

      workspaces = workspaces.map((w) => (w.name === name ? updated : w));
      return HttpResponse.json(updated);
    }),

    // DELETE
    http.delete(`${baseUrl}/workspaces/:name`, ({ params }) => {
      const name = params.name as string;
      const ws = workspaces.find((w) => w.name === name);

      if (!ws) return new HttpResponse(null, { status: 404 });

      if (ws.kind === 'System') {
        return HttpResponse.json(
          {
            title: 'Unprocessable Entity',
            status: 422,
            detail: `System workspace '${name}' cannot be deleted.`,
          },
          { status: 422 }
        );
      }

      workspaces = workspaces.filter((w) => w.name !== name);
      return new HttpResponse(null, { status: 204 });
    }),

    // --- Chat -----------------------------------------------------------------

    http.post(`${baseUrl}/chat/:workspaceName`, async ({ params, request }) => {
      const wsName = params.workspaceName as string;
      const ws = workspaces.find((w) => w.name === wsName);

      if (!ws) {
        return HttpResponse.json(
          { title: 'Not Found', status: 404, detail: `AI workspace '${wsName}' was not found.` },
          { status: 404 }
        );
      }

      const body = (await request.json()) as { messages: { role: string; content: string }[] };
      const lastMessage = body.messages.at(-1)?.content ?? '';

      return HttpResponse.json({
        workspaceName: wsName,
        model: ws.model,
        content: `Mock response to: "${lastMessage.slice(0, 50)}${lastMessage.length > 50 ? '...' : ''}"`,
        usage: {
          inputTokens: Math.ceil(lastMessage.length / 4),
          outputTokens: 42,
          estimatedCostUsd: 0.0012,
        },
        duration: '00:00:00.350',
      });
    }),

    // --- Embeddings -----------------------------------------------------------

    http.post(`${baseUrl}/embeddings/:workspaceName`, async ({ params, request }) => {
      const wsName = params.workspaceName as string;
      const ws = workspaces.find((w) => w.name === wsName);

      if (!ws) {
        return HttpResponse.json(
          { title: 'Not Found', status: 404, detail: `AI workspace '${wsName}' was not found.` },
          { status: 404 }
        );
      }

      const body = (await request.json()) as { inputs: string[] };

      return HttpResponse.json({
        workspaceName: wsName,
        model: ws.model,
        embeddings: body.inputs.map((_, i) => ({
          index: i,
          vector: Array.from({ length: 8 }, () => Math.random() * 2 - 1),
        })),
      });
    }),

    // --- Usage tracking (Granit.QueryEngine) ----------------------------------

    http.get(`${baseUrl}/usage/meta`, () => {
      return HttpResponse.json(buildUsageMeta());
    }),

    http.get(`${baseUrl}/usage`, ({ request }) => {
      const url = new URL(request.url);
      const groupBy = url.searchParams.get('groupBy');

      const records = [...mockUsageRecords];

      // Basic sorting by timestamp desc
      records.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

      // GroupBy support
      if (groupBy) {
        return HttpResponse.json(
          groupByField(records as unknown as Record<string, unknown>[], groupBy)
        );
      }

      const response: PagedResult<(typeof records)[0]> = paginate(records, url);
      return HttpResponse.json(response);
    }),
  ];
}
