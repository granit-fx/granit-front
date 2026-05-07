import { useId, useMemo, useState } from 'react';

import { useCreateTag } from '../hooks/use-tag-mutations.js';
import { useTags } from '../hooks/use-tags.js';

import { TagChip } from './tag-chip.tsx';

import type { CreateTagRequest, HexColor, TagResponse } from '@granit/taxonomy';
import type { KeyboardEvent, ReactNode } from 'react';

const DEFAULT_COLOR: HexColor = '#94a3b8';

export interface TagAutocompleteLabels {
  readonly placeholder?: string;
  readonly empty?: string;
  readonly create?: string;
  readonly remove?: string;
}

export interface TagAutocompleteProps {
  readonly scope: string;
  /** Currently selected tag ids (controlled). */
  readonly value: readonly string[];
  readonly onAdd: (tag: TagResponse) => void;
  readonly onRemove: (tag: TagResponse) => void;
  /** Inline-create-on-Enter is gated by the `Taxonomy.Tags.Manage` permission. */
  readonly canManage?: boolean;
  /** Default `true` — set to `false` to disable inline creation entirely. */
  readonly allowInlineCreate?: boolean;
  /** Default color assigned to inline-created tags (host can override). */
  readonly defaultCreateColor?: HexColor;
  readonly labels?: TagAutocompleteLabels;
  readonly className?: string;
}

const DEFAULT_LABELS: Required<TagAutocompleteLabels> = {
  placeholder: 'Add tag…',
  empty: 'No matching tags',
  create: 'Create',
  remove: 'Remove',
};

/**
 * Headless tag autocomplete. Shows the selected chips inline, debounces
 * server lookups via `useTags` (host should debounce `value` upstream if
 * needed — this component does not own a timer), and supports
 * inline-create on Enter when the user has Manage permission and the typed
 * value matches no existing tag.
 *
 * Keyboard:
 * - ↑ / ↓ — move highlight
 * - Enter — pick highlighted suggestion, or inline-create if none
 * - Escape — close suggestions
 * - Backspace on empty input — remove the last selected chip
 */
export function TagAutocomplete({
  scope,
  value,
  onAdd,
  onRemove,
  canManage = false,
  allowInlineCreate = true,
  defaultCreateColor = DEFAULT_COLOR,
  labels,
  className,
}: TagAutocompleteProps): ReactNode {
  const labelStrings = { ...DEFAULT_LABELS, ...labels };
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const [open, setOpen] = useState(false);
  const inputId = useId();

  const tagsQuery = useTags({ scope, q: query });
  const createTag = useCreateTag(scope);

  const candidates = useMemo(() => {
    const list = tagsQuery.data ?? [];
    const selectedSet = new Set(value);
    return list.filter((tag) => !selectedSet.has(tag.id));
  }, [tagsQuery.data, value]);

  const selected = useMemo(() => {
    const list = tagsQuery.data ?? [];
    const byId = new Map(list.map((tag) => [tag.id, tag]));
    return value.flatMap((id) => {
      const tag = byId.get(id);
      return tag ? [tag] : [];
    });
  }, [tagsQuery.data, value]);

  const trimmed = query.trim();
  const exactMatch = candidates.find((tag) => tag.name.toLowerCase() === trimmed.toLowerCase());
  const showCreate = allowInlineCreate && canManage && trimmed.length > 0 && !exactMatch;

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, Math.max(candidates.length - 1, 0)));
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
    if (event.key === 'Backspace' && query.length === 0 && selected.length > 0) {
      const last = selected[selected.length - 1];
      if (last) onRemove(last);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const picked = candidates[highlight];
      if (picked) {
        onAdd(picked);
        setQuery('');
        setHighlight(0);
        return;
      }
      if (showCreate) {
        const request: CreateTagRequest = {
          scope,
          name: trimmed,
          color: defaultCreateColor,
          hideOnEntityCard: false,
        };
        createTag.mutate(request, {
          onSuccess: (tag) => {
            onAdd(tag);
            setQuery('');
            setHighlight(0);
          },
        });
      }
    }
  }

  return (
    <div data-granit-tag-autocomplete="" className={className}>
      <div data-granit-tag-autocomplete-selected="">
        {selected.map((tag) => (
          <TagChip key={tag.id} tag={tag} onRemove={onRemove} removeLabel={labelStrings.remove} />
        ))}
        <input
          id={inputId}
          data-granit-tag-autocomplete-input=""
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={`${inputId}-list`}
          placeholder={labelStrings.placeholder}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setHighlight(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
        />
      </div>
      {open && (
        <ul id={`${inputId}-list`} role="listbox" data-granit-tag-autocomplete-list="">
          {candidates.map((tag, index) => (
            <li
              key={tag.id}
              role="option"
              aria-selected={index === highlight}
              data-granit-tag-autocomplete-option=""
              data-granit-tag-autocomplete-highlighted={index === highlight ? '' : undefined}
              onMouseDown={(event) => {
                event.preventDefault();
                onAdd(tag);
                setQuery('');
                setHighlight(0);
              }}
            >
              <TagChip tag={tag} />
            </li>
          ))}
          {candidates.length === 0 && !showCreate && (
            <li data-granit-tag-autocomplete-empty="" role="presentation">
              {labelStrings.empty}
            </li>
          )}
          {showCreate && (
            <li
              role="option"
              aria-selected={false}
              data-granit-tag-autocomplete-create=""
              onMouseDown={(event) => {
                event.preventDefault();
                const request: CreateTagRequest = {
                  scope,
                  name: trimmed,
                  color: defaultCreateColor,
                  hideOnEntityCard: false,
                };
                createTag.mutate(request, {
                  onSuccess: (tag) => {
                    onAdd(tag);
                    setQuery('');
                    setHighlight(0);
                  },
                });
              }}
            >
              {labelStrings.create} “{trimmed}”
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
