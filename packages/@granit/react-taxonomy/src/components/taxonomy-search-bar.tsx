import { useDebouncedValue } from '@granit/react-data-lookup';
import { useId, useState } from 'react';

import { useTaxonomySearch } from '../hooks/use-taxonomy-search';

import type { TaxonomySearchResultItem } from '@granit/taxonomy';
import type { ReactNode } from 'react';

const DEFAULT_DEBOUNCE_MS = 300;
const DEFAULT_MIN_QUERY_LENGTH = 2;

export interface TaxonomySearchBarLabels {
  readonly placeholder?: string;
  readonly belowThreshold?: string;
  readonly empty?: string;
  readonly loading?: string;
  readonly error?: string;
}

export interface TaxonomySearchBarProps {
  readonly onSelect: (item: TaxonomySearchResultItem) => void;
  /**
   * Map an assembly-qualified `targetType` to a localised group heading.
   * When unset for a key, the bar falls back to the last `.` segment.
   */
  readonly targetTypeLabels?: Readonly<Record<string, string>>;
  readonly debounceMs?: number;
  readonly minQueryLength?: number;
  readonly labels?: TaxonomySearchBarLabels;
  readonly className?: string;
}

const DEFAULT_LABELS: Required<TaxonomySearchBarLabels> = {
  placeholder: 'Search…',
  belowThreshold: 'Type at least 2 characters',
  empty: 'No results.',
  loading: 'Searching…',
  error: 'Search failed.',
};

function fallbackTargetTypeLabel(targetType: string): string {
  const idx = targetType.lastIndexOf('.');
  return idx >= 0 ? targetType.slice(idx + 1) : targetType;
}

/**
 * Cross-entity taxonomy search bar. Owns its own debounce + min-length
 * threshold; results are grouped by `targetType` with localised headings
 * resolved from `targetTypeLabels` (fallback: last segment of the
 * assembly-qualified type name). Apps decide what to do on selection
 * (typically navigate to the target's detail page).
 *
 * Keyboard: arrow keys move within the flat option list across groups;
 * Enter selects the highlighted item; Escape closes the dropdown.
 */
export function TaxonomySearchBar({
  onSelect,
  targetTypeLabels,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  minQueryLength = DEFAULT_MIN_QUERY_LENGTH,
  labels,
  className,
}: TaxonomySearchBarProps): ReactNode {
  const labelStrings = { ...DEFAULT_LABELS, ...labels };
  const listboxId = useId();
  const [input, setInput] = useState('');
  const debounced = useDebouncedValue(input, debounceMs);
  const [highlight, setHighlight] = useState(0);
  const [open, setOpen] = useState(false);

  const enabled = debounced.length >= minQueryLength;
  const searchQuery = useTaxonomySearch({ q: debounced, enabled });

  const groups = searchQuery.data ?? [];
  const flatItems: readonly TaxonomySearchResultItem[] = groups.flatMap((group) => group.items);

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlight((h) => Math.min(h + 1, Math.max(flatItems.length - 1, 0)));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
      return;
    }
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const picked = flatItems[highlight];
      if (picked) {
        onSelect(picked);
        setOpen(false);
      }
    }
  }

  let content: ReactNode;
  if (!enabled) {
    content = (
      <div data-granit-taxonomy-search-below-threshold="">{labelStrings.belowThreshold}</div>
    );
  } else if (searchQuery.isLoading) {
    content = <div data-granit-taxonomy-search-loading="">{labelStrings.loading}</div>;
  } else if (searchQuery.isError) {
    content = (
      <div data-granit-taxonomy-search-error="" role="alert">
        {labelStrings.error}
      </div>
    );
  } else if (groups.length === 0) {
    content = <div data-granit-taxonomy-search-empty="">{labelStrings.empty}</div>;
  } else {
    let cursor = 0;
    content = (
      <ul id={listboxId} role="listbox" data-granit-taxonomy-search-list="">
        {groups.map((group) => {
          const heading =
            targetTypeLabels?.[group.targetType] ?? fallbackTargetTypeLabel(group.targetType);
          return (
            <li key={group.targetType} role="presentation" data-granit-taxonomy-search-group="">
              <h4 data-granit-taxonomy-search-group-heading="">{heading}</h4>
              <ul role="group">
                {group.items.map((item) => {
                  const index = cursor++;
                  const isHighlighted = index === highlight;
                  return (
                    <li
                      key={`${item.targetType}:${item.targetId}`}
                      role="option"
                      aria-selected={isHighlighted}
                      data-granit-taxonomy-search-item=""
                      data-granit-taxonomy-search-highlighted={isHighlighted ? '' : undefined}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        onSelect(item);
                        setOpen(false);
                      }}
                    >
                      <span data-granit-taxonomy-search-item-label="">{item.label}</span>
                      {item.snippet && (
                        <span data-granit-taxonomy-search-item-snippet="">{item.snippet}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div data-granit-taxonomy-search="" className={className}>
      <input
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        data-granit-taxonomy-search-input=""
        placeholder={labelStrings.placeholder}
        value={input}
        onChange={(event) => {
          setInput(event.target.value);
          setHighlight(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
      />
      {open && content}
    </div>
  );
}
