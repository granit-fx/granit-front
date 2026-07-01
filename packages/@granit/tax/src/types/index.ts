import type { ISODateString } from '@granit/types';

/** Request payload for tax ID validation. */
export interface TaxValidateRequest {
  readonly taxId: string;
  readonly countryCode: string;
}

/** Response from a tax ID validation request. */
export interface TaxValidateResponse {
  readonly isValid: boolean;
  readonly companyName: string | null;
  readonly companyAddress: string | null;
  readonly requestIdentifier: string | null;
  readonly validatedAt: ISODateString | null;
  readonly source: string;
}

/** Tax rate row returned by the query engine (`GET /tax/rates`). */
export interface TaxRateEntry {
  readonly countryCode: string;
  readonly standardRate: number;
  readonly reducedRate?: number | null;
  readonly superReducedRate?: number | null;
  readonly parkingRate?: number | null;
  readonly effectiveFrom?: ISODateString | null;
  readonly effectiveTo?: ISODateString | null;
}

/** Full tax rate detail for a specific country (`GET /tax/rates/{countryCode}`). */
export interface TaxRateResponse {
  readonly countryCode: string;
  readonly standardRate: number;
  readonly reducedRate: number | null;
  readonly superReducedRate: number | null;
  readonly parkingRate: number | null;
  readonly effectiveFrom: ISODateString | null;
  readonly effectiveTo: ISODateString | null;
}
