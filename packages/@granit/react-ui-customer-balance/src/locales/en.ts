// @granit/react-ui-customer-balance — i18next resource bundle (flat keys, "translation" ns).
// Register in the host app:
//   import { customerBalanceTranslationsEn } from "@granit/react-ui-customer-balance";
//   i18n.addResourceBundle("en", "translation", customerBalanceTranslationsEn, true, true);

export const customerBalanceTranslationsEn = {
  'CustomerBalance.AddCredit': 'Add Credit',
  'CustomerBalance.AddCreditDescription':
    'Issue an administrative credit on the customer balance. Choose a source and provide a reason for audit traceability.',
  'CustomerBalance.ApplyDebit': 'Apply Debit',
  'CustomerBalance.ApplyDebitDescription':
    "Debit a party's balance manually — for corrections, scheduled drawdowns, and non-invoice adjustments. Provide a reference ID to make the operation idempotent.",
  'CustomerBalance.Columns.Amount': 'Amount',
  'CustomerBalance.Columns.Date': 'Date',
  'CustomerBalance.Columns.Description': 'Description',
  'CustomerBalance.Columns.Reference': 'Reference',
  'CustomerBalance.Columns.Type': 'Type',
  'CustomerBalance.Credit': 'Credit',
  'CustomerBalance.CreditError': 'Failed to add credit',
  'CustomerBalance.CreditSuccess': 'Credit added successfully',
  'CustomerBalance.Currency': 'Currency',
  'CustomerBalance.CurrentBalance': 'Current Balance',
  'CustomerBalance.Debit': 'Debit',
  'CustomerBalance.DebitError': 'Failed to apply debit',
  'CustomerBalance.DebitSuccess': 'Debit applied successfully',
  'CustomerBalance.Fields.Amount': 'Amount',
  'CustomerBalance.Fields.Currency': 'Currency',
  'CustomerBalance.Fields.ExpiresAt': 'Expires At',
  'CustomerBalance.Fields.PartyId': 'Party ID',
  'CustomerBalance.Fields.Reason': 'Reason',
  'CustomerBalance.Fields.ReferenceId': 'Reference ID',
  'CustomerBalance.Fields.ReferenceType': 'Reference Type',
  'CustomerBalance.Fields.Source': 'Source',
  'CustomerBalance.LastUpdated': 'Last Updated',
  'CustomerBalance.Source.ManualAdjustment': 'Manual Adjustment',
  'CustomerBalance.Source.Promotional': 'Promotional',
  'CustomerBalance.Submit': 'Submit',
  'CustomerBalance.Submitting': 'Submitting…',
  'CustomerBalance.Subtitle': 'Manage customer balance',
  'CustomerBalance.Summary': 'Summary',
  'CustomerBalance.Title': 'Customer Balance',
} as const;

export type CustomerBalanceTranslations = typeof customerBalanceTranslationsEn;
