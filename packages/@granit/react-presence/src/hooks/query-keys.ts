import type { UserId } from '@granit/types';

/**
 * Query key factory for presence queries. Returns module-relative segments
 * — the `PresenceProvider`'s `queryKeyPrefix` (default `['presence']`) is
 * the single owner of the module namespace and is prepended via
 * `buildPresenceQueryKey`.
 */
export const presenceKeys = {
  all: [] as const,
  my: () => ['my'] as const,
  user: (userId: UserId) => ['user', userId] as const,
  batch: (userIds: readonly UserId[]) =>
    ['batch', [...userIds].sort((a, b) => a.localeCompare(b))] as const,
};
