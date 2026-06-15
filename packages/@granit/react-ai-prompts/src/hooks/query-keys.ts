import type { PromptId } from '@granit/ai-prompts';

/**
 * Query-key factory for catalogue queries, namespaced under the provider's
 * `queryKeyPrefix`.
 */
export const promptKeys = {
  /** Root key for every catalogue query. */
  all: (prefix: readonly string[]): readonly unknown[] => [...prefix],
  /** The flat catalogue list. */
  list: (prefix: readonly string[]): readonly unknown[] => [...prefix, 'prompts', 'list'],
  /** The catalogue grouped for the `/` picker. */
  picker: (prefix: readonly string[]): readonly unknown[] => [...prefix, 'prompts', 'picker'],
  /** A single prompt with its instruction text. */
  detail: (prefix: readonly string[], id: PromptId): readonly unknown[] => [
    ...prefix,
    'prompts',
    'detail',
    id,
  ],
} as const;
