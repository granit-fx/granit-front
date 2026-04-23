import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useSmartFilter } from '../hooks/use-smart-filter.js';

import type { QueryMetadata } from '@granit/query-engine';

const MOCK_METADATA: QueryMetadata = {
  columns: [
    {
      name: 'LastName',
      label: 'Last Name',
      type: 'String',
      order: 0,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'Age',
      label: 'Age',
      type: 'Int32',
      order: 1,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
  ],
  filterableFields: [
    { name: 'LastName', type: 'String', operators: ['Eq', 'Contains', 'StartsWith'] },
    { name: 'Age', type: 'Int32', operators: ['Eq', 'Gt', 'Gte', 'Lt', 'Lte'] },
  ],
  sortableFields: [{ name: 'LastName' }, { name: 'Age' }],
  presetFilterGroups: [
    {
      name: 'Status',
      label: 'Status',
      presets: [
        { name: 'Active', label: 'Active', isDefault: true },
        { name: 'Inactive', label: 'Inactive', isDefault: false },
      ],
    },
  ],
  quickFilters: [{ name: 'MyItems', label: 'My Items', isDefault: false }],
  dateFilters: [],
  groupByFields: [],
  pagination: { defaultPageSize: 20, maxPageSize: 100, supportsCursor: false },
  defaultSort: '-LastName',
};

describe('useSmartFilter', () => {
  it('starts in idle phase with no tokens', () => {
    const { result } = renderHook(() => useSmartFilter({ metadata: MOCK_METADATA }));
    expect(result.current.phase).toBe('idle');
    expect(result.current.tokens).toEqual([]);
    expect(result.current.inputValue).toBe('');
  });

  it('provides field suggestions in idle phase', () => {
    const { result } = renderHook(() => useSmartFilter({ metadata: MOCK_METADATA }));
    // Should have field suggestions + preset suggestions + quick filter suggestions
    expect(result.current.suggestions.length).toBeGreaterThan(0);
    const fieldSuggestion = result.current.suggestions.find((s) => s.field === 'LastName');
    expect(fieldSuggestion).toBeDefined();
    expect(fieldSuggestion!.type).toBe('filter');
  });

  it('filters suggestions by input value', () => {
    const { result } = renderHook(() => useSmartFilter({ metadata: MOCK_METADATA }));
    act(() => result.current.setInput('last'));
    const suggestions = result.current.suggestions;
    expect(suggestions.some((s) => s.field === 'LastName')).toBe(true);
    expect(suggestions.some((s) => s.field === 'Age')).toBe(false);
  });

  it('transitions to selectOperator on field selection', () => {
    const { result } = renderHook(() => useSmartFilter({ metadata: MOCK_METADATA }));
    act(() => result.current.selectField('LastName'));
    expect(result.current.phase).toBe('selectOperator');
    // Should show operator suggestions
    expect(result.current.suggestions.some((s) => s.label === 'Eq')).toBe(true);
    expect(result.current.suggestions.some((s) => s.label === 'Contains')).toBe(true);
  });

  it('transitions to enterValue on operator selection', () => {
    const { result } = renderHook(() => useSmartFilter({ metadata: MOCK_METADATA }));
    act(() => result.current.selectField('LastName'));
    act(() => result.current.selectOperator('Contains'));
    expect(result.current.phase).toBe('enterValue');
  });

  it('creates a filter token on confirmValue', () => {
    const { result } = renderHook(() => useSmartFilter({ metadata: MOCK_METADATA }));
    act(() => result.current.selectField('LastName'));
    act(() => result.current.selectOperator('Contains'));
    act(() => result.current.confirmValue('Dupont'));
    expect(result.current.phase).toBe('idle');
    expect(result.current.tokens).toHaveLength(1);
    expect(result.current.tokens[0].type).toBe('filter');
    expect(result.current.tokens[0].field).toBe('LastName');
    expect(result.current.tokens[0].operator).toBe('Contains');
    expect(result.current.tokens[0].value).toBe('Dupont');
  });

  it('extracts filters from tokens', () => {
    const { result } = renderHook(() => useSmartFilter({ metadata: MOCK_METADATA }));
    act(() => result.current.selectField('Age'));
    act(() => result.current.selectOperator('Gte'));
    act(() => result.current.confirmValue('18'));
    expect(result.current.filters).toEqual([{ field: 'Age', operator: 'Gte', value: '18' }]);
  });

  it('adds a preset token', () => {
    const { result } = renderHook(() => useSmartFilter({ metadata: MOCK_METADATA }));
    act(() => result.current.addPresetToken('Status', 'Active', 'Active'));
    expect(result.current.tokens).toHaveLength(1);
    expect(result.current.tokens[0].type).toBe('preset');
    expect(result.current.presets).toEqual({ Status: ['Active'] });
  });

  it('replaces preset token for same group', () => {
    const { result } = renderHook(() => useSmartFilter({ metadata: MOCK_METADATA }));
    act(() => result.current.addPresetToken('Status', 'Active', 'Active'));
    act(() => result.current.addPresetToken('Status', 'Inactive', 'Inactive'));
    expect(result.current.tokens).toHaveLength(1);
    expect(result.current.tokens[0].name).toBe('Inactive');
  });

  it('toggles a quick filter token', () => {
    const { result } = renderHook(() => useSmartFilter({ metadata: MOCK_METADATA }));
    act(() => result.current.addQuickFilterToken('MyItems', 'My Items'));
    expect(result.current.tokens).toHaveLength(1);
    expect(result.current.quickFilters).toEqual(['MyItems']);
    // Toggle off
    act(() => result.current.addQuickFilterToken('MyItems', 'My Items'));
    expect(result.current.tokens).toHaveLength(0);
    expect(result.current.quickFilters).toEqual([]);
  });

  it('adds a search token', () => {
    const { result } = renderHook(() => useSmartFilter({ metadata: MOCK_METADATA }));
    act(() => result.current.addSearchToken('Dupont'));
    expect(result.current.tokens).toHaveLength(1);
    expect(result.current.search).toBe('Dupont');
  });

  it('replaces search token on new search', () => {
    const { result } = renderHook(() => useSmartFilter({ metadata: MOCK_METADATA }));
    act(() => result.current.addSearchToken('Dupont'));
    act(() => result.current.addSearchToken('Martin'));
    expect(result.current.tokens).toHaveLength(1);
    expect(result.current.search).toBe('Martin');
  });

  it('removes a token by id', () => {
    const { result } = renderHook(() => useSmartFilter({ metadata: MOCK_METADATA }));
    act(() => result.current.addSearchToken('test'));
    const id = result.current.tokens[0].id;
    act(() => result.current.removeToken(id));
    expect(result.current.tokens).toHaveLength(0);
  });

  it('clears all tokens', () => {
    const { result } = renderHook(() => useSmartFilter({ metadata: MOCK_METADATA }));
    act(() => result.current.addSearchToken('test'));
    act(() => result.current.addPresetToken('Status', 'Active', 'Active'));
    act(() => result.current.clearAll());
    expect(result.current.tokens).toHaveLength(0);
    expect(result.current.phase).toBe('idle');
  });

  it('cancels current input flow', () => {
    const { result } = renderHook(() => useSmartFilter({ metadata: MOCK_METADATA }));
    act(() => result.current.selectField('LastName'));
    expect(result.current.phase).toBe('selectOperator');
    act(() => result.current.cancel());
    expect(result.current.phase).toBe('idle');
  });

  it('returns empty suggestions without metadata', () => {
    const { result } = renderHook(() => useSmartFilter());
    expect(result.current.suggestions).toEqual([]);
  });

  it('includes preset and quick filter suggestions', () => {
    const { result } = renderHook(() => useSmartFilter({ metadata: MOCK_METADATA }));
    const presetSuggestion = result.current.suggestions.find((s) => s.type === 'preset');
    expect(presetSuggestion).toBeDefined();
    expect(presetSuggestion!.label).toBe('Active');

    const qfSuggestion = result.current.suggestions.find((s) => s.type === 'quickFilter');
    expect(qfSuggestion).toBeDefined();
    expect(qfSuggestion!.label).toBe('My Items');
  });
});

// ---------------------------------------------------------------------------
// Lookup-backed fields — SmartFilter delegates to <LookupPicker>
// ---------------------------------------------------------------------------

const METADATA_WITH_LOOKUP: QueryMetadata = {
  ...MOCK_METADATA,
  filterableFields: [
    {
      name: 'TenantId',
      type: 'Guid',
      operators: ['Eq', 'In'],
      lookup: {
        name: 'tenants',
        kind: 'QueryEngine',
        requiredPermission: 'Platform.Tenants.Read',
      },
    },
    {
      name: 'MeterId',
      type: 'Guid',
      operators: ['Eq', 'In'],
      lookup: {
        name: 'meter-definitions',
        scopeKeys: ['tenantId'],
      },
    },
    ...MOCK_METADATA.filterableFields,
  ],
};

describe('useSmartFilter — lookup-backed fields', () => {
  it('exposes selectedFieldLookup when the selected field declares a lookup', () => {
    const { result } = renderHook(() => useSmartFilter({ metadata: METADATA_WITH_LOOKUP }));
    act(() => result.current.selectField('TenantId'));

    expect(result.current.selectedFieldLookup).toEqual({
      name: 'tenants',
      kind: 'QueryEngine',
      requiredPermission: 'Platform.Tenants.Read',
    });
  });

  it('exposes scopeKeys via selectedFieldLookup for scoped sources', () => {
    const { result } = renderHook(() => useSmartFilter({ metadata: METADATA_WITH_LOOKUP }));
    act(() => result.current.selectField('MeterId'));

    expect(result.current.selectedFieldLookup?.scopeKeys).toEqual(['tenantId']);
  });

  it('returns undefined selectedFieldLookup for fields without a lookup', () => {
    const { result } = renderHook(() => useSmartFilter({ metadata: METADATA_WITH_LOOKUP }));
    act(() => result.current.selectField('LastName'));

    expect(result.current.selectedFieldLookup).toBeUndefined();
  });

  it('emits NO inline value suggestions during enterValue for lookup-backed fields', () => {
    const { result } = renderHook(() => useSmartFilter({ metadata: METADATA_WITH_LOOKUP }));
    act(() => result.current.selectField('TenantId'));
    act(() => result.current.selectOperator('Eq'));

    expect(result.current.phase).toBe('enterValue');
    // No enum / boolean suggestions — the consumer renders <LookupPicker> instead.
    expect(result.current.suggestions).toEqual([]);
  });

  it('selectedFieldLookup is undefined in idle phase', () => {
    const { result } = renderHook(() => useSmartFilter({ metadata: METADATA_WITH_LOOKUP }));

    expect(result.current.phase).toBe('idle');
    expect(result.current.selectedFieldLookup).toBeUndefined();
  });
});
