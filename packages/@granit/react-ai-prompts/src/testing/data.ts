import { toEntityId, toISODateString } from '@granit/types';

import type {
  PromptPickerResponse,
  PromptResponse,
  PromptSummaryResponse,
} from '@granit/ai-prompts';

const OWNER = toEntityId<'User'>('b2222222-2222-2222-2222-222222222222');
const SYSTEM_OWNER = toEntityId<'User'>('00000000-0000-0000-0000-000000000000');

const SYSTEM_ID = toEntityId<'Prompt'>('51111111-1111-1111-1111-111111111111');
const USER_ID = toEntityId<'Prompt'>('52222222-2222-2222-2222-222222222222');
const CATEGORY_ID = toEntityId<'Category'>('c3333333-3333-3333-3333-333333333333');

/** A read-only, framework-seeded system prompt. */
export const mockSystemPrompt: PromptResponse = {
  id: SYSTEM_ID,
  name: 'Summarize',
  shortDescription: 'Summarize the current record',
  content: 'Summarize {{record}} in three concise bullet points.',
  icon: 'sparkles',
  iconColor: '#3366FF',
  version: 1,
  isSystem: true,
  ownerId: SYSTEM_OWNER,
  categoryIds: [CATEGORY_ID],
  createdAt: toISODateString('2026-01-01T00:00:00.000Z'),
  modifiedAt: null,
};

/** A private prompt owned by the caller. */
export const mockUserPrompt: PromptResponse = {
  id: USER_ID,
  name: 'Daily brief',
  shortDescription: 'My morning summary',
  content: 'Give me a brief of what changed since yesterday.',
  icon: 'calendar',
  iconColor: '#10B981',
  version: 2,
  isSystem: false,
  ownerId: OWNER,
  categoryIds: [],
  createdAt: toISODateString('2026-06-10T08:00:00.000Z'),
  modifiedAt: toISODateString('2026-06-12T08:00:00.000Z'),
};

/** Catalogue summaries returned by `GET /prompts` (system first). */
export const mockPromptSummaries: PromptSummaryResponse[] = [
  {
    id: SYSTEM_ID,
    name: mockSystemPrompt.name,
    shortDescription: mockSystemPrompt.shortDescription,
    icon: mockSystemPrompt.icon,
    iconColor: mockSystemPrompt.iconColor,
    isSystem: true,
    categoryIds: mockSystemPrompt.categoryIds,
  },
  {
    id: USER_ID,
    name: mockUserPrompt.name,
    shortDescription: mockUserPrompt.shortDescription,
    icon: mockUserPrompt.icon,
    iconColor: mockUserPrompt.iconColor,
    isSystem: false,
    categoryIds: [],
  },
];

/** The `/` picker payload returned by `GET /prompts/picker`. */
export const mockPromptPicker: PromptPickerResponse = {
  categories: [
    {
      categoryId: CATEGORY_ID,
      categoryName: 'Records',
      prompts: [
        {
          id: SYSTEM_ID,
          name: mockSystemPrompt.name,
          shortDescription: mockSystemPrompt.shortDescription,
          icon: mockSystemPrompt.icon,
          iconColor: mockSystemPrompt.iconColor,
          isSystem: true,
        },
      ],
    },
    {
      categoryId: null,
      categoryName: 'General',
      prompts: [
        {
          id: USER_ID,
          name: mockUserPrompt.name,
          shortDescription: mockUserPrompt.shortDescription,
          icon: mockUserPrompt.icon,
          iconColor: mockUserPrompt.iconColor,
          isSystem: false,
        },
      ],
    },
  ],
};
