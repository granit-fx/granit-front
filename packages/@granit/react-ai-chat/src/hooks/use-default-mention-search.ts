import { searchMentions } from '@granit/mentions';
import { useMemo } from 'react';

import { useOptionalAIChatConfig } from '../providers/ai-chat-provider';

import { toMentionOption } from './map-mention-option';

import type { SearchMentions } from '../components/composer-types';

/**
 * The provider-backed default `@`-mention search: binds the unified
 * `GET /lookups/mentions` picker (via `@granit/mentions`) to the
 * {@link AIChatProvider}'s client and maps each `MentionItem` onto a
 * {@link MentionOption}. {@link ChatComposer} uses it whenever the host does not
 * pass its own `searchMentions` adapter.
 *
 * Returns `undefined` outside an {@link AIChatProvider} (e.g. a standalone
 * composer in tests/Storybook), which leaves the mention picker disabled until a
 * `searchMentions` prop is supplied.
 */
export function useDefaultMentionSearch(): SearchMentions | undefined {
  const config = useOptionalAIChatConfig();
  return useMemo<SearchMentions | undefined>(() => {
    if (!config) return undefined;
    const { client } = config;
    return async (query) => {
      const items = await searchMentions(client, { search: query });
      return items.map(toMentionOption);
    };
  }, [config]);
}
