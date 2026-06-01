import type { FieldConstraint, InputConstraintProps } from './types/index';

const FORMAT_TO_TYPE: Readonly<Record<string, string>> = {
  email: 'email',
};

/**
 * Converts a FieldConstraint to HTML input attributes.
 *
 * Only attributes that provide useful UX without conflicting with
 * react-hook-form's resolver are included:
 * - maxLength: prevents typing beyond the limit (no native tooltip)
 * - min/max: constrains number spinners
 * - type: sets input mode (email, number)
 *
 * Intentionally omitted (they trigger native browser validation tooltips
 * that conflict with the resolver's localized error messages):
 * - required, minLength, pattern
 */
export function getInputProps(constraint: FieldConstraint): InputConstraintProps {
  const props: Record<string, unknown> = {};

  if (constraint.maxLength !== undefined) {
    props['maxLength'] = constraint.maxLength;
  }

  if (constraint.format !== undefined && FORMAT_TO_TYPE[constraint.format]) {
    props['type'] = FORMAT_TO_TYPE[constraint.format];
  }

  if (constraint.minimum !== undefined) {
    props['min'] = constraint.minimum;
  } else if (constraint.exclusiveMinimum !== undefined) {
    props['min'] = constraint.exclusiveMinimum + 1;
  }

  if (constraint.maximum !== undefined) {
    props['max'] = constraint.maximum;
  } else if (constraint.exclusiveMaximum !== undefined) {
    props['max'] = constraint.exclusiveMaximum - 1;
  }

  return props;
}
