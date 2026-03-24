import type { PagedResult, PaginationParams } from '@granit/query-engine';

/** Cached identity user — mirrors Granit.Identity.IdentityUser .NET record. */
export type IdentityUser = {
  readonly id: string;
  readonly username: string | null;
  readonly email: string | null;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly enabled: boolean;
  readonly emailVerified?: boolean;
  readonly roles?: readonly string[];
  readonly attributes: Readonly<Record<string, string>> | null;
  readonly createdAt?: string;
  readonly lastLoginAt?: string | null;
};

export type IdentityUserListParams = PaginationParams & {
  readonly search?: string;
};

export type IdentityUserCacheStats = {
  readonly totalEntries: number;
  readonly staleEntries: number;
  readonly oldestSyncAt: string | null;
  readonly newestSyncAt: string | null;
};

export type IdentityUserCacheSyncAllResult = {
  readonly syncedCount: number;
};

export type IdentityUserCacheSyncStaleResult = {
  readonly refreshedCount: number;
};

/** Paginated response for identity user listing. */
export type IdentityUserPage = PagedResult<IdentityUser>;
