import { cn } from '@granit/utils';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { defaultPromptLabels } from '../locales/index';

import { PromptIcon } from './prompt-icon';

import type { PromptTranslations } from '../locales/index';
import type { PromptPickerCategoryResponse, PromptPickerItemResponse } from '@granit/ai-prompts';
import type { KeyboardEvent } from 'react';

export interface PromptPickerProps {
  readonly categories: readonly PromptPickerCategoryResponse[];
  readonly onSelect: (item: PromptPickerItemResponse) => void;
  readonly autoFocus?: boolean;
  readonly labels?: PromptTranslations['Picker'];
  readonly className?: string;
}

/**
 * A standalone, searchable `/` prompt picker grouped by category. The search
 * box is an ARIA `combobox`; arrow keys move a single active index across the
 * flattened result, Enter selects. (Inside the chat composer, the inline picker
 * in `@granit/react-ai-chat` is used instead.)
 */
export function PromptPicker({
  categories,
  onSelect,
  autoFocus = false,
  labels = defaultPromptLabels.Picker,
  className,
}: Readonly<PromptPickerProps>) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories
      .map((category) => ({
        category,
        prompts: q
          ? category.prompts.filter(
              (p) =>
                p.name.toLowerCase().includes(q) || p.shortDescription.toLowerCase().includes(q)
            )
          : category.prompts,
      }))
      .filter((group) => group.prompts.length > 0);
  }, [categories, query]);

  const flat = useMemo(() => filtered.flatMap((group) => group.prompts), [filtered]);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (flat.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % flat.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => (i - 1 + flat.length) % flat.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item = flat[activeIndex];
      if (item) onSelect(item);
    }
  };

  let runningIndex = -1;

  return (
    <div
      data-slot="prompt-picker"
      className={cn('border-border bg-popover w-full rounded-md border', className)}
    >
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded
        aria-controls={listboxId}
        aria-label={labels.Title}
        value={query}
        placeholder={labels.Title}
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(0);
        }}
        onKeyDown={onKeyDown}
        className="border-border w-full border-b px-2.5 py-2 text-sm outline-none"
      />

      {flat.length === 0 ? (
        <p data-slot="picker-empty" className="text-muted-foreground px-2.5 py-2 text-sm">
          {labels.NoResults}
        </p>
      ) : (
        <ul
          role="listbox"
          id={listboxId}
          aria-label={labels.Title}
          className="max-h-72 overflow-auto py-1"
        >
          {filtered.map((group) => (
            <li
              key={group.category.categoryId ?? group.category.categoryName}
              role="group"
              aria-label={group.category.categoryName}
            >
              <p className="text-muted-foreground px-2.5 pt-2 pb-1 text-xs font-medium">
                {group.category.categoryName}
              </p>
              <ul>
                {group.prompts.map((item) => {
                  runningIndex++;
                  const index = runningIndex;
                  return (
                    <li
                      key={item.id}
                      role="option"
                      aria-selected={index === activeIndex}
                      data-slot="picker-item"
                      onMouseEnter={() => {
                        setActiveIndex(index);
                      }}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        onSelect(item);
                      }}
                      className={cn(
                        'flex cursor-pointer items-center gap-2 px-2.5 py-1.5 text-sm',
                        index === activeIndex ? 'bg-accent text-accent-foreground' : ''
                      )}
                    >
                      <PromptIcon
                        icon={item.icon}
                        iconColor={item.iconColor}
                        className="size-4 shrink-0"
                      />
                      <span className="flex-1 truncate">{item.name}</span>
                      {item.isSystem ? (
                        <span className="text-muted-foreground text-[10px]">{labels.System}</span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
