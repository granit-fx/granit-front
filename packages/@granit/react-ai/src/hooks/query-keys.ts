/**
 * Query-key factory for AI queries, namespaced under the provider's
 * `queryKeyPrefix` so multiple AI instances stay isolated. Mirrors the
 * `@granit/react-ai-chat` / `@granit/react-ai-prompts` key-factory pattern.
 */
export const aiKeys = {
  /** Root key for every AI query. */
  all: (prefix: readonly string[]): readonly unknown[] => [...prefix],
  /** The registered providers. */
  providers: (prefix: readonly string[]): readonly unknown[] => [...prefix, 'providers'],
  /** The models for a given provider. */
  providerModels: (prefix: readonly string[], providerName: string): readonly unknown[] => [
    ...prefix,
    'providers',
    providerName,
    'models',
  ],
  /** The workspace list. */
  workspaces: (prefix: readonly string[]): readonly unknown[] => [...prefix, 'workspaces'],
  /** A single workspace by name. */
  workspace: (prefix: readonly string[], name: string): readonly unknown[] => [
    ...prefix,
    'workspaces',
    name,
  ],
} as const;
