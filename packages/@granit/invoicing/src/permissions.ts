/** Permission constants for the invoicing module. */
export const InvoicingPermissions = {
  Invoices: {
    Read: 'Invoicing.Invoices.Read',
    Create: 'Invoicing.Invoices.Create',
    Manage: 'Invoicing.Invoices.Manage',
    Download: 'Invoicing.Invoices.Download',
    Finalize: 'Invoicing.Invoices.Finalize',
    RecordPayment: 'Invoicing.Invoices.RecordPayment',
    Cancel: 'Invoicing.Invoices.Cancel',
    MarkUncollectible: 'Invoicing.Invoices.MarkUncollectible',
  },
  CreditNotes: {
    Read: 'Invoicing.CreditNotes.Read',
    Manage: 'Invoicing.CreditNotes.Manage',
  },
} as const;
