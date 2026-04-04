import type { EntityId } from '@granit/types';

/** Branded identity role identifier. */
export type IdentityRoleId = EntityId<'IdentityRole'>;

/** Identity role from the identity provider — mirrors Granit.Identity.IdentityRole .NET record. */
export type IdentityRole = {
  readonly id: IdentityRoleId;
  readonly name: string;
  readonly description: string | null;
};
