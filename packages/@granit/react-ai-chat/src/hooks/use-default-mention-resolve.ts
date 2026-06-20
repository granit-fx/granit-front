import { resolveMention } from '@granit/mentions';
import { useMemo } from 'react';

import { useOptionalAIChatConfig } from '../providers/ai-chat-provider';

import { toMentionOption } from './map-mention-option';

import type { ResolveMention } from '../components/composer-types';

/**
 * The provider-backed default `@`-mention resolver: rehydrates a composite
 * `"<type>:<id>"` value into a {@link MentionOption} via `@granit/mentions`
 * (`GET /lookups/mentions/resolve`), or `null` when the value is unknown. Useful
 * when restoring a draft that persisted only mention ids — the live picker keeps
 * the label inline, so the composer itself never needs it.
 *
 * Returns `undefined` outside an {@link AIChatProvider}.
 */
export function useDefaultMentionResolve(): ResolveMention | undefined {
  const config = useOptionalAIChatConfig();
  return useMemo<ResolveMention | undefined>(() => {
    if (!config) return undefined;
    const { client } = config;
    return async (value) => {
      const item = await resolveMention(client, value);
      return item ? toMentionOption(item) : null;
    };
  }, [config]);
}
