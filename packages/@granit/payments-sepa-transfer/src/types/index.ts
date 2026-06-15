/**
 * Create or update the tenant's SEPA bank transfer configuration. When a
 * `beneficiaryIban` is supplied it is provisioned into the company's
 * `BankAccounts` referential and stamped onto the configuration; it is never
 * echoed back unmasked.
 */
export interface SepaTransferConfigurationRequest {
  readonly beneficiaryName?: string | null;
  readonly isActive?: boolean;
  readonly companyPartyId?: string | null;
  readonly beneficiaryIban?: string | null;
  readonly beneficiaryBic?: string | null;
}

/** The tenant's SEPA bank transfer configuration, with the beneficiary IBAN masked. */
export interface SepaTransferConfigurationResponse {
  readonly beneficiaryName: string | null;
  readonly isActive: boolean;
  readonly companyPartyId: string | null;
  readonly beneficiaryIbanMasked: string | null;
  readonly beneficiaryBic: string | null;
  readonly tenantId: string | null;
  readonly concurrencyStamp: string;
}
