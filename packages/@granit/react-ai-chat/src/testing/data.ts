import { toEntityId, toISODateString } from '@granit/types';

import type {
  ConversationResponse,
  ConversationSummaryResponse,
  MessageResponse,
} from '@granit/ai-chat';

const OWNER = toEntityId<'User'>('b2222222-2222-2222-2222-222222222222');

const CONVERSATION_ID = toEntityId<'Conversation'>('a1111111-1111-1111-1111-111111111111');

/** Conversation metadata returned by `GET /conversations/{id}` (no embedded thread). */
export const mockConversation: ConversationResponse = {
  id: CONVERSATION_ID,
  title: 'Invoice questions',
  ownerId: OWNER,
  isFavorite: false,
  createdAt: toISODateString('2026-06-15T09:00:00.000Z'),
  modifiedAt: toISODateString('2026-06-15T09:05:00.000Z'),
};

/**
 * The {@link mockConversation} thread (oldest-first), served by the paginated
 * `GET /conversations/{id}/messages` handler — the thread is no longer embedded
 * in the conversation detail response.
 */
export const mockConversationMessages: readonly MessageResponse[] = [
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
];

/** A long conversation used to exercise reverse (keyset) message pagination. */
export const mockLongConversationId = toEntityId<'Conversation'>(
  'a1111111-1111-1111-1111-1111111110ff'
);

/**
 * 80 alternating user/assistant messages, ascending (oldest-first). Timestamps
 * are one minute apart so a keyset over `createdAt`+`id` is well-ordered.
 */
export const mockLongConversationMessages: readonly MessageResponse[] = Array.from(
  { length: 80 },
  (_, i): MessageResponse => {
    const isUser = i % 2 === 0;
    return {
      id: toEntityId<'Message'>(`d4444444-4444-4444-4444-${String(i).padStart(12, '0')}`),
      role: isUser ? 'user' : 'assistant',
      content: isUser ? `Question ${Math.floor(i / 2) + 1}` : `Answer ${Math.floor(i / 2) + 1}`,
      createdAt: toISODateString(
        new Date(Date.parse('2026-06-10T08:00:00.000Z') + i * 60_000).toISOString()
      ),
    };
  }
);

/** Conversation summaries returned by `GET /conversations`, newest first. */
export const mockConversationSummaries: ConversationSummaryResponse[] = [
  {
    id: CONVERSATION_ID,
    title: 'Invoice questions',
    isFavorite: false,
    createdAt: toISODateString('2026-06-15T09:00:00.000Z'),
    modifiedAt: toISODateString('2026-06-15T09:05:00.000Z'),
  },
  {
    id: toEntityId<'Conversation'>('a1111111-1111-1111-1111-111111111112'),
    title: 'Daily brief',
    isFavorite: true,
    createdAt: toISODateString('2026-06-14T07:30:00.000Z'),
    modifiedAt: null,
  },
];

/** Selectable default workspaces returned by `GET /conversations/workspaces`. */
export const mockChatWorkspaces: readonly string[] = ['Auto', 'default', 'support'];
