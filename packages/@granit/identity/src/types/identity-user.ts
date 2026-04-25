import type { PagedResult, PaginationParams } from '@granit/query-engine';
import type { ISODateString, UserId } from '@granit/types';

/** Cached identity user — mirrors Granit.Identity.IdentityUser .NET record. */
export type IdentityUser = {
  readonly userId: UserId;
  readonly username: string | null;
  readonly email: string | null;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly enabled: boolean;
  readonly metadata: Readonly<Record<string, string>>;
};

export type IdentityUserListParams = PaginationParams & {
  readonly search?: string;
};

export type IdentityUserCacheStats = {
  readonly totalEntries: number;
  readonly staleEntries: number;
  readonly oldestSyncAt: ISODateString | null;
  readonly newestSyncAt: ISODateString | null;
};

export type IdentityUserCacheSyncAllResult = {
  readonly syncedCount: number;
};

export type IdentityUserCacheSyncStaleResult = {
  readonly refreshedCount: number;
};

/** Paginated response for identity user listing. */
export type IdentityUserPage = PagedResult<IdentityUser>;
