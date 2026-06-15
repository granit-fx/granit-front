import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import { mockPromptPicker, mockPromptSummaries, mockSystemPrompt, mockUserPrompt } from './data';

import type {
  CreatePromptRequest,
  PromptResponse,
  PromptSummaryResponse,
  UpdatePromptRequest,
} from '@granit/ai-prompts';
import type { Mutable } from '@granit/testing';

const PROMPTS: Record<string, PromptResponse> = {
  [mockSystemPrompt.id]: mockSystemPrompt,
  [mockUserPrompt.id]: mockUserPrompt,
};

/**
 * Create stateful MSW handlers for the prompt-catalogue endpoints. Create /
 * update / delete / customise mutate an in-memory list reflected by subsequent
 * GETs. System prompts are read-only: PUT / DELETE return 404; customising a
 * non-system prompt returns 409.
 *
 * @param baseUrl - API base path (default: `/api/v1/prompts`).
 */
export function createAIPromptsHandlers(baseUrl = DEFAULT_BASE_PATH) {
  let summaries: Mutable<PromptSummaryResponse>[] = [...mockPromptSummaries];
  const details: Record<string, PromptResponse> = { ...PROMPTS };
  let created = 0;

  return [
    // GET /prompts/picker — before /:id so it is not swallowed.
    http.get(`${baseUrl}/picker`, () => HttpResponse.json(mockPromptPicker)),

    // GET /prompts — summaries (system first).
    http.get(baseUrl, () => HttpResponse.json(summaries)),

    // GET /prompts/:id — full prompt.
    http.get(`${baseUrl}/:id`, ({ params }) => {
      const prompt = details[params.id as string];
      if (!prompt) return new HttpResponse(null, { status: 404 });
      return HttpResponse.json(prompt);
    }),

    // POST /prompts — create.
    http.post(baseUrl, async ({ request }) => {
      const body = (await request.json()) as CreatePromptRequest;
      created++;
      const id = `5aaaaaaa-0000-0000-0000-${String(created).padStart(12, '0')}`;
      const prompt: PromptResponse = {
        id: id as PromptResponse['id'],
        name: body.name,
        shortDescription: body.shortDescription ?? '',
        content: body.content,
        icon: body.icon ?? null,
        iconColor: body.iconColor ?? null,
        version: 1,
        isSystem: false,
        ownerId: mockUserPrompt.ownerId,
        categoryIds: body.categoryIds ?? [],
        createdAt: mockUserPrompt.createdAt,
        modifiedAt: null,
      };
      details[id] = prompt;
      summaries = [
        ...summaries,
        {
          id: prompt.id,
          name: prompt.name,
          shortDescription: prompt.shortDescription,
          icon: prompt.icon,
          iconColor: prompt.iconColor,
          isSystem: false,
          categoryIds: prompt.categoryIds,
        },
      ];
      return HttpResponse.json(prompt, { status: 201 });
    }),

    // POST /prompts/:id/customise — clone a system prompt.
    http.post(`${baseUrl}/:id/customise`, ({ params }) => {
      const source = details[params.id as string];
      if (!source) return new HttpResponse(null, { status: 404 });
      if (!source.isSystem) {
        return HttpResponse.json(
          { title: 'Conflict', status: 409, detail: 'Only system prompts can be customised.' },
          { status: 409 }
        );
      }
      created++;
      const id = `5bbbbbbb-0000-0000-0000-${String(created).padStart(12, '0')}`;
      const clone: PromptResponse = {
        ...source,
        id: id as PromptResponse['id'],
        isSystem: false,
        ownerId: mockUserPrompt.ownerId,
        version: 1,
      };
      details[id] = clone;
      summaries = [
        ...summaries,
        {
          id: clone.id,
          name: clone.name,
          shortDescription: clone.shortDescription,
          icon: clone.icon,
          iconColor: clone.iconColor,
          isSystem: false,
          categoryIds: clone.categoryIds,
        },
      ];
      return HttpResponse.json(clone, { status: 201 });
    }),

    // PUT /prompts/:id — update (system prompts are read-only → 404).
    http.put(`${baseUrl}/:id`, async ({ params, request }) => {
      const existing = details[params.id as string];
      if (!existing || existing.isSystem) return new HttpResponse(null, { status: 404 });
      const body = (await request.json()) as UpdatePromptRequest;
      const updated: PromptResponse = {
        ...existing,
        name: body.name,
        content: body.content,
        shortDescription: body.shortDescription ?? '',
        icon: body.icon ?? null,
        iconColor: body.iconColor ?? null,
        categoryIds: body.categoryIds ?? [],
        version: existing.version + 1,
      };
      details[existing.id] = updated;
      summaries = summaries.map((s) =>
        s.id === existing.id
          ? { ...s, name: updated.name, shortDescription: updated.shortDescription }
          : s
      );
      return HttpResponse.json(updated);
    }),

    // DELETE /prompts/:id — delete (system prompts → 404).
    http.delete(`${baseUrl}/:id`, ({ params }) => {
      const existing = details[params.id as string];
      if (!existing || existing.isSystem) return new HttpResponse(null, { status: 404 });
      delete details[existing.id];
      summaries = summaries.filter((s) => s.id !== existing.id);
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}
