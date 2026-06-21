// ---------------------------------------------------------------------------
// SmartFilterBar — cmdk-powered omnibox for filters (Story #52)
// ---------------------------------------------------------------------------

import { QUERY_LIMITS } from '@granit/query-engine';
import { useTranslation } from '@granit/react-localization';
import { Popover, PopoverAnchor, PopoverContent } from '@granit/react-ui';
import { cn } from '@granit/utils';
import { Command } from 'cmdk';
import { SearchIcon, XCircleIcon } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

import { FacetBadge } from './facet-badge.js';
import { LookupSuggestionList } from './lookup-suggestion-list.js';
import { SuggestionList } from './suggestion-list.js';

import type { FilterSuggestion, SmartFilterPhase } from '@granit/query-engine';
import type { UseSmartFilterReturn } from '@granit/react-query-engine';
import type { KeyboardEvent } from 'react';

function getInputMode(isInteger: boolean, isNumeric: boolean) {
  if (isInteger) return 'numeric' as const;
  if (isNumeric) return 'decimal' as const;
  return undefined;
}

export interface SmartFilterBarProps {
  /** The useSmartFilter return value. */
  readonly smartFilter: UseSmartFilterReturn;
  /** Placeholder text. */
  readonly placeholder?: string;
  /** CSS class for the root container. */
  readonly className?: string;
}

/**
 * Omnibox-style filter bar with cmdk suggestions dropdown.
 *
 * Renders active filter tokens as badges and provides a search input
 * with suggestions for fields, operators, presets, and quick filters.
 *
 * @example
 * ```tsx
 * const smartFilter = useSmartFilter({ metadata });
 * <SmartFilterBar smartFilter={smartFilter} placeholder="Search or filter..." />
 * ```
 */
function resolveDateInputType(
  phase: string,
  selectedOperator: string | null | undefined,
  selectedFieldType: string | null | undefined
): 'date' | 'datetime-local' | undefined {
  if (phase !== 'enterValue' || selectedOperator === 'In') return undefined;
  if (selectedFieldType === 'DateOnly') return 'date';
  if (
    selectedFieldType === 'DateTime' ||
    selectedFieldType === 'DateTimeOffset' ||
    selectedFieldType === 'DateTimeUtc'
  ) {
    return 'datetime-local';
  }
  return undefined;
}

export function SmartFilterBar({
  smartFilter,
  placeholder = 'Search or filter...',
  className,
}: Readonly<SmartFilterBarProps>) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const anchorRef = useRef<HTMLLabelElement>(null);
  const [focused, setFocused] = useState(false);
  const {
    phase,
    inputValue,
    tokens,
    suggestions,
    selectedOperator,
    selectedFieldType,
    selectedFieldLookup,
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
  } = smartFilter;

  const lookupActive = phase === 'enterValue' && !!selectedFieldLookup;
  const lookupMulti = lookupActive && selectedOperator === 'In';

  const handleLookupPickSingle = useCallback(
    (value: string) => {
      confirmValue(value);
    },
    [confirmValue]
  );

  const handleLookupPickMulti = useCallback(
    (nextCsv: string) => {
      setInput(nextCsv);
    },
    [setInput]
  );

  const applyInOperatorValue = useCallback(
    (val: string) => {
      const current = inputValue
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const next = current.includes(val) ? current.filter((v) => v !== val) : [...current, val];
      setInput(next.join(', '));
    },
    [inputValue, setInput]
  );

  const handleEnterValueSuggestion = useCallback(
    (suggestion: FilterSuggestion) => {
      const val = suggestion.value ?? suggestion.label;
      if (selectedOperator === 'In') {
        applyInOperatorValue(val);
      } else {
        confirmValue(val);
      }
    },
    [selectedOperator, applyInOperatorValue, confirmValue]
  );

  const handleFilterSuggestion = useCallback(
    (suggestion: FilterSuggestion) => {
      if (suggestion.searchValue && suggestion.field && suggestion.operator) {
        const opLabel = suggestion.description ?? suggestion.operator;
        addFilterToken(
          suggestion.field,
          suggestion.operator,
          suggestion.searchValue,
          `${suggestion.label} ${opLabel} ${suggestion.searchValue}`
        );
        return;
      }
      if (phase === 'idle' || phase === 'selectField') {
        if (suggestion.field) selectField(suggestion.field);
        return;
      }
      if (phase === 'selectOperator') {
        selectOperator(
          (suggestion.value ?? suggestion.label) as Parameters<typeof selectOperator>[0]
        );
        return;
      }
      if (phase === 'enterValue') {
        handleEnterValueSuggestion(suggestion);
      }
    },
    [phase, selectField, selectOperator, addFilterToken, handleEnterValueSuggestion]
  );

  const handleSelect = useCallback(
    (suggestion: FilterSuggestion) => {
      switch (suggestion.type) {
        case 'filter':
          handleFilterSuggestion(suggestion);
          break;
        case 'preset':
          if (suggestion.group && suggestion.name) {
            addPresetToken(suggestion.group, suggestion.name, suggestion.label);
          }
          break;
        case 'quickFilter':
          if (suggestion.name) {
            addQuickFilterToken(suggestion.name, suggestion.label);
          }
          break;
      }
      inputRef.current?.focus();
    },
    [handleFilterSuggestion, addPresetToken, addQuickFilterToken]
  );

  const showSuggestions = focused && (suggestions.length > 0 || lookupActive);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' && inputValue.trim() && !showSuggestions) {
        // Only handle Enter for free-text when no suggestions are shown.
        // When suggestions are visible, cmdk handles Enter via onSelect.
        if (phase === 'enterValue') {
          confirmValue(inputValue.trim());
        } else if (phase === 'idle' || phase === 'selectField') {
          addSearchToken(inputValue.trim());
        }
        e.preventDefault();
      } else if (e.key === 'Escape') {
        cancel();
        setFocused(false);
        inputRef.current?.blur();
        e.preventDefault();
      } else if (e.key === 'Backspace' && !inputValue && tokens.length > 0) {
        removeToken(tokens.at(-1)!.id);
        e.preventDefault();
      }
    },
    [inputValue, phase, tokens, showSuggestions, confirmValue, addSearchToken, cancel, removeToken]
  );

  // Numeric field types that should only accept digits and decimal separators
  const NUMERIC_TYPES = new Set(['Int32', 'Int64', 'Decimal', 'Double', 'Single', 'Float']);
  const isNumericField =
    phase === 'enterValue' && !!selectedFieldType && NUMERIC_TYPES.has(selectedFieldType);
  const isIntegerField =
    phase === 'enterValue' &&
    !!selectedFieldType &&
    (selectedFieldType === 'Int32' || selectedFieldType === 'Int64');

  // Date field types: browser-native picker via `type="date"` or `type="datetime-local"`.
  // `DateOnly` → calendar only (yyyy-MM-dd). Everything else → date + time (yyyy-MM-ddTHH:mm).
  const dateInputType: 'date' | 'datetime-local' | undefined = resolveDateInputType(
    phase,
    selectedOperator,
    selectedFieldType
  );
  const isDateField = dateInputType !== undefined;

  const handleInputChange = useCallback(
    (value: string) => {
      if (isDateField) {
        // Native date/datetime-local inputs already emit a canonical ISO-ish string;
        // pass through unchanged so confirmValue receives `yyyy-MM-dd[THH:mm]`.
        setInput(value);
        return;
      }
      if (isIntegerField) {
        // Allow only digits and optional leading minus
        const sanitized = value.replaceAll(/[^\d-]/g, '').replaceAll(/(?!^)-/g, '');
        setInput(sanitized);
        return;
      }
      if (isNumericField) {
        // Allow digits, one decimal separator, and optional leading minus
        const sanitized = value
          .replaceAll(/[^\d.,-]/g, '')
          .replaceAll(/(?!^)-/g, '')
          .replaceAll(/(\..*)\./g, '$1');
        setInput(sanitized);
        return;
      }
      setInput(value);
    },
    [isDateField, isNumericField, isIntegerField, setInput]
  );

  const PHASE_HINTS: Partial<Record<SmartFilterPhase, string>> = {
    selectOperator: t('Components.Querying.SmartFilter.SelectOperator'),
    enterValue: t('Components.Querying.SmartFilter.EnterValue'),
  };
  const phaseHint = PHASE_HINTS[phase];

  return (
    <Command
      data-slot="smart-filter-bar"
      shouldFilter={false}
      className={cn('outline-none', className)}
      onKeyDown={handleKeyDown}
    >
      <Popover open={showSuggestions}>
        <PopoverAnchor asChild>
          <label
            ref={anchorRef}
            className="flex min-h-10 cursor-text flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2"
            onClickCapture={() => setFocused(true)}
          >
            <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
            {tokens.map((token) => (
              <FacetBadge key={token.id} token={token} onRemove={removeToken} />
            ))}
            {isDateField ? (
              <input
                ref={inputRef}
                type={dateInputType}
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => setFocused(true)}
                placeholder={phaseHint ?? placeholder}
                data-slot="smart-filter-input"
                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm outline-none placeholder:text-muted-foreground focus:ring-0"
              />
            ) : (
              <Command.Input
                ref={inputRef}
                value={inputValue}
                onValueChange={handleInputChange}
                onFocus={() => setFocused(true)}
                placeholder={phaseHint ?? placeholder}
                inputMode={getInputMode(isIntegerField, isNumericField)}
                maxLength={phase === 'enterValue' ? undefined : QUERY_LIMITS.SEARCH_MAX_LENGTH}
                data-slot="smart-filter-input"
                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm outline-none placeholder:text-muted-foreground focus:ring-0"
              />
            )}
            {tokens.length > 0 && (
              <button
                type="button"
                aria-label={t('Components.Querying.SmartFilter.ClearAll')}
                className="shrink-0 text-muted-foreground hover:text-foreground"
                onClick={clearAll}
              >
                <XCircleIcon className="size-4" />
              </button>
            )}
          </label>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-anchor-width)] p-0"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => {
            if (anchorRef.current?.contains(e.target as Node)) {
              e.preventDefault();
              return;
            }
            setFocused(false);
          }}
          onInteractOutside={(e) => {
            if (anchorRef.current?.contains(e.target as Node)) {
              e.preventDefault();
              return;
            }
            setFocused(false);
          }}
        >
          {lookupActive && selectedFieldLookup ? (
            <LookupSuggestionList
              descriptor={selectedFieldLookup}
              search={inputValue}
              tokens={tokens}
              multi={lookupMulti}
              selectedValuesCsv={inputValue}
              onPickSingle={handleLookupPickSingle}
              onPickMulti={handleLookupPickMulti}
            />
          ) : (
            <SuggestionList suggestions={suggestions} onSelect={handleSelect} />
          )}
        </PopoverContent>
      </Popover>
    </Command>
  );
}
