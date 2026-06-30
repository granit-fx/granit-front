import { toEntityId, toISODateString } from '@granit/types';

import type {
  PartyAddressId,
  PartyDuplicateCandidateId,
  PartyDuplicateCandidateResponse,
  PartyEmailId,
  PartyExternalMappingId,
  PartyId,
  PartyListItemResponse,
  PartyPhoneId,
  PartyResponse,
} from '@granit/parties';
import type { Mutable } from '@granit/testing';

const id = (n: number): PartyId =>
  toEntityId<'Party'>(`00000000-0000-0000-0000-${n.toString(16).padStart(12, '0')}`);

export const samplePartyId: PartyId = id(1);

/** Acme Corp — flagship Company, Customer + Supplier, Active, fully populated. */
export const sampleParty: Mutable<PartyResponse> = {
  id: samplePartyId,
  tenantId: null,
  kind: 'Company',
  name: 'Acme Corp',
  defaultCurrency: 'EUR',
  timezone: 'Europe/Brussels',
  language: 'fr-BE',
  website: 'https://acme.example',
  taxId: 'BE0123456789',
  registrationNumber: '0123.456.789',
  parentPartyId: null,
  userId: null,
  avatar: null,
  roles: 'Customer, Supplier',
  status: 'Active',
  addresses: [
    {
      id: toEntityId<'PartyAddress'>('addr-001') as PartyAddressId,
      kind: 'Billing',
      isDefault: true,
      label: 'HQ',
      street1: '1 rue de la Loi',
      city: 'Bruxelles',
      postalCode: '1000',
      country: 'BE',
      street2: null,
      state: null,
    },
    {
      id: toEntityId<'PartyAddress'>('addr-002') as PartyAddressId,
      kind: 'Shipping',
      isDefault: true,
      label: 'Warehouse',
      street1: 'Avenue du Port 86C',
      city: 'Bruxelles',
      postalCode: '1000',
      country: 'BE',
      street2: 'Bât. 4',
      state: null,
    },
  ],
  emails: [
    {
      id: toEntityId<'PartyEmail'>('email-001') as PartyEmailId,
      address: 'billing@acme.example',
      isPrimary: true,
      label: 'Billing',
    },
    {
      id: toEntityId<'PartyEmail'>('email-002') as PartyEmailId,
      address: 'support@acme.example',
      isPrimary: false,
      label: 'Support',
    },
  ],
  phones: [
    {
      id: toEntityId<'PartyPhone'>('phone-001') as PartyPhoneId,
      kind: 'Work',
      number: '+32 2 555 0100',
      isPrimary: true,
      label: null,
    },
  ],
  externalMappings: [
    {
      id: toEntityId<'PartyExternalMapping'>('map-001') as PartyExternalMappingId,
      providerName: 'stripe',
      externalId: 'cus_AcmeBE',
    },
    {
      id: toEntityId<'PartyExternalMapping'>('map-002') as PartyExternalMappingId,
      providerName: 'odoo',
      externalId: 'res.partner/142',
    },
  ],
  taxStatus: {
    isExempt: false,
    reverseCharge: false,
    vatin: null,
    evidenceBlobId: null,
  },
  metadata: { segment: 'enterprise', region: 'EU', tier: 'gold' },
  internalNotes: 'Strategic account — escalate billing issues to AM team.',
  createdAt: toISODateString('2026-01-01T00:00:00Z'),
  modifiedAt: null,
};

/** Alice Martin — Individual, Lead role. */
const aliceMartin: Mutable<PartyResponse> = {
  id: id(2),
  tenantId: null,
  kind: 'Individual',
  name: 'Alice Martin',
  defaultCurrency: 'EUR',
  timezone: 'Europe/Paris',
  language: 'fr-FR',
  website: null,
  taxId: null,
  registrationNumber: null,
  parentPartyId: null,
  userId: null,
  avatar: null,
  roles: 'Lead',
  status: 'Active',
  addresses: [],
  emails: [
    {
      id: toEntityId<'PartyEmail'>('email-101') as PartyEmailId,
      address: 'alice@example.com',
      isPrimary: true,
      label: null,
    },
  ],
  phones: [],
  externalMappings: [],
  taxStatus: { isExempt: false, reverseCharge: false, vatin: null, evidenceBlobId: null },
  metadata: { source: 'website-form' },
  internalNotes: null,
  createdAt: toISODateString('2026-01-01T00:00:00Z'),
  modifiedAt: null,
};

/** Globex Inc — Customer, Suspended for overdue invoices. */
const globex: Mutable<PartyResponse> = {
  id: id(3),
  tenantId: null,
  kind: 'Company',
  name: 'Globex Inc',
  defaultCurrency: 'USD',
  timezone: 'America/New_York',
  language: 'en-US',
  website: 'https://globex.example',
  taxId: null,
  registrationNumber: 'EIN-12-3456789',
  parentPartyId: null,
  userId: null,
  avatar: null,
  roles: 'Customer',
  status: 'Suspended',
  addresses: [
    {
      id: toEntityId<'PartyAddress'>('addr-301') as PartyAddressId,
      kind: 'Billing',
      isDefault: true,
      label: null,
      street1: '350 5th Ave',
      city: 'New York',
      postalCode: '10118',
      country: 'US',
      street2: 'Suite 8800',
      state: 'NY',
    },
  ],
  emails: [
    {
      id: toEntityId<'PartyEmail'>('email-301') as PartyEmailId,
      address: 'ap@globex.example',
      isPrimary: true,
      label: 'AP',
    },
  ],
  phones: [
    {
      id: toEntityId<'PartyPhone'>('phone-301') as PartyPhoneId,
      kind: 'Work',
      number: '+1 212 555 0199',
      isPrimary: true,
      label: null,
    },
  ],
  externalMappings: [],
  taxStatus: { isExempt: false, reverseCharge: false, vatin: null, evidenceBlobId: null },
  metadata: { segment: 'mid-market' },
  internalNotes: 'Suspended 2026-03-12 — 90+ days overdue on INV-2026-0042.',
  createdAt: toISODateString('2026-01-01T00:00:00Z'),
  modifiedAt: null,
};

/** Initech BV — Customer with intra-EU reverse-charge tax status. */
const initech: Mutable<PartyResponse> = {
  id: id(4),
  tenantId: null,
  kind: 'Company',
  name: 'Initech BV',
  defaultCurrency: 'EUR',
  timezone: 'Europe/Amsterdam',
  language: 'nl-NL',
  website: 'https://initech.example',
  taxId: 'NL123456789B01',
  registrationNumber: '12345678',
  parentPartyId: null,
  userId: null,
  avatar: null,
  roles: 'Customer',
  status: 'Active',
  addresses: [
    {
      id: toEntityId<'PartyAddress'>('addr-401') as PartyAddressId,
      kind: 'Billing',
      isDefault: true,
      label: null,
      street1: 'Herengracht 540',
      city: 'Amsterdam',
      postalCode: '1017 CG',
      country: 'NL',
      street2: null,
      state: null,
    },
  ],
  emails: [
    {
      id: toEntityId<'PartyEmail'>('email-401') as PartyEmailId,
      address: 'finance@initech.example',
      isPrimary: true,
      label: null,
    },
  ],
  phones: [],
  externalMappings: [],
  taxStatus: {
    isExempt: false,
    reverseCharge: true,
    vatin: 'NL123456789B01',
    evidenceBlobId: null,
  },
  metadata: {},
  internalNotes: null,
  createdAt: toISODateString('2026-01-01T00:00:00Z'),
  modifiedAt: null,
};

/** Stark Industries — Department under a parent company, Customer. */
const starkRD: Mutable<PartyResponse> = {
  id: id(5),
  tenantId: null,
  kind: 'Department',
  name: 'Stark Industries — R&D',
  defaultCurrency: 'USD',
  timezone: 'America/Los_Angeles',
  language: 'en-US',
  website: null,
  taxId: null,
  registrationNumber: null,
  parentPartyId: null,
  userId: null,
  avatar: null,
  roles: 'Customer',
  status: 'Active',
  addresses: [],
  emails: [
    {
      id: toEntityId<'PartyEmail'>('email-501') as PartyEmailId,
      address: 'rd@stark.example',
      isPrimary: true,
      label: null,
    },
  ],
  phones: [],
  externalMappings: [],
  taxStatus: { isExempt: false, reverseCharge: false, vatin: null, evidenceBlobId: null },
  metadata: { 'cost-center': 'RD-401' },
  internalNotes: null,
  createdAt: toISODateString('2026-01-01T00:00:00Z'),
  modifiedAt: null,
};

/** Bob Dupont — former Employee, Archived (terminal state). */
const bobDupont: Mutable<PartyResponse> = {
  id: id(7),
  tenantId: null,
  kind: 'Individual',
  name: 'Bob Dupont',
  defaultCurrency: 'EUR',
  timezone: 'Europe/Brussels',
  language: 'fr-BE',
  website: null,
  taxId: null,
  registrationNumber: null,
  parentPartyId: null,
  userId: null,
  avatar: null,
  roles: 'Employee',
  status: 'Archived',
  addresses: [],
  emails: [
    {
      id: toEntityId<'PartyEmail'>('email-701') as PartyEmailId,
      address: 'b.dupont@former.example',
      isPrimary: true,
      label: null,
    },
  ],
  phones: [],
  externalMappings: [],
  taxStatus: { isExempt: false, reverseCharge: false, vatin: null, evidenceBlobId: null },
  metadata: {},
  internalNotes: 'Left the company 2025-09-30. Kept for legal retention.',
  createdAt: toISODateString('2026-01-01T00:00:00Z'),
  modifiedAt: null,
};

/** NGO Helpers — fully VAT-exempt customer (charity). */
const ngoHelpers: Mutable<PartyResponse> = {
  id: id(8),
  tenantId: null,
  kind: 'Company',
  name: 'NGO Helpers ASBL',
  defaultCurrency: 'EUR',
  timezone: 'Europe/Brussels',
  language: 'fr-BE',
  website: 'https://helpers.example',
  taxId: null,
  registrationNumber: '0987.654.321',
  parentPartyId: null,
  userId: null,
  avatar: null,
  roles: 'Customer',
  status: 'Active',
  addresses: [
    {
      id: toEntityId<'PartyAddress'>('addr-801') as PartyAddressId,
      kind: 'Billing',
      isDefault: true,
      label: null,
      street1: 'Rue de la Solidarité 12',
      city: 'Liège',
      postalCode: '4000',
      country: 'BE',
      street2: null,
      state: null,
    },
  ],
  emails: [
    {
      id: toEntityId<'PartyEmail'>('email-801') as PartyEmailId,
      address: 'compta@helpers.example',
      isPrimary: true,
      label: null,
    },
  ],
  phones: [],
  externalMappings: [],
  taxStatus: { isExempt: true, reverseCharge: false, vatin: null, evidenceBlobId: null },
  metadata: { segment: 'non-profit' },
  internalNotes: 'VAT exemption certificate on file (BE-NGO-2024-1142).',
  createdAt: toISODateString('2026-01-01T00:00:00Z'),
  modifiedAt: null,
};

/**
 * In-memory party store used by the MSW handlers. Mutating these objects
 * is intentional — keeps the demo state stable across requests.
 */
export const sampleParties: Mutable<PartyResponse>[] = [
  sampleParty,
  aliceMartin,
  globex,
  initech,
  starkRD,
  bobDupont,
  ngoHelpers,
];

// ── Duplicate candidates ──────────────────────────────────────────────────

const duplicateId = (suffix: string): PartyDuplicateCandidateId =>
  toEntityId<'PartyDuplicateCandidate'>(`dup-${suffix}`);

/**
 * In-memory duplicates store used by the MSW handlers. Each row references two
 * existing parties from {@link sampleParties} so the showcase can dogfood the
 * inbox + per-party badge end-to-end.
 *
 * Demo storyline: Alice Martin (Lead) looks like a duplicate of two other
 * parties — a strong deterministic match against an existing customer and a
 * weaker fuzzy match against a different one — so opening her detail page
 * shows an amber badge, and the inbox grid shows three pending pairs covering
 * every tier.
 */
export const sampleDuplicates: Mutable<PartyDuplicateCandidateResponse>[] = [
  {
    id: duplicateId('001'),
    partyId: id(1),
    candidateId: id(2),
    score: 0.97,
    tier: 'Deterministic',
    signals: [
      { kind: 'TaxIdEqual', score: 1.0 },
      { kind: 'NameTrigram', score: 0.74 },
    ],
    dismissedAt: null,
    createdAt: toISODateString('2026-04-25T08:30:00Z'),
    updatedAt: toISODateString('2026-04-27T02:00:00Z'),
  },
  {
    id: duplicateId('002'),
    partyId: id(2),
    candidateId: id(3),
    score: 0.81,
    tier: 'Blocking',
    signals: [
      { kind: 'EmailDomainEqual', score: 0.85 },
      { kind: 'NameTrigram', score: 0.78 },
    ],
    dismissedAt: null,
    createdAt: toISODateString('2026-04-26T14:15:00Z'),
    updatedAt: null,
  },
  {
    id: duplicateId('003'),
    partyId: id(4),
    candidateId: id(8),
    score: 0.62,
    tier: 'Fuzzy',
    signals: [
      { kind: 'NameTrigram', score: 0.62 },
      { kind: 'CountryEqual', score: 1.0 },
    ],
    dismissedAt: null,
    createdAt: toISODateString('2026-04-27T03:00:00Z'),
    updatedAt: null,
  },
];

/** Project a {@link PartyResponse} to its list-item shape. */
export function toListItem(p: PartyResponse): Mutable<PartyListItemResponse> {
  return {
    id: p.id,
    tenantId: p.tenantId,
    kind: p.kind,
    name: p.name,
    roles: p.roles,
    status: p.status,
    defaultCurrency: p.defaultCurrency,
    primaryEmail: p.emails.find((e) => e.isPrimary)?.address ?? null,
    primaryPhone: p.phones.find((ph) => ph.isPrimary)?.number ?? null,
  };
}
