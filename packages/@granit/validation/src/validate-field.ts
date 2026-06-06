import { VALIDATION_ERROR_CODES } from './constants/error-codes';

import type { FieldConstraint, FieldValidationError } from './types/index';

// Each segment between @ and dots uses [^\s@.]+ to prevent backtracking overlap
const EMAIL_REGEX = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

/** Returns true when the value is absent or blank — used to skip optional-field validation. */
export function isEmptyFieldValue(value: unknown): boolean {
  return (
    value === undefined || value === null || (typeof value === 'string' && value.trim() === '')
  );
}

function validateStringConstraints(
  strValue: string,
  constraint: FieldConstraint,
  errors: FieldValidationError[]
): void {
  if (constraint.minLength !== undefined && strValue.length < constraint.minLength) {
    errors.push({
      code: VALIDATION_ERROR_CODES.minLength,
      params: { minLength: constraint.minLength },
    });
  }

  if (constraint.maxLength !== undefined && strValue.length > constraint.maxLength) {
    errors.push({
      code: VALIDATION_ERROR_CODES.maxLength,
      params: { maxLength: constraint.maxLength },
    });
  }

  if (constraint.pattern !== undefined && !new RegExp(constraint.pattern).test(strValue)) {
    errors.push({
      code: VALIDATION_ERROR_CODES.pattern,
      params: {
        pattern: constraint.pattern,
        ...(constraint.patternHint !== undefined && { patternHint: constraint.patternHint }),
      },
    });
  }

  if (constraint.format === 'email' && !EMAIL_REGEX.test(strValue)) {
    errors.push({ code: VALIDATION_ERROR_CODES.formatEmail });
  }
}

function validateNumericConstraints(
  numValue: number,
  constraint: FieldConstraint,
  errors: FieldValidationError[]
): void {
  if (constraint.minimum !== undefined && numValue < constraint.minimum) {
    errors.push({
      code: VALIDATION_ERROR_CODES.minimum,
      params: { minimum: constraint.minimum },
    });
  }

  if (constraint.maximum !== undefined && numValue > constraint.maximum) {
    errors.push({
      code: VALIDATION_ERROR_CODES.maximum,
      params: { maximum: constraint.maximum },
    });
  }

  if (constraint.exclusiveMinimum !== undefined && numValue <= constraint.exclusiveMinimum) {
    errors.push({
      code: VALIDATION_ERROR_CODES.exclusiveMinimum,
      params: { exclusiveMinimum: constraint.exclusiveMinimum },
    });
  }

  if (constraint.exclusiveMaximum !== undefined && numValue >= constraint.exclusiveMaximum) {
    errors.push({
      code: VALIDATION_ERROR_CODES.exclusiveMaximum,
      params: { exclusiveMaximum: constraint.exclusiveMaximum },
    });
  }
}

/**
 * Validates a field value against a FieldConstraint.
 * Returns an array of validation errors (empty if valid).
 * Server-only `granitValidator` constraints are intentionally skipped.
 */
export function validateField(
  value: unknown,
  constraint: FieldConstraint
): readonly FieldValidationError[] {
  const errors: FieldValidationError[] = [];

  if (constraint.required && isEmptyFieldValue(value)) {
    errors.push({ code: VALIDATION_ERROR_CODES.required });
  }

  // Skip remaining checks for empty non-required fields
  if (isEmptyFieldValue(value)) {
    return errors;
  }

  validateStringConstraints(String(value), constraint, errors);
  validateNumericConstraints(Number(value), constraint, errors);

  return errors;
}
