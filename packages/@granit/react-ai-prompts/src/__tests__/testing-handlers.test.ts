import { createMswServer } from '@granit/testing/msw-server';
import { describe, expect, it } from 'vitest';

import { mockSystemPrompt, mockUserPrompt } from '../testing/data';
import { createAIPromptsHandlers } from '../testing/index';

import type { PromptResponse } from '@granit/ai-prompts';

const BASE = 'http://api.test/api/v1/prompts';
const server = createMswServer();

describe('createAIPromptsHandlers', () => {
  it('serves the grouped picker (not swallowed by /:id)', async () => {
    server.use(...createAIPromptsHandlers(BASE));
    const response = await fetch(`${BASE}/picker`);
    const body = (await response.json()) as { categories: unknown[] };
    expect(body.categories).toHaveLength(2);
  });

  it('rejects PUT on a system prompt with 404 (read-only)', async () => {
    server.use(...createAIPromptsHandlers(BASE));
    const response = await fetch(`${BASE}/${mockSystemPrompt.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hack', content: 'nope' }),
    });
    expect(response.status).toBe(404);
  });

  it('customises a system prompt into a private editable copy', async () => {
    server.use(...createAIPromptsHandlers(BASE));
    const response = await fetch(`${BASE}/${mockSystemPrompt.id}/customise`, { method: 'POST' });
    expect(response.status).toBe(201);
    const clone = (await response.json()) as PromptResponse;
    expect(clone.isSystem).toBe(false);
    expect(clone.id).not.toBe(mockSystemPrompt.id);
  });

  it('returns 409 when customising a non-system prompt', async () => {
    server.use(...createAIPromptsHandlers(BASE));
    const response = await fetch(`${BASE}/${mockUserPrompt.id}/customise`, { method: 'POST' });
    expect(response.status).toBe(409);
  });

  it('deletes a user prompt and reflects it in the list', async () => {
    server.use(...createAIPromptsHandlers(BASE));
    const del = await fetch(`${BASE}/${mockUserPrompt.id}`, { method: 'DELETE' });
    expect(del.status).toBe(204);
    const list = (await (await fetch(BASE)).json()) as PromptResponse[];
    expect(list.some((p) => p.id === mockUserPrompt.id)).toBe(false);
  });
});
