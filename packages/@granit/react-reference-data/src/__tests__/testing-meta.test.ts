import { describe, expect, it } from 'vitest';

import { buildReferenceDataMeta } from '../testing';

/** Echoes the key so assertions can prove which key was looked up. */
const echoKey = (key: string) => key;
/** Ignores the key so assertions can prove the fallback is used. */
const useFallback = (_key: string, fallback: string) => fallback;

describe('buildReferenceDataMeta', () => {
  const columns = [
    { name: 'code', label: 'Code', isSortable: true, isFilterable: true },
    { name: 'activated', label: 'Active', key: 'Active', type: 'Boolean' },
  ];

  it('derives the column label key from the prefix and the PascalCased name', () => {
    const meta = buildReferenceDataMeta({
      t: echoKey,
      i18nPrefix: 'Countries',
      columns: [{ name: 'subRegion', label: 'Sub-region' }],
      filterableFields: [],
      sortableFields: [],
    });

    expect(meta.columns[0]?.label).toBe('Countries.Columns.SubRegion');
  });

  it('honours an explicit key where it diverges from the field name', () => {
    const meta = buildReferenceDataMeta({
      t: echoKey,
      i18nPrefix: 'DocumentTypes',
      columns,
      filterableFields: [],
      sortableFields: [],
    });

    expect(meta.columns[1]?.label).toBe('DocumentTypes.Columns.Active');
  });

  it('numbers columns from 1 in declaration order', () => {
    const meta = buildReferenceDataMeta({
      t: useFallback,
      i18nPrefix: 'Countries',
      columns,
      filterableFields: [],
      sortableFields: [],
    });

    expect(meta.columns.map((c) => c.order)).toEqual([1, 2]);
  });

  it('defaults a column to visible, unsortable, unfilterable and String', () => {
    const meta = buildReferenceDataMeta({
      t: useFallback,
      i18nPrefix: 'Countries',
      columns: [{ name: 'note', label: 'Note' }],
      filterableFields: [],
      sortableFields: [],
    });

    expect(meta.columns[0]).toMatchObject({
      type: 'String',
      isVisible: true,
      isSortable: false,
      isFilterable: false,
    });
  });

  it('always appends the status preset group last', () => {
    const meta = buildReferenceDataMeta({
      t: useFallback,
      i18nPrefix: 'Countries',
      columns,
      filterableFields: [],
      sortableFields: [],
      presetFilterGroups: [{ name: 'region', label: 'Region', presets: [] }],
    });

    expect(meta.presetFilterGroups.map((g) => g.name)).toEqual(['region', 'status']);
    expect(meta.presetFilterGroups[1]?.presets).toEqual([
      { name: 'active', label: 'Active', isDefault: true },
      { name: 'inactive', label: 'Inactive', isDefault: false },
    ]);
  });

  it('supplies the status group even when no other group is declared', () => {
    const meta = buildReferenceDataMeta({
      t: useFallback,
      i18nPrefix: 'Countries',
      columns,
      filterableFields: [],
      sortableFields: [],
    });

    expect(meta.presetFilterGroups).toHaveLength(1);
    expect(meta.presetFilterGroups[0]?.name).toBe('status');
  });

  it('applies the shared pagination defaults and lets callers override one', () => {
    const meta = buildReferenceDataMeta({
      t: useFallback,
      i18nPrefix: 'Countries',
      columns,
      filterableFields: [],
      sortableFields: [],
      pagination: { defaultPageSize: 50 },
    });

    expect(meta.pagination).toEqual({
      defaultPageSize: 50,
      maxPageSize: 100,
      maxStreamSize: 1000,
      supportsCursor: false,
    });
  });

  it('leaves quick filters, date filters and group-by empty unless stated', () => {
    const meta = buildReferenceDataMeta({
      t: useFallback,
      i18nPrefix: 'Countries',
      columns,
      filterableFields: [],
      sortableFields: [],
    });

    expect(meta.quickFilters).toEqual([]);
    expect(meta.dateFilters).toEqual([]);
    expect(meta.groupByFields).toEqual([]);
  });
});
