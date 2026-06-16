import { toISODateString } from '@granit/types';

import type { TaxRateEntry, TaxValidateResponse } from '@granit/tax';
import type { ISODateString } from '@granit/types';

export const sampleTaxRates: TaxRateEntry[] = [
  {
    countryCode: 'BE',
    standardRate: 21,
    reducedRate: 6,
    superReducedRate: null,
    parkingRate: 12,
    effectiveFrom: toISODateString('2024-01-01T00:00:00Z') as ISODateString,
    effectiveTo: null,
  },
  {
    countryCode: 'FR',
    standardRate: 20,
    reducedRate: 5.5,
    superReducedRate: 2.1,
    parkingRate: null,
    effectiveFrom: toISODateString('2024-01-01T00:00:00Z') as ISODateString,
    effectiveTo: null,
  },
  {
    countryCode: 'DE',
    standardRate: 19,
    reducedRate: 7,
    superReducedRate: null,
    parkingRate: null,
    effectiveFrom: toISODateString('2024-01-01T00:00:00Z') as ISODateString,
    effectiveTo: null,
  },
  {
    countryCode: 'NL',
    standardRate: 21,
    reducedRate: 9,
    superReducedRate: null,
    parkingRate: null,
    effectiveFrom: toISODateString('2024-01-01T00:00:00Z') as ISODateString,
    effectiveTo: null,
  },
  {
    countryCode: 'GB',
    standardRate: 20,
    reducedRate: 5,
    superReducedRate: null,
    parkingRate: null,
    effectiveFrom: toISODateString('2024-01-01T00:00:00Z') as ISODateString,
    effectiveTo: null,
  },
];

export const sampleValidation: TaxValidateResponse = {
  isValid: true,
  companyName: 'Digital Dynamics SRL',
  companyAddress: 'Rue de la Loi 42, 1000 Brussels',
  requestIdentifier: 'BE0123456789',
  validatedAt: toISODateString('2026-04-04T10:00:00Z') as ISODateString,
  source: 'VIES',
};
