// ---------------------------------------------------------------------------
// @granit/react-ai/usage — opt-in AI usage querying surface backed by
// @granit/query-engine. Kept out of the main entry so the query-engine peer
// dependency stays optional for consumers that don't render usage.
// ---------------------------------------------------------------------------

export { AIUsageProvider } from './ai-usage-provider';
export type { AIUsageProviderProps } from './ai-usage-provider';
export { useAIUsage, useAIUsageMeta } from './use-ai-usage';
