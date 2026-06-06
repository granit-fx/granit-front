// ---------------------------------------------------------------------------
// OpenAPI spec types (minimal subset for constraint extraction)
// ---------------------------------------------------------------------------

/** Minimal OpenAPI 3.x document accepted by extractConstraints. */
export interface OpenApiSpec {
  readonly components?: {
    readonly schemas?: Readonly<Record<string, OpenApiSchema>>;
  };
}

/** Minimal OpenAPI schema object with constraint-relevant properties. */
export interface OpenApiSchema {
  readonly type?: string;
  readonly format?: string;
  readonly required?: readonly string[];
  readonly properties?: Readonly<Record<string, OpenApiSchemaProperty>>;
  readonly allOf?: readonly OpenApiSchemaRef[];
  readonly $ref?: string;
}

/** A property within an OpenAPI schema. */
export interface OpenApiSchemaProperty {
  readonly type?: string;
  readonly format?: string;
  readonly maxLength?: number;
  readonly minLength?: number;
  readonly pattern?: string;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly exclusiveMinimum?: number;
  readonly exclusiveMaximum?: number;
  readonly 'x-granit-validator'?: string;
  readonly 'x-granit-pattern-hint'?: string;
}

/** A $ref or inline schema within allOf. */
export type OpenApiSchemaRef = OpenApiSchemaProperty & {
  readonly $ref?: string;
  readonly required?: readonly string[];
  readonly properties?: Readonly<Record<string, OpenApiSchemaProperty>>;
};

// ---------------------------------------------------------------------------
// Constraint types (output of extraction)
// ---------------------------------------------------------------------------

/** Validation constraints for a single field, extracted from OpenAPI schema. */
export interface FieldConstraint {
  readonly required?: boolean;
  readonly maxLength?: number;
  readonly minLength?: number;
  readonly pattern?: string;
  readonly patternHint?: string;
  readonly format?: string;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly exclusiveMinimum?: number;
  readonly exclusiveMaximum?: number;
  readonly granitValidator?: string;
}

/** Map of field name to its constraints for a single schema. */
export type SchemaConstraints = Readonly<Record<string, FieldConstraint>>;

/** Map of schema name to SchemaConstraints (one entry per OpenAPI schema). */
export type SpecConstraints = Readonly<Record<string, SchemaConstraints>>;

/** Options for extractConstraints(). */
export interface ExtractOptions {
  /** Whitelist of schema names to extract. */
  readonly schemas?: readonly string[];
  /** Regex pattern to match schema names. */
  readonly schemaPattern?: RegExp;
}

// ---------------------------------------------------------------------------
// Validation result types
// ---------------------------------------------------------------------------

/** A single validation error for a field. */
export interface FieldValidationError {
  readonly code: string;
  readonly params?: Readonly<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// Input prop types
// ---------------------------------------------------------------------------

/**
 * HTML input attributes derived from a FieldConstraint.
 * Only includes attributes that don't trigger native browser validation tooltips.
 */
export interface InputConstraintProps {
  readonly type?: string;
  readonly maxLength?: number;
  readonly min?: number;
  readonly max?: number;
}

// ---------------------------------------------------------------------------
// Server validation types (re-exported from server-validation.ts)
// ---------------------------------------------------------------------------

export type {
  ValidationFieldValidateBatchRequest,
  ValidationFieldValidateBatchResponse,
  ValidationFieldValidateRequest,
  ValidationFieldValidateResponse,
  ValidationFieldStatus,
} from './server-validation';
