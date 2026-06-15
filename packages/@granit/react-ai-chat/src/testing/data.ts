import { toEntityId, toISODateString } from '@granit/types';

import type {
  ConversationResponse,
  ConversationSummaryResponse,
  MessageResponse,
} from '@granit/ai-chat';

const OWNER = toEntityId<'User'>('b2222222-2222-2222-2222-222222222222');

const CONVERSATION_ID = toEntityId<'Conversation'>('a1111111-1111-1111-1111-111111111111');

/** A full conversation with two messages, returned by `GET /conversations/{id}`. */
export const mockConversation: ConversationResponse = {
  id: CONVERSATION_ID,
  title: 'Invoice questions',
  ownerId: OWNER,
  createdAt: toISODateString('2026-06-15T09:00:00.000Z'),
  modifiedAt: toISODateString('2026-06-15T09:05:00.000Z'),
  messages: [
    {
      id: toEntityId<'Message'>('c3333333-3333-3333-3333-333333333331'),
      role: 'user',
      content: 'What changed on invoice 42 last week?',
      createdAt: toISODateString('2026-06-15T09:00:00.000Z'),
    },
    {
      id: toEntityId<'Message'>('c3333333-3333-3333-3333-333333333332'),
      role: 'assistant',
      content: 'The total was revised from €1,200 to €1,350 and the due date moved to June 30.',
      createdAt: toISODateString('2026-06-15T09:00:08.000Z'),
    },
  ] satisfies MessageResponse[],
};

/** Conversation summaries returned by `GET /conversations`, newest first. */
export const mockConversationSummaries: ConversationSummaryResponse[] = [
  {
    id: CONVERSATION_ID,
    title: 'Invoice questions',
    createdAt: toISODateString('2026-06-15T09:00:00.000Z'),
    modifiedAt: toISODateString('2026-06-15T09:05:00.000Z'),
  },
  {
    id: toEntityId<'Conversation'>('a1111111-1111-1111-1111-111111111112'),
    title: 'Daily brief',
    createdAt: toISODateString('2026-06-14T07:30:00.000Z'),
    modifiedAt: null,
  },
];

/** Selectable default workspaces returned by `GET /conversations/workspaces`. */
export const mockChatWorkspaces: readonly string[] = ['Auto', 'default', 'support'];
