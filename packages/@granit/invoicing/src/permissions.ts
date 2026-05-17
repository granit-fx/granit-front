/** Permission constants for the invoicing module. */
export const InvoicingPermissions = {
  Invoices: {
    Read: 'Invoicing.Invoices.Read',
    Create: 'Invoicing.Invoices.Create',
    Manage: 'Invoicing.Invoices.Manage',
    Download: 'Invoicing.Invoices.Download',
  },
  CreditNotes: {
    Read: 'Invoicing.CreditNotes.Read',
    Manage: 'Invoicing.CreditNotes.Manage',
  },
} as const;
