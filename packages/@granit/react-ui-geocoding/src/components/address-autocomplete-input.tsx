'use client';

import { useAddressSuggestions } from '@granit/react-geocoding';
import { Input, Spinner } from '@granit/react-ui';
import { cn } from '@granit/utils';
import { useCallback, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { I18N_NAMESPACE } from '../constants';

import type { GeocodingSuggestionResponse } from '@granit/geocoding';
import type { UseAddressSuggestionsOptions } from '@granit/react-geocoding';
import type { KeyboardEvent, ReactElement } from 'react';

export interface AddressAutocompleteInputProps extends Pick<
  UseAddressSuggestionsOptions,
  'limit' | 'debounceMs' | 'minQueryLength'
> {
  /** Current input text (controlled). */
  readonly value: string;
  /** Called as the user types (the raw text). */
  readonly onValueChange: (next: string) => void;
  /**
   * Called when the user picks a suggestion. Fill the bound address form fields
   * from the structured components (`street`/`postalCode`/`locality`/`country`)
   * and keep `latitude`/`longitude` if present.
   */
  readonly onSelect: (suggestion: GeocodingSuggestionResponse) => void;
  readonly id?: string;
  readonly name?: string;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly required?: boolean;
  readonly className?: string;
  readonly 'aria-label'?: string;
  readonly 'aria-labelledby'?: string;
}

/**
 * Address typeahead: an accessible (WAI-ARIA combobox) input that suggests
 * addresses as the user types and, on selection, hands the caller the
 * structured components to fill a form.
 *
 * **Progressive enhancement.** When no `GeocodingProvider` is in scope, or the
 * endpoint is not mapped (provider not installed → 404), the dropdown never
 * opens and the field behaves as a plain text input — geocoding is never a hard
 * dependency. Input is debounced before it reaches the (shared, rate-limited)
 * provider, and in-flight requests are cancelled when the text changes.
 */
export function AddressAutocompleteInput(props: AddressAutocompleteInputProps): ReactElement {
  const {
    value,
    onValueChange,
    onSelect,
    id,
    name,
    placeholder,
    disabled = false,
    required = false,
    className,
    limit,
    debounceMs,
    minQueryLength,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
  } = props;

  const { t } = useTranslation(I18N_NAMESPACE);
  const reactId = useId();
  const listboxId = `${id ?? reactId}-listbox`;
  const getOptionId = useCallback((index: number) => `${listboxId}-option-${index}`, [listboxId]);

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  // A selection writes the label back into `value`; suppress the re-query that
  // the resulting text change would otherwise trigger.
  const suppressQueryRef = useRef(false);

  const { suggestions, isLoading, isFetching, isSuccess, isError, isUnavailable } =
    useAddressSuggestions(value, {
      limit,
      debounceMs,
      minQueryLength,
      enabled: open && !suppressQueryRef.current,
    });

  // When the capability is absent we degrade to a plain text input.
  const enhanced = !isUnavailable;
  const showList =
    enhanced && open && (suggestions.length > 0 || isLoading || isFetching || isError || isSuccess);

  const pick = useCallback(
    (suggestion: GeocodingSuggestionResponse | undefined) => {
      if (!suggestion) return;
      suppressQueryRef.current = true;
      onValueChange(suggestion.label);
      onSelect(suggestion);
      setOpen(false);
      setActiveIndex(-1);
    },
    [onSelect, onValueChange]
  );

  const onInputChange = useCallback(
    (next: string) => {
      suppressQueryRef.current = false;
      onValueChange(next);
      setOpen(true);
      setActiveIndex(-1);
    },
    [onValueChange]
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (!enhanced) return;
      switch (event.key) {
        case 'ArrowDown':
          if (suggestions.length === 0) return;
          event.preventDefault();
          setOpen(true);
          setActiveIndex((i) => (i + 1) % suggestions.length);
          break;
        case 'ArrowUp':
          if (suggestions.length === 0) return;
          event.preventDefault();
          setOpen(true);
          setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
          break;
        case 'Enter':
          if (open && activeIndex >= 0) {
            event.preventDefault();
            pick(suggestions[activeIndex]);
          }
          break;
        case 'Escape':
          setOpen(false);
          setActiveIndex(-1);
          break;
        default:
          break;
      }
    },
    [enhanced, suggestions, open, activeIndex, pick]
  );

  const activeDescendant = open && activeIndex >= 0 ? getOptionId(activeIndex) : undefined;

  return (
    <div className={cn('relative', className)}>
      <Input
        id={id}
        name={name}
        type="text"
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={activeDescendant}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        value={value}
        placeholder={placeholder ?? t('SearchPlaceholder')}
        disabled={disabled}
        required={required}
        onChange={(event) => onInputChange(event.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Defer so a pointer-down on an option still registers as a pick.
          globalThis.setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={onKeyDown}
      />

      {(isLoading || isFetching) && enhanced ? (
        <Spinner
          size="sm"
          aria-hidden
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
      ) : null}

      {showList ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {isError ? (
            <li role="alert" className="px-3 py-2 text-sm text-destructive">
              {t('Error')}
            </li>
          ) : null}

          {!isError && suggestions.length === 0 && !isLoading && !isFetching ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">{t('NoResults')}</li>
          ) : null}

          {suggestions.map((suggestion, index) => (
            <li
              key={`${suggestion.label}-${index}`}
              id={getOptionId(index)}
              role="option"
              aria-selected={index === activeIndex}
              className={cn(
                'cursor-pointer rounded-sm px-3 py-2 text-sm',
                index === activeIndex ? 'bg-accent text-accent-foreground' : 'text-foreground'
              )}
              onMouseEnter={() => setActiveIndex(index)}
              // `onMouseDown` (not `onClick`) so the pick beats the input's blur.
              onMouseDown={(event) => {
                event.preventDefault();
                pick(suggestion);
              }}
            >
              {suggestion.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
