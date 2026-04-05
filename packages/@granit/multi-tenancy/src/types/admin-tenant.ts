import type { TenantId } from '@granit/types';

/**
 * Tenant admin response.
 * Mirrors .NET Granit.MultiTenancy.Endpoints TenantResponse.
 */
export interface AdminTenant {
  readonly id: TenantId;
  readonly name: string;
  readonly identifier: string;
  readonly contactEmail: string | null;
  readonly isActive: boolean;
  readonly jurisdiction: string | null;
  readonly createdAt: string;
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
  readonly contactEmail?: string | null;
  readonly jurisdiction?: string | null;
}
