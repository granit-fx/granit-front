/**
 * Maps constraint types to i18next-compatible localization keys.
 * These keys mirror the .NET Granit.Validation error code convention.
 */
export const VALIDATION_ERROR_CODES = {
  required: 'Validation:NotEmptyValidator',
  maxLength: 'Validation:MaximumLengthValidator',
  minLength: 'Validation:MinimumLengthValidator',
  pattern: 'Validation:RegularExpressionValidator',
  formatEmail: 'Validation:EmailValidator',
  minimum: 'Validation:GreaterThanOrEqualValidator',
  maximum: 'Validation:LessThanOrEqualValidator',
  exclusiveMinimum: 'Validation:GreaterThanValidator',
  exclusiveMaximum: 'Validation:LessThanValidator',
} as const;

export type ValidationErrorCode =
  (typeof VALIDATION_ERROR_CODES)[keyof typeof VALIDATION_ERROR_CODES];
