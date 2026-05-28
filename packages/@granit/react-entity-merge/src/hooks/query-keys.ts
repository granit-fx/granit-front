/**
 * Query-key factory for entity-merge operations. Combine with
 * `buildEntityMergeQueryKey(config, ...entityMergeKeys.preview(...))` so the
 * provider's prefix is prepended.
 */
export const entityMergeKeys = {
  all: [] as const,
  preview: (survivorId: string, loserId: string) =>
    ['merge', 'preview', survivorId, loserId] as const,
};
