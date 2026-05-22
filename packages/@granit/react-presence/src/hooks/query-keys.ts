/** Query key factory for presence queries. Concatenated after the provider prefix. */
export const presenceKeys = {
  all: ['presence'] as const,
  my: () => [...presenceKeys.all, 'my'] as const,
  user: (userId: string) => [...presenceKeys.all, 'user', userId] as const,
  batch: (userIds: readonly string[]) =>
    [...presenceKeys.all, 'batch', [...userIds].sort()] as const,
};
