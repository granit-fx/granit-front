import { getInputProps } from '@granit/validation';
import { useMemo } from 'react';

import type { TranslateFunction } from './create-constraints-resolver';
import type { InputConstraintProps, SchemaConstraints } from '@granit/validation';

export interface FieldPropsResult {
  readonly inputProps: InputConstraintProps;
  readonly serverHint?: string;
  readonly patternHint?: string;
}

/**
 * Returns HTML input props, an optional server-only hint, and an optional
 * pattern hint for a constrained field.
 * Memoized — the returned object is referentially stable when inputs are unchanged.
 */
export function useFieldProps(
  constraints: SchemaConstraints,
  fieldName: string,
  t: TranslateFunction
): FieldPropsResult {
  return useMemo(() => {
    const constraint = constraints[fieldName];
    if (!constraint) {
      return { inputProps: {} };
    }

    const inputProps = getInputProps(constraint);
    const serverHint = constraint.granitValidator
      ? t(constraint.granitValidator, { nsSeparator: false })
      : undefined;
    const patternHint = constraint.patternHint
      ? t(constraint.patternHint, { nsSeparator: false })
      : undefined;

    return {
      inputProps,
      ...(serverHint !== undefined && { serverHint }),
      ...(patternHint !== undefined && { patternHint }),
    };
  }, [constraints, fieldName, t]);
}
