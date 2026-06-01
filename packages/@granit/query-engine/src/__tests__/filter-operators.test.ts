import { describe, expect, it } from 'vitest';

import {
  BOOLEAN_OPERATORS,
  DATE_OPERATORS,
  ENUM_OPERATORS,
  NUMBER_OPERATORS,
  OPERATOR_LABELS,
  STRING_OPERATORS,
  inferOperators,
} from '../utils/filter-operators';

describe('inferOperators', () => {
  it('returns string operators for String', () => {
    expect(inferOperators('String')).toBe(STRING_OPERATORS);
  });

  it('returns number operators for Int32', () => {
    expect(inferOperators('Int32')).toBe(NUMBER_OPERATORS);
  });

  it('returns number operators for Decimal', () => {
    expect(inferOperators('Decimal')).toBe(NUMBER_OPERATORS);
  });

  it('returns number operators for Double', () => {
    expect(inferOperators('Double')).toBe(NUMBER_OPERATORS);
  });

  it('returns number operators for Int64', () => {
    expect(inferOperators('Int64')).toBe(NUMBER_OPERATORS);
  });

  it('returns date operators for DateTime', () => {
    expect(inferOperators('DateTime')).toBe(DATE_OPERATORS);
  });

  it('returns date operators for DateTimeOffset', () => {
    expect(inferOperators('DateTimeOffset')).toBe(DATE_OPERATORS);
  });

  it('returns date operators for DateOnly', () => {
    expect(inferOperators('DateOnly')).toBe(DATE_OPERATORS);
  });

  it('returns boolean operators for Boolean', () => {
    expect(inferOperators('Boolean')).toBe(BOOLEAN_OPERATORS);
  });

  it('returns enum operators for Guid', () => {
    expect(inferOperators('Guid')).toBe(ENUM_OPERATORS);
  });

  it('returns enum operators for unknown types (enum fallback)', () => {
    expect(inferOperators('PatientStatus')).toBe(ENUM_OPERATORS);
  });
});

describe('operator constants', () => {
  it('STRING_OPERATORS contains expected operators', () => {
    expect(STRING_OPERATORS).toEqual(['Eq', 'Contains', 'StartsWith', 'EndsWith', 'In']);
  });

  it('NUMBER_OPERATORS contains expected operators', () => {
    expect(NUMBER_OPERATORS).toEqual(['Eq', 'Gt', 'Gte', 'Lt', 'Lte', 'In', 'Between']);
  });

  it('DATE_OPERATORS contains expected operators', () => {
    expect(DATE_OPERATORS).toEqual(['Eq', 'Gt', 'Gte', 'Lt', 'Lte', 'Between']);
  });

  it('BOOLEAN_OPERATORS contains only Eq', () => {
    expect(BOOLEAN_OPERATORS).toEqual(['Eq']);
  });

  it('ENUM_OPERATORS contains Eq and In', () => {
    expect(ENUM_OPERATORS).toEqual(['Eq', 'In']);
  });

  it('OPERATOR_LABELS has labels for all operators', () => {
    expect(OPERATOR_LABELS.Eq).toBe('=');
    expect(OPERATOR_LABELS.Contains).toBe('contains');
    expect(OPERATOR_LABELS.Gt).toBe('>');
    expect(OPERATOR_LABELS.Between).toBe('between');
  });
});
