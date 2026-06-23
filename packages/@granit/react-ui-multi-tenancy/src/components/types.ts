/**
 * Shape returned by the query engine for Tenant entities.
 * Matches the EF Core Tenant aggregate serialized as camelCase JSON.
 */
export interface TenantQueryItem {
  readonly id: string;
  readonly name: string;
  readonly identifier: string;
  readonly contactEmail: string | null;
  readonly jurisdiction: string | null;
  readonly activated: boolean;
  readonly createdAt: string;
}
