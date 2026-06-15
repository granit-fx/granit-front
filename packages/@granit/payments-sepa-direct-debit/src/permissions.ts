/**
 * SEPA Direct Debit permissions. A dedicated group (distinct from `Payments`):
 * SEPA Direct Debit legally engages the company, so the SEPA / treasury
 * administrator role is commonly separate from the generic payments administrator.
 *
 * Mirrors the backend `SepaDirectDebitPermissions`.
 */
export const SepaDirectDebitPermissions = {
  Mandates: {
    Read: 'SepaDirectDebit.Mandates.Read',
    Create: 'SepaDirectDebit.Mandates.Create',
    Confirm: 'SepaDirectDebit.Mandates.Confirm',
    /** Override a provider-backed mandate's activation by hand (audited). */
    ConfirmOverride: 'SepaDirectDebit.Mandates.ConfirmOverride',
    Cancel: 'SepaDirectDebit.Mandates.Cancel',
  },
  Configuration: {
    Manage: 'SepaDirectDebit.Configuration.Manage',
  },
} as const;
