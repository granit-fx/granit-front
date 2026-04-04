/** Tax module permission strings. Mirrors `TaxPermissions` in Granit.Tax.Endpoints. */
export const TaxPermissions = {
  Rates: {
    Read: 'Tax.Rates.Read',
    Manage: 'Tax.Rates.Manage',
  },
  Validations: {
    Read: 'Tax.Validations.Read',
    Execute: 'Tax.Validations.Execute',
  },
} as const;
