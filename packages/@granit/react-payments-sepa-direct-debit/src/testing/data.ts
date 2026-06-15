import type {
  MandateResponse,
  SepaConfigurationResponse,
} from '@granit/payments-sepa-direct-debit';

export const sampleMandates: MandateResponse[] = [
  {
    id: 'mdt_01',
    mandateReference: 'RUM-0000001',
    status: 'Active',
    scheme: 'Core',
    debtorName: 'Alice Martin',
    debtorIbanMasked: 'BE** **** **** 1234',
    creditorId: 'BE68ZZZ0123456789',
    providerName: 'GoCardless',
    providerMandateId: 'MD0000001',
    signedAt: '2026-05-01T10:00:00Z',
    activatedAt: '2026-05-01T10:05:00Z',
    cancelledAt: null,
    tenantId: 'tenant_01',
    concurrencyStamp: 'stamp_01',
  },
  {
    id: 'mdt_02',
    mandateReference: 'RUM-0000002',
    status: 'Pending',
    scheme: 'B2B',
    debtorName: 'Bravo Logistics BV',
    debtorIbanMasked: 'NL** **** **** 5678',
    creditorId: 'BE68ZZZ0123456789',
    providerName: null,
    providerMandateId: null,
    signedAt: null,
    activatedAt: null,
    cancelledAt: null,
    tenantId: 'tenant_01',
    concurrencyStamp: 'stamp_02',
  },
];

export const sampleConfiguration: SepaConfigurationResponse = {
  creditorId: 'BE68ZZZ0123456789',
  creditorName: 'Acme NV',
  defaultScheme: 'Core',
  defaultProviderName: 'GoCardless',
  isActive: true,
  companyPartyId: 'party_company_01',
  creditorIbanMasked: 'BE** **** **** 9999',
  creditorBic: 'GEBABEBB',
  tenantId: 'tenant_01',
  concurrencyStamp: 'stamp_cfg',
};
