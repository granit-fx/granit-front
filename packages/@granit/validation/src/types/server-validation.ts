/** Outcome of a single-field server-side validation. Mirrors .NET ValidationFieldStatus. */
export type ValidationFieldStatus = 'Valid' | 'Invalid' | 'ValidatorNotFound';

/** Request payload for single field server validation. Mirrors .NET ValidationFieldValidateRequest. */
export interface ValidationFieldValidateRequest {
  readonly errorCode: string;
  readonly value: string | null;
}

/** Result from single field server validation. Mirrors .NET ValidationFieldValidateResponse. */
export interface ValidationFieldValidateResponse {
  readonly errorCode: string;
  readonly status: ValidationFieldStatus;
}

/** Request payload for batch server validation. Mirrors .NET ValidationFieldValidateBatchRequest. */
export interface ValidationFieldValidateBatchRequest {
  readonly fields: readonly ValidationFieldValidateRequest[];
}

/** Response from batch server validation. Mirrors .NET ValidationFieldValidateBatchResponse. */
export interface ValidationFieldValidateBatchResponse {
  readonly results: readonly ValidationFieldValidateResponse[];
}
