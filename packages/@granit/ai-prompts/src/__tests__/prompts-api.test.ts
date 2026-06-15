import { axiosResponse, createMockClient } from '@granit/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createPrompt,
  customisePrompt,
  deletePrompt,
  getPrompt,
  getPromptPicker,
  listPrompts,
  updatePrompt,
} from '../api/prompts-api';

import type { PromptId, PromptResponse } from '../types/index';

const BASE = '/api/v1/prompts';
const ID = 'p1111111-1111-1111-1111-111111111111' as PromptId;

const PROMPT: PromptResponse = {
  id: ID,
  name: 'Summarize',
  shortDescription: 'Summarize the current record',
  content: 'Summarize {{record}} in three bullet points.',
  icon: 'sparkles',
  iconColor: '#3366FF',
  version: 1,
  isSystem: false,
  ownerId: 'b2222222-2222-2222-2222-222222222222' as PromptResponse['ownerId'],
  categoryIds: [],
  createdAt: '2026-06-15T10:00:00Z' as PromptResponse['createdAt'],
  modifiedAt: null,
};

describe('prompts-api', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('listPrompts GETs the base path', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([]));
    await listPrompts(client, BASE);
    expect(client.get).toHaveBeenCalledWith(BASE);
  });

  it('getPromptPicker GETs {basePath}/picker', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ categories: [] }));
    await getPromptPicker(client, BASE);
    expect(client.get).toHaveBeenCalledWith(`${BASE}/picker`);
  });

  it('getPrompt GETs {basePath}/{id}', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(PROMPT));
    const result = await getPrompt(client, BASE, ID);
    expect(client.get).toHaveBeenCalledWith(`${BASE}/${ID}`);
    expect(result).toEqual(PROMPT);
  });

  it('createPrompt POSTs the body to the base path', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(PROMPT));
    await createPrompt(client, BASE, { name: 'Summarize', content: 'Do it' });
    expect(client.post).toHaveBeenCalledWith(BASE, { name: 'Summarize', content: 'Do it' });
  });

  it('updatePrompt PUTs to {basePath}/{id}', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue(axiosResponse(PROMPT));
    await updatePrompt(client, BASE, ID, { name: 'Summarize', content: 'Updated' });
    expect(client.put).toHaveBeenCalledWith(`${BASE}/${ID}`, {
      name: 'Summarize',
      content: 'Updated',
    });
  });

  it('deletePrompt DELETEs {basePath}/{id}', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));
    await deletePrompt(client, BASE, ID);
    expect(client.delete).toHaveBeenCalledWith(`${BASE}/${ID}`);
  });

  it('customisePrompt POSTs to {basePath}/{id}/customise and returns the clone', async () => {
    const client = createMockClient();
    const clone = { ...PROMPT, isSystem: false };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(clone));
    const result = await customisePrompt(client, BASE, ID);
    expect(client.post).toHaveBeenCalledWith(`${BASE}/${ID}/customise`);
    expect(result.isSystem).toBe(false);
  });
});
