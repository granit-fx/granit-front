/** Storage and validation type of a feature value. Mirrors `Granit.Features.ValueTypes.FeatureValueType`. */
export type FeatureValueType = 'Toggle' | 'Numeric' | 'Selection';

/** Min/max bounds for Numeric features. Mirrors `Granit.Features.ValueTypes.FeatureNumericConstraint`. */
export interface FeatureNumericConstraint {
  readonly min: number;
  readonly max: number;
}

/** Allowed values for Selection features. Mirrors `Granit.Features.Endpoints.FeatureDefinitionResponse.SelectionValues`. */
export type SelectionValues = readonly string[];

/** Static metadata for a feature. Mirrors `Granit.Features.Endpoints.FeatureDefinitionResponse`. */
export interface FeatureDefinition {
  readonly name: string;
  readonly defaultValue: string;
  readonly valueType: FeatureValueType;
  readonly numericConstraint: FeatureNumericConstraint | null;
  readonly selectionValues: SelectionValues | null;
  readonly displayName: string | null;
  readonly description: string | null;
}

/** Grouped feature definitions. Mirrors `Granit.Features.Definitions.FeatureGroup`. */
export interface FeatureGroup {
  readonly name: string;
  readonly displayName: string | null;
  readonly features: readonly FeatureDefinition[];
}

/** Response for `GET /features/values` — all resolved feature values. */
export type FeatureValuesMap = Record<string, string>;

/** Response for `GET /features/values/{name}` — single resolved value. */
export interface FeatureValueResponse {
  readonly name: string;
  readonly value: string;
}

/** Request body for `PUT /features/overrides/{name}`. */
export interface SetFeatureOverrideRequest {
  readonly value: string;
}

// ── Admin types ─────────────────────────────────────────────────────────────

/** Admin-scoped feature flag with audit metadata. */
export interface AdminFeatureFlag {
  readonly key: string;
  readonly label: string;
  readonly description: string;
  readonly enabled: boolean;
  readonly lastModified: string;
  readonly modifiedBy: string;
}
