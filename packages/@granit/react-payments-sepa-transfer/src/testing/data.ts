import type { SepaTransferConfigurationResponse } from '@granit/payments-sepa-transfer';

export const sampleConfiguration: SepaTransferConfigurationResponse = {
  beneficiaryName: 'Acme NV',
  isActive: true,
  companyPartyId: 'party_company_01',
  beneficiaryIbanMasked: 'BE** **** **** 9999',
  beneficiaryBic: 'GEBABEBB',
  tenantId: 'tenant_01',
  concurrencyStamp: 'stamp_cfg',
};
