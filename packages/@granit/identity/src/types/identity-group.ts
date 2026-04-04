import type { EntityId } from '@granit/types';

/** Branded identity group identifier. */
export type IdentityGroupId = EntityId<'IdentityGroup'>;

/** Identity group from the identity provider — mirrors Granit.Identity.IdentityGroup .NET record. */
export type IdentityGroup = {
  readonly id: IdentityGroupId;
  readonly name: string;
  readonly path: string | null;
  readonly subGroups: readonly IdentityGroup[];
};
