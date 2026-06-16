import type { TenantId, ISODateString } from '@granit/types';

/**
 * Tenant admin response.
 * Mirrors .NET Granit.MultiTenancy.Endpoints TenantResponse.
 */
export interface TenantResponse {
  readonly id: TenantId;
  readonly name: string;
  readonly identifier: string;
  readonly contactEmail: string | null;
  readonly activated: boolean;
  readonly jurisdiction: string | null;
  readonly createdAt: ISODateString;
  /**
   * Opaque optimistic-concurrency token. Echo it back in
   * {@link UpdateTenantRequest} to detect concurrent modifications (HTTP 409).
   */
  readonly concurrencyStamp: string;
}

/**
 * Payload for creating a new tenant.
 * Mirrors .NET CreateTenantRequest.
 */
export interface CreateTenantRequest {
  readonly name: string;
  readonly identifier: string;
  readonly contactEmail?: string | null;
  readonly jurisdiction?: string | null;
}

/**
 * Payload for updating an existing tenant.
 * Mirrors .NET UpdateTenantRequest.
 */
export interface UpdateTenantRequest {
  readonly name: string;
  /** Stamp from the last read; must match the stored value (prevents lost updates). */
  readonly concurrencyStamp: string;
  readonly contactEmail?: string | null;
  readonly jurisdiction?: string | null;
}
