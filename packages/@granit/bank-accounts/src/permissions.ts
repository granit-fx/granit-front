/**
 * Permission constants for the bank account referential. Mirrors
 * `Granit.BankAccounts.Endpoints.Permissions.BankAccountsPermissions`.
 *
 * `Verify` is split from `Manage` on purpose: verification (proof of ownership)
 * is a control step a payout/treasury operator may hold without the right to
 * create or archive accounts (ISO 27001 A.9.4 least privilege).
 */
export const BankAccountsPermissions = {
  Accounts: {
    /** Read bank accounts. */
    Read: 'BankAccounts.Accounts.Read',
    /** Create and archive bank accounts. */
    Manage: 'BankAccounts.Accounts.Manage',
    /** Verify a bank account (mark proof of ownership). */
    Verify: 'BankAccounts.Accounts.Verify',
  },
} as const;
