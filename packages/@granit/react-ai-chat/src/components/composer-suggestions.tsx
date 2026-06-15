import { cn } from '@granit/utils';

import type { ReactNode } from 'react';

export interface ComposerSuggestionsProps<T> {
  readonly title: string;
  readonly items: readonly T[];
  /** Index of the keyboard-highlighted item (owned by the composer). */
  readonly activeIndex: number;
  readonly getKey: (item: T, index: number) => string;
  readonly renderItem: (item: T) => ReactNode;
  readonly onSelect: (item: T) => void;
  readonly onHover: (index: number) => void;
  readonly emptyLabel: string;
  readonly loading?: boolean;
  readonly loadingLabel: string;
  /** `id` of the listbox, referenced by the textarea's `aria-controls`. */
  readonly listboxId: string;
  readonly getOptionId: (index: number) => string;
  readonly className?: string;
}

/**
 * Controlled listbox of `/` or `@` suggestions. Keyboard navigation and the
 * active index are owned by the composer (the textarea keeps focus); this
 * component only renders the ARIA `listbox`/`option` structure and forwards
 * pointer selection.
 */
export function ComposerSuggestions<T>({
  title,
  items,
  activeIndex,
  getKey,
  renderItem,
  onSelect,
  onHover,
  emptyLabel,
  loading = false,
  loadingLabel,
  listboxId,
  getOptionId,
  className,
}: Readonly<ComposerSuggestionsProps<T>>) {
  return (
    <div
      data-slot="composer-suggestions"
      className={cn(
        'border-border bg-popover absolute bottom-full z-10 mb-1 max-h-60 w-full overflow-auto rounded-md border shadow-md',
        className
      )}
    >
      <p className="text-muted-foreground px-2 pt-2 pb-1 text-xs font-medium">{title}</p>
      {loading ? (
        <p data-slot="suggestions-loading" className="text-muted-foreground px-2 py-2 text-sm">
          {loadingLabel}
        </p>
      ) : items.length === 0 ? (
        <p data-slot="suggestions-empty" className="text-muted-foreground px-2 py-2 text-sm">
          {emptyLabel}
        </p>
      ) : (
        <ul role="listbox" id={listboxId} aria-label={title}>
          {items.map((item, index) => (
            <li
              key={getKey(item, index)}
              id={getOptionId(index)}
              role="option"
              aria-selected={index === activeIndex}
              onMouseEnter={() => {
                onHover(index);
              }}
              onMouseDown={(event) => {
                // Keep textarea focus; select on mousedown before blur.
                event.preventDefault();
                onSelect(item);
              }}
              className={cn(
                'cursor-pointer px-2 py-1.5 text-sm',
                index === activeIndex ? 'bg-accent text-accent-foreground' : ''
              )}
            >
              {renderItem(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
