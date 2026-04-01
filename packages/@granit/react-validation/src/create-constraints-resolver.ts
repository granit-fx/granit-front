import { VALIDATION_ERROR_CODES, validateField } from '@granit/validation';

import type { FieldValidationError, SchemaConstraints } from '@granit/validation';

/** Translation function compatible with i18next t() but with no hard dependency. */
export type TranslateFunction = (key: string, params?: Record<string, unknown>) => string;

/**
 * Shape compatible with react-hook-form's Resolver type.
 * Defined structurally to avoid a peer dependency on react-hook-form.
 */
export type ConstraintsResolver = (
  values: Record<string, unknown>,
  context: unknown,
  options: { fields: Record<string, { name: string }> }
) => Promise<{
  values: Record<string, unknown>;
  errors: Record<string, { type: string; message: string }>;
}>;

export interface ConstraintsResolverOptions {
  /**
   * Resolves a human-readable label for a field name.
   * Used as {PropertyName} in validation messages.
   * Defaults to the field name as-is.
   */
  readonly labelResolver?: (fieldName: string) => string;
}

/**
 * Creates a react-hook-form compatible resolver from OpenAPI-extracted constraints.
 * For each constrained field, calls validateField() and maps error codes to
 * localized messages via the provided translation function.
 */
export function createConstraintsResolver(
  constraints: SchemaConstraints,
  t: TranslateFunction,
  options?: ConstraintsResolverOptions
): ConstraintsResolver {
  return async (values, _context, formOptions) => {
    const errors: Record<string, { type: string; message: string }> = {};

    for (const fieldName of Object.keys(formOptions.fields)) {
      const constraint = constraints[fieldName];
      if (!constraint) continue;

      const fieldErrors: readonly FieldValidationError[] = validateField(
        values[fieldName],
        constraint
      );

      if (fieldErrors.length > 0) {
        const first = fieldErrors[0]!;
        const propertyName = options?.labelResolver?.(fieldName) ?? fieldName;

        let message = t(first.code, {
          ...first.params,
          PropertyName: propertyName,
          nsSeparator: false,
        } as Record<string, unknown>);

        if (constraint.patternHint && first.code === VALIDATION_ERROR_CODES.pattern) {
          const hint = t(constraint.patternHint, { nsSeparator: false });
          message = `${message} : ${hint}`;
        }

        errors[fieldName] = { type: first.code, message };
      }
    }

    return { values, errors };
  };
}
