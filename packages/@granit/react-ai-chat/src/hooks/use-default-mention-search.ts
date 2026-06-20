import { searchConversationMentions } from '@granit/ai-chat';
import { useMemo } from 'react';

import { DEFAULT_MENTION_SEARCH_LIMIT } from '../constants';
import { useOptionalAIChatConfig } from '../providers/ai-chat-provider';

import type { MentionOption, SearchMentions } from '../components/composer-types';

/**
 * The provider-backed default `@`-mention search: binds the unified
 * `GET /conversations/mentions` endpoint to the {@link AIChatProvider}'s client +
 * base path and maps each {@link MentionSuggestionResponse} 1:1 onto a
 * {@link MentionOption}. {@link ChatComposer} uses it whenever the host does not
 * pass its own `searchMentions` adapter.
 *
 * Returns `undefined` outside an {@link AIChatProvider} (e.g. a standalone
 * composer in tests/Storybook), which leaves the mention picker disabled until a
 * `searchMentions` prop is supplied.
 *
 * @param limit - Maximum suggestions per query (server cap: 25). Defaults to
 *   {@link DEFAULT_MENTION_SEARCH_LIMIT}.
 */
export function useDefaultMentionSearch(
  limit: number = DEFAULT_MENTION_SEARCH_LIMIT
): SearchMentions | undefined {
  const config = useOptionalAIChatConfig();
  return useMemo<SearchMentions | undefined>(() => {
    if (!config) return undefined;
    const { client, basePath } = config;
    return async (query) => {
      const items = await searchConversationMentions(client, basePath, query, { limit });
      return items.map<MentionOption>((item) => ({
        type: item.type,
        id: item.id,
        label: item.label,
        description: item.description,
      }));
    };
  }, [config, limit]);
}
