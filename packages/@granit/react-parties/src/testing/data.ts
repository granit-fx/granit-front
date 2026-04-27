import { toEntityId } from '@granit/types';

import type {
  PartyAddressId,
  PartyEmailId,
  PartyExternalMappingId,
  PartyId,
  PartyListItemResponse,
  PartyPhoneId,
  PartyResponse,
} from '@granit/parties';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

export const samplePartyId: PartyId = toEntityId<'Party'>('00000000-0000-0000-0000-000000000001');

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
  parentContactId: null,
  userId: null,
  avatarBlobId: null,
  roles: 'Customer, Supplier',
  status: 'Active',
  addresses: [
    {
      id: toEntityId<'PartyAddress'>('addr-001') as PartyAddressId,
      kind: 'Billing',
      isDefault: true,
      label: 'HQ',
      line1: '1 rue de la Loi',
      city: 'Bruxelles',
      postalCode: '1000',
      country: 'BE',
      companyName: 'Acme Corp SA',
      line2: null,
      state: null,
    },
  ],
  emails: [
    {
      id: toEntityId<'PartyEmail'>('email-001') as PartyEmailId,
      address: 'billing@acme.example',
      isPrimary: true,
      label: null,
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
  ],
  taxStatus: {
    isExempt: false,
    reverseCharge: false,
    vatin: null,
    evidenceBlobId: null,
  },
  metadata: { segment: 'enterprise', region: 'EU' },
  internalNotes: 'Strategic account — escalate billing issues to AM team.',
};

export const sampleParties: Mutable<PartyListItemResponse>[] = [
  {
    id: sampleParty.id,
    tenantId: null,
    kind: sampleParty.kind,
    name: sampleParty.name,
    roles: sampleParty.roles,
    status: sampleParty.status,
    defaultCurrency: sampleParty.defaultCurrency,
    primaryEmail: 'billing@acme.example',
    primaryPhone: '+32 2 555 0100',
  },
  {
    id: toEntityId<'Party'>('00000000-0000-0000-0000-000000000002'),
    tenantId: null,
    kind: 'Individual',
    name: 'Alice Martin',
    roles: 'Lead',
    status: 'Active',
    defaultCurrency: 'EUR',
    primaryEmail: 'alice@example.com',
    primaryPhone: null,
  },
];
