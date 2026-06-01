import { describe, expect, expectTypeOf, it } from 'vitest';

import { isHexColor } from '../types/index';

import type {
  CategoryAssignmentRequest,
  CategoryDetailResponse,
  CategoryResponse,
  HexColor,
  TagAssignmentRequest,
  TagResponse,
  TaxonomySearchResultGroup,
  TaxonomySearchResultItem,
  TaxonomyTargetRef,
} from '../types/index';

describe('Taxonomy types', () => {
  it('TagResponse carries the readonly hex color contract + audit timestamps', () => {
    expectTypeOf<TagResponse>().toMatchTypeOf<{
      readonly id: string;
      readonly scope: string;
      readonly name: string;
      readonly color: HexColor;
      readonly hideOnEntityCard: boolean;
      readonly createdAt: string;
      readonly updatedAt: string;
    }>();
  });

  it('TagAssignmentRequest is structurally a TaxonomyTargetRef', () => {
    expectTypeOf<TagAssignmentRequest>().toEqualTypeOf<TaxonomyTargetRef>();
  });

  it('CategoryAssignmentRequest is structurally a TaxonomyTargetRef', () => {
    expectTypeOf<CategoryAssignmentRequest>().toEqualTypeOf<TaxonomyTargetRef>();
  });

  it('CategoryResponse parentId is nullable for scope roots', () => {
    expectTypeOf<CategoryResponse>().toMatchTypeOf<{
      readonly parentId: string | null;
      readonly path: string;
      readonly depth: number;
      readonly hasChildren: boolean;
    }>();
  });

  it('CategoryDetailResponse augments CategoryResponse with a root→leaf breadcrumb', () => {
    expectTypeOf<CategoryDetailResponse>().toMatchTypeOf<
      CategoryResponse & { readonly breadcrumb: readonly CategoryResponse[] }
    >();
  });

  it('TaxonomySearchResultGroup groups items by targetType', () => {
    expectTypeOf<TaxonomySearchResultGroup>().toMatchTypeOf<{
      readonly targetType: string;
      readonly items: readonly TaxonomySearchResultItem[];
    }>();
  });
});

describe('isHexColor', () => {
  it('accepts canonical 7-character hex values (upper- and lower-case)', () => {
    expect(isHexColor('#1a2b3c')).toBe(true);
    expect(isHexColor('#AABBCC')).toBe(true);
    expect(isHexColor('#000000')).toBe(true);
    expect(isHexColor('#ffffff')).toBe(true);
  });

  it('rejects shorthand, missing-hash, non-hex, and over-long inputs', () => {
    expect(isHexColor('#abc')).toBe(false);
    expect(isHexColor('aabbcc')).toBe(false);
    expect(isHexColor('#12345')).toBe(false);
    expect(isHexColor('#1234567')).toBe(false);
    expect(isHexColor('#GGHHII')).toBe(false);
    expect(isHexColor('red')).toBe(false);
    expect(isHexColor('')).toBe(false);
  });

  it('narrows the type to HexColor on success', () => {
    const candidate: string = '#abcdef';
    if (isHexColor(candidate)) {
      expectTypeOf(candidate).toEqualTypeOf<HexColor>();
    }
  });
});
