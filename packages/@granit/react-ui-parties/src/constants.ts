// `@granit/parties` only exports the union types (PartyKind, PartyStatus,
// PartyRole, AddressKind, PhoneKind) — not the runtime value arrays. Until
// the framework exports canonical lists, the constants below mirror the .NET
// source enums (`PartyKind`, `PartyStatus`, `PartyRoles [Flags]`, `AddressKind`,
// `PhoneKind`) one-for-one. Tracked in granit-front issue #393 — once the
// framework publishes the runtime arrays, this file becomes a re-export.
import type { AddressKind, PartyKind, PartyRole, PartyStatus, PhoneKind } from '@granit/parties';

export const PARTY_KINDS: readonly PartyKind[] = ['Individual', 'Company', 'Department'];
export const PARTY_STATUSES: readonly PartyStatus[] = ['Active', 'Suspended', 'Archived'];
export const PARTY_ASSIGNABLE_ROLES: readonly PartyRole[] = [
  'Customer',
  'Supplier',
  'Employee',
  'Lead',
];
export const ADDRESS_KINDS: readonly AddressKind[] = ['Billing', 'Shipping', 'Other'];
export const PHONE_KINDS: readonly PhoneKind[] = ['Mobile', 'Work', 'Home', 'Other'];

export const PARTY_LIST_ROLE_FILTERS = ['All', ...PARTY_ASSIGNABLE_ROLES] as const;
export type PartyListRoleFilter = (typeof PARTY_LIST_ROLE_FILTERS)[number];

export const PARTY_LIST_STATUS_FILTERS = ['All', ...PARTY_STATUSES] as const;
export type PartyListStatusFilter = (typeof PARTY_LIST_STATUS_FILTERS)[number];

export function parsePartyRoleFlags(roles: string | null | undefined): readonly PartyRole[] {
  if (!roles) return [];
  return roles
    .split(',')
    .map((r) => r.trim())
    .filter((r): r is PartyRole => PARTY_ASSIGNABLE_ROLES.includes(r as PartyRole));
}
