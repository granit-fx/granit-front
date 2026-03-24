// ---------------------------------------------------------------------------
// Smart filter — types for the SmartFilterBar (cmdk omnibox)
// ---------------------------------------------------------------------------

import type { FilterOperator } from './query-params.js';

/** Token type within the smart filter bar. */
export type FilterTokenType = 'filter' | 'preset' | 'quickFilter' | 'search';

/** A resolved token displayed as a badge in the SmartFilterBar. */
export interface FilterToken {
  readonly id: string;
  readonly type: FilterTokenType;
  /** Display label (e.g. "Statut = Actif"). */
  readonly label: string;
  /** For filter tokens: field name. */
  readonly field?: string;
  /** For filter tokens: operator. */
  readonly operator?: FilterOperator;
  /** For filter tokens: value(s). */
  readonly value?: string;
  /** For filter tokens: segmented label parts for styled display. */
  readonly labelParts?: {
    readonly field: string;
    readonly operator: string;
    readonly value: string;
  };
  /** For preset tokens: group name. */
  readonly group?: string;
  /** For preset/quickFilter tokens: preset/quick filter name. */
  readonly name?: string;
}

/** A suggestion shown in the cmdk dropdown. */
export interface FilterSuggestion {
  readonly id: string;
  readonly type: FilterTokenType;
  /** Display label. */
  readonly label: string;
  /** Technical value (when different from label, e.g. boolean "true" vs "Yes"). */
  readonly value?: string;
  /** Secondary description. */
  readonly description?: string;
  /** For field suggestions: field name. */
  readonly field?: string;
  /** For operator suggestions: available operators. */
  readonly operators?: readonly FilterOperator[];
  /** For value suggestions: suggested values. */
  readonly values?: readonly FilterSuggestionValue[];
  /** For preset suggestions: group name. */
  readonly group?: string;
  /** For preset/quickFilter suggestions: name. */
  readonly name?: string;
  /** Whether this value is currently selected (for multi-select like In operator). */
  readonly selected?: boolean;
  /** For field-search suggestions: the operator to apply directly. */
  readonly operator?: FilterOperator;
  /** For field-search suggestions: the raw search text typed by the user. */
  readonly searchValue?: string;
}

/** A suggested value (e.g. enum values, recent values). */
export interface FilterSuggestionValue {
  readonly value: string;
  readonly label: string;
}

/** State machine phases for the smart filter input flow. */
export type SmartFilterPhase = 'idle' | 'selectField' | 'selectOperator' | 'enterValue';
