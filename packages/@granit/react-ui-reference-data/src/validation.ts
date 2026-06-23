import type { SchemaConstraints } from '@granit/validation';

/**
 * Hand-written field constraints for creating a reference-data entry. Mirrors the
 * resolved `CreateReferenceDataRequest` OpenAPI constraints (the showcase reads
 * these from a generated fixture; the shared toolkit ships them inline).
 */
export const createReferenceDataConstraints: SchemaConstraints = {
  labelEn: {
    required: true,
    maxLength: 250,
    minLength: 1,
  },
  labelFr: {
    maxLength: 250,
  },
  labelNl: {
    maxLength: 250,
  },
  labelDe: {
    maxLength: 250,
  },
  sortOrder: {
    minimum: 0,
  },
  activated: {},
  validFrom: {
    format: 'date',
  },
  validTo: {
    format: 'date',
  },
  parentCode: {
    maxLength: 50,
  },
  code: {
    required: true,
    maxLength: 50,
    minLength: 1,
    pattern: '^[A-Z0-9_-]+$',
    patternHint: 'Validation:Hints:ReferenceDataCode',
  },
};

/**
 * Hand-written field constraints for updating a reference-data entry. Mirrors the
 * resolved `UpdateReferenceDataRequest` OpenAPI constraints — same as create minus
 * the immutable `code` field.
 */
export const editReferenceDataConstraints: SchemaConstraints = {
  labelEn: {
    required: true,
    maxLength: 250,
    minLength: 1,
  },
  labelFr: {
    maxLength: 250,
  },
  labelNl: {
    maxLength: 250,
  },
  labelDe: {
    maxLength: 250,
  },
  sortOrder: {
    minimum: 0,
  },
  activated: {},
  validFrom: {
    format: 'date',
  },
  validTo: {
    format: 'date',
  },
  parentCode: {
    maxLength: 50,
  },
};
