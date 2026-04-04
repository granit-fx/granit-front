/** Request body for setting a feature override. */
export interface SetFeatureOverrideRequest {
  readonly value: string;
}

/** A logical group of feature definitions. */
export interface FeatureGroupResponse {
  readonly name: string;
  readonly displayName: string | null;
  readonly features: readonly FeatureDefinitionResponse[];
}

/** A single feature flag definition with its default value and constraints. */
export interface FeatureDefinitionResponse {
  readonly name: string;
  readonly defaultValue: string;
  readonly valueType: 'Toggle' | 'Numeric' | 'Selection';
  readonly numericConstraint: FeatureNumericConstraintResponse | null;
  readonly selectionValues: readonly string[] | null;
  readonly displayName: string | null;
  readonly description: string | null;
}

/** Numeric min/max constraint for a `Numeric` feature. */
export interface FeatureNumericConstraintResponse {
  readonly min: number;
  readonly max: number;
}

/** The resolved value of a feature flag. */
export interface FeatureValueResponse {
  readonly name: string;
  readonly value: string;
}
