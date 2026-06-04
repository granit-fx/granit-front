// ---------------------------------------------------------------------------
// useSmartFilter — state machine for the SmartFilterBar (Story #51)
// ---------------------------------------------------------------------------

import { useCallback, useMemo, useReducer } from 'react';

import type { LookupDescriptor } from '@granit/data-lookup';
import type {
  FilterEntry,
  FilterOperator,
  FilterSuggestion,
  FilterToken,
  QueryMetadata,
  SmartFilterPhase,
} from '@granit/query-engine';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

interface SmartFilterState {
  readonly phase: SmartFilterPhase;
  readonly inputValue: string;
  readonly tokens: readonly FilterToken[];
  /** Selected field (during selectOperator / enterValue phases). */
  readonly selectedField?: string;
  /** Selected operator (during enterValue phase). */
  readonly selectedOperator?: FilterOperator;
  /** Counter for generating unique token IDs. */
  readonly nextId: number;
}

type SmartFilterAction =
  | { type: 'SET_INPUT'; value: string }
  | { type: 'SELECT_FIELD'; field: string }
  | { type: 'SELECT_OPERATOR'; operator: FilterOperator }
  | {
      type: 'CONFIRM_VALUE';
      value: string;
      label?: string;
      labelParts?: { field: string; operator: string; value: string };
    }
  | { type: 'ADD_PRESET_TOKEN'; group: string; name: string; label: string }
  | { type: 'ADD_QUICK_FILTER_TOKEN'; name: string; label: string }
  | { type: 'ADD_SEARCH_TOKEN'; value: string }
  | {
      type: 'ADD_FILTER_TOKEN';
      field: string;
      operator: FilterOperator;
      value: string;
      label: string;
      labelParts?: { field: string; operator: string; value: string };
    }
  | { type: 'REMOVE_TOKEN'; id: string }
  | { type: 'CLEAR_ALL' }
  | { type: 'CANCEL' }
  | { type: 'SYNC_TOKENS'; tokens: readonly FilterToken[] };

function smartFilterReducer(state: SmartFilterState, action: SmartFilterAction): SmartFilterState {
  switch (action.type) {
    case 'SET_INPUT':
      return { ...state, inputValue: action.value };

    case 'SELECT_FIELD':
      return {
        ...state,
        phase: 'selectOperator',
        selectedField: action.field,
        inputValue: '',
      };

    case 'SELECT_OPERATOR':
      return {
        ...state,
        phase: 'enterValue',
        selectedOperator: action.operator,
        inputValue: '',
      };

    case 'CONFIRM_VALUE': {
      const token: FilterToken = {
        id: `filter-${state.nextId}`,
        type: 'filter',
        label: action.label ?? `${state.selectedField} ${state.selectedOperator} ${action.value}`,
        labelParts: action.labelParts,
        field: state.selectedField,
        operator: state.selectedOperator,
        value: action.value,
      };
      return {
        ...state,
        phase: 'idle',
        inputValue: '',
        selectedField: undefined,
        selectedOperator: undefined,
        tokens: [...state.tokens, token],
        nextId: state.nextId + 1,
      };
    }

    case 'ADD_PRESET_TOKEN': {
      // Remove existing token for same group, then add
      const filtered = state.tokens.filter(
        (t) => !(t.type === 'preset' && t.group === action.group)
      );
      const token: FilterToken = {
        id: `preset-${state.nextId}`,
        type: 'preset',
        label: action.label,
        group: action.group,
        name: action.name,
      };
      return {
        ...state,
        phase: 'idle',
        inputValue: '',
        tokens: [...filtered, token],
        nextId: state.nextId + 1,
      };
    }

    case 'ADD_QUICK_FILTER_TOKEN': {
      // Toggle: remove if exists, add if not
      const existing = state.tokens.find((t) => t.type === 'quickFilter' && t.name === action.name);
      if (existing) {
        return {
          ...state,
          tokens: state.tokens.filter((t) => t.id !== existing.id),
        };
      }
      const token: FilterToken = {
        id: `qf-${state.nextId}`,
        type: 'quickFilter',
        label: action.label,
        name: action.name,
      };
      return {
        ...state,
        phase: 'idle',
        inputValue: '',
        tokens: [...state.tokens, token],
        nextId: state.nextId + 1,
      };
    }

    case 'ADD_SEARCH_TOKEN': {
      // Replace existing search token
      const filtered = state.tokens.filter((t) => t.type !== 'search');
      const token: FilterToken = {
        id: `search-${state.nextId}`,
        type: 'search',
        label: action.value,
      };
      return {
        ...state,
        phase: 'idle',
        inputValue: '',
        tokens: [...filtered, token],
        nextId: state.nextId + 1,
      };
    }

    case 'ADD_FILTER_TOKEN': {
      const token: FilterToken = {
        id: `filter-${state.nextId}`,
        type: 'filter',
        label: action.label,
        labelParts: action.labelParts,
        field: action.field,
        operator: action.operator,
        value: action.value,
      };
      return {
        ...state,
        phase: 'idle',
        inputValue: '',
        selectedField: undefined,
        selectedOperator: undefined,
        tokens: [...state.tokens, token],
        nextId: state.nextId + 1,
      };
    }

    case 'REMOVE_TOKEN':
      return {
        ...state,
        tokens: state.tokens.filter((t) => t.id !== action.id),
      };

    case 'CLEAR_ALL':
      return {
        ...state,
        phase: 'idle',
        inputValue: '',
        selectedField: undefined,
        selectedOperator: undefined,
        tokens: [],
      };

    case 'CANCEL':
      return {
        ...state,
        phase: 'idle',
        inputValue: '',
        selectedField: undefined,
        selectedOperator: undefined,
      };

    case 'SYNC_TOKENS':
      return { ...state, tokens: action.tokens };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Suggestion builder
// ---------------------------------------------------------------------------

function buildFieldSuggestions(metadata: QueryMetadata, input: string): FilterSuggestion[] {
  const suggestions: FilterSuggestion[] = [];
  for (const field of metadata.filterableFields) {
    const col = metadata.columns.find((c) => c.name === field.name);
    const label = col?.label ?? field.name;
    if (
      input &&
      !label.toLowerCase().includes(input) &&
      !field.name.toLowerCase().includes(input)
    ) {
      continue;
    }
    suggestions.push({
      id: `field-${field.name}`,
      type: 'filter',
      label,
      field: field.name,
      operators: field.operators,
    });
  }
  return suggestions;
}

function buildPresetSuggestions(metadata: QueryMetadata, input: string): FilterSuggestion[] {
  const suggestions: FilterSuggestion[] = [];
  for (const group of metadata.presetFilterGroups) {
    for (const preset of group.presets) {
      if (input && !preset.label.toLowerCase().includes(input)) continue;
      suggestions.push({
        id: `preset-${group.name}-${preset.name}`,
        type: 'preset',
        label: preset.label,
        description: group.label,
        group: group.name,
        name: preset.name,
      });
    }
  }
  return suggestions;
}

function buildQuickFilterSuggestions(metadata: QueryMetadata, input: string): FilterSuggestion[] {
  const suggestions: FilterSuggestion[] = [];
  for (const qf of metadata.quickFilters) {
    if (input && !qf.label.toLowerCase().includes(input)) continue;
    suggestions.push({
      id: `qf-${qf.name}`,
      type: 'quickFilter',
      label: qf.label,
      name: qf.name,
    });
  }
  return suggestions;
}

/** Text-type fields for which we generate "Search X for: Y" suggestions. */
const SEARCHABLE_FIELD_TYPES = new Set(['String', 'Text']);

function buildFieldSearchSuggestions(
  metadata: QueryMetadata,
  input: string,
  options?: BuildSuggestionsOptions
): FilterSuggestion[] {
  if (!input) return [];
  const suggestions: FilterSuggestion[] = [];
  for (const field of metadata.filterableFields) {
    if (!SEARCHABLE_FIELD_TYPES.has(field.type)) continue;
    // Pick the best operator: Contains if available, else Eq
    let operator: FilterOperator | undefined;
    if (field.operators.includes('Contains')) {
      operator = 'Contains';
    } else if (field.operators.includes('Eq')) {
      operator = 'Eq';
    }
    if (!operator) continue;
    const col = metadata.columns.find((c) => c.name === field.name);
    const fieldLabel = col?.label ?? field.name;
    const operatorLabel = options?.operatorLabels?.[operator] ?? operator;
    suggestions.push({
      id: `fsearch-${field.name}`,
      type: 'filter',
      label: fieldLabel,
      description: operatorLabel,
      field: field.name,
      operator,
      searchValue: input,
    });
  }
  return suggestions;
}

interface BuildSuggestionsOptions {
  readonly booleanLabels?: { readonly true: string; readonly false: string };
  readonly operatorLabels?: Partial<Record<FilterOperator, string>>;
}

function buildBooleanSuggestions(
  field: { readonly name: string },
  labels?: { readonly true: string; readonly false: string }
): FilterSuggestion[] {
  return [
    {
      id: 'val-true',
      type: 'filter',
      label: labels?.true ?? 'true',
      value: 'true',
      field: field.name,
    },
    {
      id: 'val-false',
      type: 'filter',
      label: labels?.false ?? 'false',
      value: 'false',
      field: field.name,
    },
  ];
}

function buildEnumSuggestions(
  field: { readonly name: string; readonly enumValues: readonly string[] },
  state: SmartFilterState,
  input: string
): FilterSuggestion[] {
  const isIn = state.selectedOperator === 'In';
  const parts = isIn
    ? state.inputValue
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const enumSet = new Set(field.enumValues.map((v) => v.toLowerCase()));
  const selectedValues = parts.filter((p) => enumSet.has(p.toLowerCase()));
  const rawLastPart = isIn
    ? (state.inputValue.split(',').pop()?.trim().toLowerCase() ?? '')
    : input;
  const filterText =
    isIn && selectedValues.some((v) => v.toLowerCase() === rawLastPart) ? '' : rawLastPart;
  const selectedSet = new Set(selectedValues.map((v) => v.toLowerCase()));
  return field.enumValues
    .filter(
      (v) => !filterText || v.toLowerCase().includes(filterText) || selectedSet.has(v.toLowerCase())
    )
    .map((v) => ({
      id: `val-${v}`,
      type: 'filter' as const,
      label: v,
      value: v,
      field: field.name,
      selected: selectedSet.has(v.toLowerCase()),
    }));
}

function buildValueSuggestions(
  state: SmartFilterState,
  metadata: QueryMetadata,
  options?: BuildSuggestionsOptions
): FilterSuggestion[] {
  const field = metadata.filterableFields.find((f) => f.name === state.selectedField);
  if (!field) return [];
  // Lookup-backed fields delegate value input to <LookupPicker>. The hook stops
  // emitting inline suggestions so the consumer renders the picker instead.
  if (field.lookup) return [];
  if (field.type === 'Boolean') {
    return buildBooleanSuggestions(field, options?.booleanLabels);
  }
  if (field.enumValues && field.enumValues.length > 0) {
    return buildEnumSuggestions(
      { name: field.name, enumValues: field.enumValues },
      state,
      state.inputValue.toLowerCase()
    );
  }
  return [];
}

function buildSuggestions(
  state: SmartFilterState,
  metadata: QueryMetadata | undefined,
  options?: BuildSuggestionsOptions
): readonly FilterSuggestion[] {
  if (!metadata) return [];
  const input = state.inputValue.toLowerCase();

  switch (state.phase) {
    case 'idle':
    case 'selectField':
      return [
        ...buildFieldSearchSuggestions(metadata, input, options),
        ...buildFieldSuggestions(metadata, input),
        ...buildPresetSuggestions(metadata, input),
        ...buildQuickFilterSuggestions(metadata, input),
      ];

    case 'selectOperator': {
      const field = metadata.filterableFields.find((f) => f.name === state.selectedField);
      if (!field) return [];
      return field.operators.map((op) => ({
        id: `op-${op}`,
        type: 'filter' as const,
        label: options?.operatorLabels?.[op] ?? op,
        value: op,
        field: field.name,
      }));
    }

    case 'enterValue':
      return buildValueSuggestions(state, metadata, options);
  }
}

/**
 * Defensive normalization of the `/meta` payload.
 *
 * Suggestion building iterates the array fields of {@link QueryMetadata}
 * (`filterableFields`, `columns`, `presetFilterGroups`, `quickFilters`). A
 * `/meta` response that is missing, partial, or not the expected shape — a
 * backend that omits a field, an API-version skew, or (in dev) an
 * unintercepted request falling through to the SPA's `index.html` — would
 * otherwise throw `metadata.filterableFields is not iterable` and take down
 * the whole route through the router error boundary.
 *
 * Returns `undefined` for anything that isn't a metadata-shaped object;
 * otherwise backfills missing array fields with `[]` so every consumer sees a
 * guaranteed shape. A malformed `/meta` then degrades to an empty suggestion
 * list instead of crashing the page.
 */
function normalizeMetadata(metadata: QueryMetadata | undefined): QueryMetadata | undefined {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return undefined;
  const asArray = <T>(value: readonly T[]): readonly T[] => (Array.isArray(value) ? value : []);
  return {
    ...metadata,
    columns: asArray(metadata.columns),
    filterableFields: asArray(metadata.filterableFields),
    sortableFields: asArray(metadata.sortableFields),
    presetFilterGroups: asArray(metadata.presetFilterGroups),
    quickFilters: asArray(metadata.quickFilters),
    dateFilters: asArray(metadata.dateFilters),
    groupByFields: asArray(metadata.groupByFields),
  };
}

// ---------------------------------------------------------------------------
// Hook options & return
// ---------------------------------------------------------------------------

export interface UseSmartFilterOptions {
  /** Query metadata for building suggestions. */
  readonly metadata?: QueryMetadata;
  /** Localized labels for boolean value suggestions (defaults to "true"/"false"). */
  readonly booleanLabels?: { readonly true: string; readonly false: string };
  /** Localized labels for filter operators (defaults to technical names). */
  readonly operatorLabels?: Partial<Record<FilterOperator, string>>;
}

export interface UseSmartFilterReturn {
  readonly phase: SmartFilterPhase;
  readonly inputValue: string;
  readonly tokens: readonly FilterToken[];
  readonly suggestions: readonly FilterSuggestion[];
  /** Currently selected operator (during enterValue phase). */
  readonly selectedOperator?: FilterOperator;
  /** Type of the currently selected field (during selectOperator / enterValue phases). */
  readonly selectedFieldType?: string;
  /**
   * Data-lookup descriptor for the currently selected field, if any. When set,
   * the UI should render `<LookupPicker>` during the `enterValue` phase instead
   * of the free-text / enum input. `undefined` for fields without a lookup source.
   */
  readonly selectedFieldLookup?: LookupDescriptor;
  /** Extracted FilterEntry array from current tokens (for useQueryEndpoint). */
  readonly filters: readonly FilterEntry[];
  /** Extracted search string from tokens. */
  readonly search: string | undefined;
  /** Extracted presets from tokens. */
  readonly presets: Readonly<Record<string, readonly string[]>>;
  /** Extracted quick filter names from tokens. */
  readonly quickFilters: readonly string[];
  // Actions
  readonly setInput: (value: string) => void;
  readonly selectField: (field: string) => void;
  readonly selectOperator: (operator: FilterOperator) => void;
  readonly confirmValue: (value: string) => void;
  readonly addPresetToken: (group: string, name: string, label: string) => void;
  readonly addQuickFilterToken: (name: string, label: string) => void;
  readonly addSearchToken: (value: string) => void;
  readonly addFilterToken: (
    field: string,
    operator: FilterOperator,
    value: string,
    label: string
  ) => void;
  readonly removeToken: (id: string) => void;
  readonly clearAll: () => void;
  readonly cancel: () => void;
}

/**
 * State machine hook for the SmartFilterBar.
 *
 * Manages the input flow (field → operator → value), token lifecycle,
 * and suggestion generation based on query metadata.
 *
 * @example
 * ```tsx
 * const { tokens, suggestions, phase, selectField, confirmValue } = useSmartFilter({
 *   metadata: queryMeta.data,
 * });
 * ```
 */
export function useSmartFilter(options?: UseSmartFilterOptions): UseSmartFilterReturn {
  const [state, dispatch] = useReducer(smartFilterReducer, {
    phase: 'idle',
    inputValue: '',
    tokens: [],
    nextId: 1,
  });

  // Normalize the `/meta` payload once so a missing / partial / non-conforming
  // response degrades to empty suggestions instead of crashing the route. Every
  // consumer below reads `metadata` (never `options?.metadata`) for this reason.
  const metadata = useMemo(() => normalizeMetadata(options?.metadata), [options?.metadata]);

  const suggestions = useMemo(
    () =>
      buildSuggestions(state, metadata, {
        booleanLabels: options?.booleanLabels,
        operatorLabels: options?.operatorLabels,
      }),
    [state, metadata, options?.booleanLabels, options?.operatorLabels]
  );

  // Extract structured data from tokens
  const filters = useMemo<readonly FilterEntry[]>(
    () =>
      state.tokens
        .filter((t) => t.type === 'filter' && t.field && t.operator && t.value)
        .map((t) => ({
          field: t.field!,
          operator: t.operator!,
          value: t.value!,
        })),
    [state.tokens]
  );

  const search = useMemo(() => {
    const searchToken = state.tokens.find((t) => t.type === 'search');
    return searchToken?.label;
  }, [state.tokens]);

  const presets = useMemo(() => {
    const result: Record<string, string[]> = {};
    for (const t of state.tokens) {
      if (t.type === 'preset' && t.group && t.name) {
        const group = (result[t.group] ??= []);
        group.push(t.name);
      }
    }
    return result;
  }, [state.tokens]);

  const quickFilters = useMemo(
    () => state.tokens.filter((t) => t.type === 'quickFilter' && t.name).map((t) => t.name!),
    [state.tokens]
  );

  // Memoized dispatchers
  const setInput = useCallback((value: string) => dispatch({ type: 'SET_INPUT', value }), []);
  const selectField = useCallback((field: string) => dispatch({ type: 'SELECT_FIELD', field }), []);
  const selectOperator = useCallback(
    (operator: FilterOperator) => dispatch({ type: 'SELECT_OPERATOR', operator }),
    []
  );
  const confirmValue = useCallback(
    (value: string) => {
      const field = state.selectedField;
      const operator = state.selectedOperator;
      const col = metadata?.columns.find((c) => c.name === field);
      const fieldLabel = col?.label ?? field ?? '';
      const opLabel = (operator && options?.operatorLabels?.[operator]) ?? operator ?? '';
      const isBool =
        metadata?.filterableFields.find((f) => f.name === field)?.type === 'Boolean';
      let valLabel = value;
      if (isBool && options?.booleanLabels) {
        valLabel = value === 'true' ? options.booleanLabels.true : options.booleanLabels.false;
      }
      dispatch({
        type: 'CONFIRM_VALUE',
        value,
        label: `${fieldLabel} ${opLabel} ${valLabel}`,
        labelParts: { field: fieldLabel, operator: opLabel, value: valLabel },
      });
    },
    [
      state.selectedField,
      state.selectedOperator,
      metadata,
      options?.operatorLabels,
      options?.booleanLabels,
    ]
  );
  const addPresetToken = useCallback(
    (group: string, name: string, label: string) =>
      dispatch({ type: 'ADD_PRESET_TOKEN', group, name, label }),
    []
  );
  const addQuickFilterToken = useCallback(
    (name: string, label: string) => dispatch({ type: 'ADD_QUICK_FILTER_TOKEN', name, label }),
    []
  );
  const addSearchToken = useCallback(
    (value: string) => dispatch({ type: 'ADD_SEARCH_TOKEN', value }),
    []
  );
  const addFilterToken = useCallback(
    (field: string, operator: FilterOperator, value: string, label: string) =>
      dispatch({ type: 'ADD_FILTER_TOKEN', field, operator, value, label }),
    []
  );
  const removeToken = useCallback((id: string) => dispatch({ type: 'REMOVE_TOKEN', id }), []);
  const clearAll = useCallback(() => dispatch({ type: 'CLEAR_ALL' }), []);
  const cancel = useCallback(() => dispatch({ type: 'CANCEL' }), []);

  const selectedFieldType = useMemo(() => {
    if (!state.selectedField || !metadata) return undefined;
    return metadata.filterableFields.find((f) => f.name === state.selectedField)?.type;
  }, [state.selectedField, metadata]);

  const selectedFieldLookup = useMemo(() => {
    if (!state.selectedField || !metadata) return undefined;
    return metadata.filterableFields.find((f) => f.name === state.selectedField)?.lookup;
  }, [state.selectedField, metadata]);

  return {
    phase: state.phase,
    inputValue: state.inputValue,
    tokens: state.tokens,
    suggestions,
    selectedOperator: state.selectedOperator,
    selectedFieldType,
    selectedFieldLookup,
    filters,
    search,
    presets,
    quickFilters,
    setInput,
    selectField,
    selectOperator,
    confirmValue,
    addPresetToken,
    addQuickFilterToken,
    addSearchToken,
    addFilterToken,
    removeToken,
    clearAll,
    cancel,
  };
}
