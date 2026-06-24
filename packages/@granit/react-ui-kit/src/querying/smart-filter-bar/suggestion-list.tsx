// ---------------------------------------------------------------------------
// SuggestionList — cmdk command list for filter suggestions
// ---------------------------------------------------------------------------

import { Command } from 'cmdk';
import { CheckIcon, SearchIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { FilterSuggestion } from '@granit/query-engine';

export interface SuggestionListProps {
  readonly suggestions: readonly FilterSuggestion[];
  readonly onSelect: (suggestion: FilterSuggestion) => void;
}

/**
 * Renders filter suggestions inside a cmdk Command.List.
 */
export function SuggestionList({ suggestions, onSelect }: Readonly<SuggestionListProps>) {
  const { t } = useTranslation();

  if (suggestions.length === 0) {
    return <Command.Empty data-slot="suggestion-empty">No suggestions found.</Command.Empty>;
  }

  return (
    <Command.List data-slot="suggestion-list" className="max-h-72 overflow-y-auto p-1.5">
      {suggestions.map((suggestion) => (
        <Command.Item
          key={suggestion.id}
          value={suggestion.id}
          data-slot="suggestion-item"
          data-suggestion-type={suggestion.type}
          onSelect={() => onSelect(suggestion)}
          className="flex cursor-pointer items-center justify-between gap-4 rounded-sm px-3 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
        >
          {suggestion.searchValue ? (
            <span className="flex items-center gap-2">
              <SearchIcon className="size-3.5 text-muted-foreground" />
              <span>
                {t('SmartFilter.SearchFieldPrefix')}{' '}
                <span className="font-semibold">{suggestion.label}</span>
                {t('SmartFilter.SearchFieldSuffix')}{' '}
                <span className="italic text-muted-foreground">{suggestion.searchValue}</span>
              </span>
            </span>
          ) : (
            <>
              <span className="flex items-center gap-2">
                {suggestion.selected !== undefined && (
                  <CheckIcon
                    className={`size-4 ${suggestion.selected ? 'text-primary' : 'text-transparent'}`}
                  />
                )}
                <span className="font-medium">{suggestion.label}</span>
              </span>
              {suggestion.description && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  {suggestion.description}
                </span>
              )}
            </>
          )}
        </Command.Item>
      ))}
    </Command.List>
  );
}
