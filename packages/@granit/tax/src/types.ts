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
  readonly validatedAt: string | null;
  readonly source: string;
}

/** Tax rate information for a specific country. */
export interface TaxRateResponse {
  readonly countryCode: string;
  readonly standardRate: number;
  readonly reducedRate: number | null;
  readonly superReducedRate: number | null;
  readonly parkingRate: number | null;
  readonly effectiveFrom: string | null;
  readonly effectiveTo: string | null;
}
