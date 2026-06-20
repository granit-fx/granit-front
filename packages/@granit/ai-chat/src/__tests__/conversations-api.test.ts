import { axiosResponse, createMockClient } from '@granit/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createConversation,
  deleteConversation,
  getConversation,
  getConversationMessages,
  listChatWorkspaces,
  listConversations,
  renameConversation,
  reportConversationMessage,
  setConversationFavorite,
} from '../api/conversations-api';
import { MESSAGE_REPORT_CATEGORIES } from '../types/index';

import type {
  ConversationId,
  ConversationResponse,
  MessageId,
  MessageResponse,
} from '../types/index';
import type { PagedResult } from '@granit/query-engine';

const BASE = '/api/v1/conversations';
const ID = 'a1111111-1111-1111-1111-111111111111' as ConversationId;
const MESSAGE_ID = 'c3333333-3333-3333-3333-333333333333' as MessageId;

const CONVERSATION: ConversationResponse = {
  id: ID,
  title: 'Untitled',
  ownerId: 'b2222222-2222-2222-2222-222222222222' as ConversationResponse['ownerId'],
  isFavorite: false,
  createdAt: '2026-06-15T10:00:00Z' as ConversationResponse['createdAt'],
  modifiedAt: null,
  workspaceKey: null,
};

describe('conversations-api', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('listConversations GETs the base path', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([]));

    await listConversations(client, BASE);

    expect(client.get).toHaveBeenCalledWith(BASE);
  });

  it('getConversation GETs {basePath}/{id} (encoded)', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(CONVERSATION));

    const result = await getConversation(client, BASE, ID);

    expect(client.get).toHaveBeenCalledWith(`${BASE}/${ID}`);
    expect(result).toEqual(CONVERSATION);
  });

  it('getConversationMessages GETs the messages route with empty params when none given', async () => {
    const client = createMockClient();
    const page: PagedResult<MessageResponse> = { items: [], totalCount: null, nextCursor: null };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(page));

    const result = await getConversationMessages(client, BASE, ID);

    expect(client.get).toHaveBeenCalledWith(`${BASE}/${ID}/messages`, {
      params: {},
      signal: undefined,
    });
    expect(result).toEqual(page);
  });

  it('getConversationMessages passes pageSize + cursor as axios params, and threads the signal', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse<PagedResult<MessageResponse>>({ items: [], totalCount: null, nextCursor: null })
    );
    const controller = new AbortController();

    await getConversationMessages(
      client,
      BASE,
      ID,
      { pageSize: 50, cursor: 'a+b/c=' },
      controller.signal
    );

    expect(client.get).toHaveBeenCalledWith(`${BASE}/${ID}/messages`, {
      params: { pageSize: 50, cursor: 'a+b/c=' },
      signal: controller.signal,
    });
  });

  it('createConversation POSTs to the base path with the title body', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(CONVERSATION));

    await createConversation(client, BASE, { title: 'New chat' });

    expect(client.post).toHaveBeenCalledWith(BASE, { title: 'New chat' });
  });

  it('renameConversation PUTs to {basePath}/{id}/title', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue(axiosResponse(undefined));

    await renameConversation(client, BASE, ID, { title: 'Renamed' });

    expect(client.put).toHaveBeenCalledWith(`${BASE}/${ID}/title`, { title: 'Renamed' });
  });

  it('setConversationFavorite PUTs {basePath}/{id}/favorite with the flag body', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue(axiosResponse(undefined));

    await setConversationFavorite(client, BASE, ID, true);

    expect(client.put).toHaveBeenCalledWith(`${BASE}/${ID}/favorite`, { isFavorite: true });
  });

  it('deleteConversation DELETEs {basePath}/{id}', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

    await deleteConversation(client, BASE, ID);

    expect(client.delete).toHaveBeenCalledWith(`${BASE}/${ID}`);
  });

  it('reportConversationMessage POSTs to {basePath}/messages/{messageId}/report with the body', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(undefined));

    await reportConversationMessage(client, BASE, MESSAGE_ID, {
      reason: 'Inaccurate answer',
      category: MESSAGE_REPORT_CATEGORIES.INACCURATE,
    });

    expect(client.post).toHaveBeenCalledWith(`${BASE}/messages/${MESSAGE_ID}/report`, {
      reason: 'Inaccurate answer',
      category: 'Inaccurate',
    });
  });

  it('listChatWorkspaces GETs {basePath}/workspaces', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ workspaces: ['Auto'] }));

    const result = await listChatWorkspaces(client, BASE);

    expect(client.get).toHaveBeenCalledWith(`${BASE}/workspaces`);
    expect(result.workspaces).toContain('Auto');
  });
});
