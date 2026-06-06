import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useSmartFilter } from '../hooks/use-smart-filter';

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

  it('maps the operator to selectedFieldLookupMulti (Eq → single, In → multi)', () => {
    const { result } = renderHook(() => useSmartFilter({ metadata: METADATA_WITH_LOOKUP }));

    act(() => result.current.selectField('TenantId'));
    act(() => result.current.selectOperator('Eq'));
    expect(result.current.selectedFieldLookupMulti).toBe(false);

    act(() => result.current.selectOperator('In'));
    expect(result.current.selectedFieldLookupMulti).toBe(true);
  });

  it('derives the lookup scope from active filters (cascade), case-insensitively', () => {
    const { result } = renderHook(() => useSmartFilter({ metadata: METADATA_WITH_LOOKUP }));

    // No tenant filter yet → scope value is undefined (Empty Scope Trap upstream).
    act(() => result.current.selectField('MeterId'));
    expect(result.current.selectedFieldLookupScope).toEqual({ tenantId: undefined });

    // Add an active `TenantId Eq acme` filter; the camelCase scopeKey resolves
    // against the PascalCase field name.
    act(() => result.current.addFilterToken('TenantId', 'Eq', 'acme', 'Tenant = Acme'));
    act(() => result.current.selectField('MeterId'));
    expect(result.current.selectedFieldLookupScope).toEqual({ tenantId: 'acme' });
  });

  it('confirmLookupValue commits the opaque key with a localized label (Eq)', () => {
    const { result } = renderHook(() => useSmartFilter({ metadata: METADATA_WITH_LOOKUP }));

    act(() => result.current.selectField('TenantId'));
    act(() => result.current.selectOperator('Eq'));
    act(() => result.current.confirmLookupValue('11111111-guid', 'Acme Corp'));

    expect(result.current.filters).toEqual([
      { field: 'TenantId', operator: 'Eq', value: '11111111-guid' },
    ]);
    const token = result.current.tokens.at(-1);
    expect(token?.label).toContain('Acme Corp');
    expect(token?.label).not.toContain('11111111-guid');
  });

  it('confirmLookupValue comma-joins multiple keys for the In operator', () => {
    const { result } = renderHook(() => useSmartFilter({ metadata: METADATA_WITH_LOOKUP }));

    act(() => result.current.selectField('TenantId'));
    act(() => result.current.selectOperator('In'));
    act(() => result.current.confirmLookupValue(['g1', 'g2'], 'Acme, Globex'));

    expect(result.current.filters).toEqual([{ field: 'TenantId', operator: 'In', value: 'g1,g2' }]);
  });
});

// ---------------------------------------------------------------------------
// Malformed / partial `/meta` payloads — degrade gracefully, never crash
// ---------------------------------------------------------------------------

describe('useSmartFilter — resilient to non-conforming metadata', () => {
  it('does not crash when the /meta response is an HTML string (SPA fallthrough)', () => {
    // An unintercepted /meta request resolves to the SPA `index.html` — a
    // truthy string. It must not throw `filterableFields is not iterable`.
    const html = '<!doctype html><html><body>app</body></html>' as unknown as QueryMetadata;
    const { result } = renderHook(() => useSmartFilter({ metadata: html }));

    expect(result.current.phase).toBe('idle');
    expect(result.current.suggestions).toEqual([]);
  });

  it('does not crash when metadata is missing array fields', () => {
    const partial = { ...MOCK_METADATA, filterableFields: undefined } as unknown as QueryMetadata;
    const { result } = renderHook(() => useSmartFilter({ metadata: partial }));

    // No field suggestions (filterableFields gone), but the still-present
    // preset / quick-filter arrays keep producing suggestions.
    expect(result.current.suggestions.some((s) => s.field === 'LastName')).toBe(false);
    expect(result.current.suggestions.some((s) => s.type === 'preset')).toBe(true);
  });

  it('does not crash selecting a field when filterableFields is missing', () => {
    const partial = { ...MOCK_METADATA, filterableFields: undefined } as unknown as QueryMetadata;
    const { result } = renderHook(() => useSmartFilter({ metadata: partial }));

    act(() => result.current.selectField('LastName'));
    expect(result.current.selectedFieldType).toBeUndefined();
    expect(result.current.selectedFieldLookup).toBeUndefined();
  });

  it('treats an empty object as empty metadata rather than throwing', () => {
    const { result } = renderHook(() => useSmartFilter({ metadata: {} as QueryMetadata }));
    expect(result.current.suggestions).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// buildFieldSearchSuggestions — operator fallback and column-label paths
// ---------------------------------------------------------------------------

describe('useSmartFilter — field search suggestion branches', () => {
  it('uses Eq operator when Contains is absent from the field operators', () => {
    const metadata: QueryMetadata = {
      ...MOCK_METADATA,
      filterableFields: [{ name: 'Code', type: 'String', operators: ['Eq', 'StartsWith'] }],
      columns: [{ name: 'Code', label: 'Code', type: 'String', order: 0, isSortable: false, isFilterable: true, isVisible: true }],
    };
    const { result } = renderHook(() => useSmartFilter({ metadata }));
    act(() => result.current.setInput('A'));
    const suggestion = result.current.suggestions.find((s) => s.field === 'Code');
    expect(suggestion).toBeDefined();
    expect(suggestion!.operator).toBe('Eq');
  });

  it('skips a String field whose operators include neither Contains nor Eq', () => {
    const metadata: QueryMetadata = {
      ...MOCK_METADATA,
      filterableFields: [{ name: 'Slug', type: 'String', operators: ['StartsWith'] }],
      columns: [{ name: 'Slug', label: 'Slug', type: 'String', order: 0, isSortable: false, isFilterable: true, isVisible: true }],
    };
    const { result } = renderHook(() => useSmartFilter({ metadata }));
    act(() => result.current.setInput('a'));
    expect(result.current.suggestions.find((s) => s.field === 'Slug')).toBeUndefined();
  });

  it('falls back to field.name when the field is absent from metadata.columns', () => {
    const metadata: QueryMetadata = {
      ...MOCK_METADATA,
      filterableFields: [{ name: 'OrphanField', type: 'String', operators: ['Contains'] }],
      columns: [],
    };
    const { result } = renderHook(() => useSmartFilter({ metadata }));
    act(() => result.current.setInput('x'));
    const suggestion = result.current.suggestions.find((s) => s.field === 'OrphanField');
    expect(suggestion).toBeDefined();
    expect(suggestion!.label).toBe('OrphanField');
  });
});
