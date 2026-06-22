// @granit/react-ui-tax — i18next resource bundle (flat keys, "translation" ns).
// Register in the host app:
//   import { taxTranslationsEn } from "@granit/react-ui-tax";
//   i18n.addResourceBundle("en", "translation", taxTranslationsEn, true, true);
//
// Keys are flat exact-match strings (the host runs with keySeparator=false /
// nsSeparator=false, so `Tax.Rates.Title` is a single literal key). Only `Tax.*`
// keys ship here; the shared `Common.*` and `Operators.*` keys consumed by the
// admin-kit smart-filter bar are owned by the host bundle.

export const taxTranslationsEn = {
  'Tax.Rates.Actions.ViewDetails': 'View Details',
  'Tax.Rates.Columns.CountryCode': 'Country Code',
  'Tax.Rates.Columns.ReducedRate': 'Reduced Rate',
  'Tax.Rates.Columns.StandardRate': 'Standard Rate',
  'Tax.Rates.Detail.EffectiveFrom': 'Effective From',
  'Tax.Rates.Detail.EffectiveTo': 'Effective To',
  'Tax.Rates.Detail.ParkingRate': 'Parking Rate',
  'Tax.Rates.Detail.SuperReducedRate': 'Super Reduced Rate',
  'Tax.Rates.NoResults': 'No tax rates found',
  'Tax.Rates.NotFound': 'Tax rate not found',
  'Tax.Rates.Subtitle': 'Manage tax rates',
  'Tax.Rates.Title': 'Tax Rates',
  'Tax.Validate.CompanyAddress': 'Company Address',
  'Tax.Validate.CompanyName': 'Company Name',
  'Tax.Validate.CountryCode': 'Country Code',
  'Tax.Validate.CountryCodePlaceholder': 'e.g. BE',
  'Tax.Validate.FormTitle': 'Tax Validation',
  'Tax.Validate.Invalid': 'Invalid',
  'Tax.Validate.RequestIdentifier': 'Request Identifier',
  'Tax.Validate.ResultTitle': 'Validation Result',
  'Tax.Validate.Source': 'Source',
  'Tax.Validate.Submit': 'Validate',
  'Tax.Validate.Subtitle': 'Validate tax identifiers',
  'Tax.Validate.TaxId': 'Tax ID',
  'Tax.Validate.TaxIdPlaceholder': 'e.g. BE0123456789',
  'Tax.Validate.Title': 'Tax Validation',
  'Tax.Validate.Valid': 'Valid',
  'Tax.Validate.ValidatedAt': 'Validated At',
} as const;

export type TaxTranslations = typeof taxTranslationsEn;
