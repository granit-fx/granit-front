export const PaymentsPermissions = {
  Transactions: {
    Read: 'Payments.Transactions.Read',
  },
  Charges: {
    Execute: 'Payments.Charges.Execute',
  },
  Refunds: {
    Execute: 'Payments.Refunds.Execute',
  },
  Methods: {
    Read: 'Payments.Methods.Read',
    Manage: 'Payments.Methods.Manage',
  },
} as const;
