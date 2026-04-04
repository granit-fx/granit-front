/** Permission constants for the customer-balance module. */
export const CustomerBalancePermissions = {
  Accounts: { Read: 'CustomerBalance.Accounts.Read' },
  Transactions: { Read: 'CustomerBalance.Transactions.Read' },
  Credits: { Manage: 'CustomerBalance.Credits.Manage' },
} as const;
