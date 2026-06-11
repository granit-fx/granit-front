/**
 * Maps constraint types to i18next-compatible localization keys.
 * These keys mirror the .NET Validation: error-code convention.
 */
export const VALIDATION_ERROR_CODES = {
  required: 'Validation:Builtin:NotEmpty',
  maxLength: 'Validation:Builtin:MaximumLength',
  minLength: 'Validation:Builtin:MinimumLength',
  pattern: 'Validation:Builtin:RegularExpression',
  formatEmail: 'Validation:Builtin:Email',
  minimum: 'Validation:Builtin:GreaterThanOrEqual',
  maximum: 'Validation:Builtin:LessThanOrEqual',
  exclusiveMinimum: 'Validation:Builtin:GreaterThan',
  exclusiveMaximum: 'Validation:Builtin:LessThan',
} as const;

export type ValidationErrorCode =
  (typeof VALIDATION_ERROR_CODES)[keyof typeof VALIDATION_ERROR_CODES];
