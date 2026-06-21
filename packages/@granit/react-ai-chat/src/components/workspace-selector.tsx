import { cn } from '@granit/utils';
import { ChevronDown, Search } from 'lucide-react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import type { WorkspaceOption } from './composer-types';
import type { KeyboardEvent, ReactNode } from 'react';

/** Below this option count the search field is hidden — the list is short enough. */
const SEARCH_THRESHOLD = 5;

/**
 * Render an option's trailing capability glyphs. The glyphs are opaque,
 * host-supplied nodes with no identity of their own, so each is keyed by its
 * position via a local counter rather than the map index.
 */
function renderCapabilities(option: WorkspaceOption): ReactNode {
  if (!option.capabilities || option.capabilities.length === 0) return null;
  let slot = 0;
  return (
    <span
      data-slot="workspace-capabilities"
      className="text-muted-foreground flex shrink-0 items-center gap-1.5"
    >
      {option.capabilities.map((cap) => (
        <span key={`${option.value}-cap-${slot++}`} className="inline-flex">
          {cap}
        </span>
      ))}
    </span>
  );
}

export interface WorkspaceSelectorProps {
  /** Options to choose from (already brand-decorated by the host). */
  readonly options: readonly WorkspaceOption[];
  /** Currently selected value; defaults to the first option. */
  readonly value?: string;
  readonly onChange: (value: string) => void;
  /** Accessible name for the trigger and listbox (e.g. "Workspace"). */
  readonly label: string;
  /** Placeholder for the search field (shown only for long lists). */
  readonly searchPlaceholder?: string;
  /** Shown when a search yields nothing. */
  readonly emptyLabel: string;
  /** Leading glyph used when the selected option has no `icon` of its own. */
  readonly fallbackIcon?: ReactNode;
  readonly disabled?: boolean;
  readonly className?: string;
}

/**
 * The workspace/model picker: a discreet chip trigger that opens a popover
 * listbox of options, each with an optional leading mark and trailing
 * capability glyphs, grouped by provider and optionally searchable. Headless of
 * any brand — every glyph is supplied by the host via {@link WorkspaceOption}.
 */
export function WorkspaceSelector({
  options,
  value,
  onChange,
  label,
  searchPlaceholder,
  emptyLabel,
  fallbackIcon,
  disabled = false,
  className,
}: Readonly<WorkspaceSelectorProps>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const baseId = useId();
  const listboxId = `${baseId}-ws-listbox`;
  const getOptionId = useCallback((index: number) => `${baseId}-ws-opt-${index}`, [baseId]);

  const selected = useMemo(
    () => options.find((o) => o.value === value) ?? options[0],
    [options, value]
  );

  const filtered = useMemo<readonly WorkspaceOption[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => (o.label ?? o.value).toLowerCase().includes(q));
  }, [options, query]);

  const showSearch = options.length > SEARCH_THRESHOLD;

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  const commit = useCallback(
    (option: WorkspaceOption | undefined) => {
      if (!option || option.disabled) return;
      onChange(option.value);
      close();
    },
    [onChange, close]
  );

  // Move the active highlight, skipping disabled rows.
  const moveActive = useCallback(
    (delta: number) => {
      const count = filtered.length;
      if (count === 0) return;
      setActiveIndex((current) => {
        // Walk the candidate indices in `delta` order (wrapping) and stop at the
        // first selectable row; fall back to the current row if all are disabled.
        const next = Array.from(
          { length: count },
          (_, step) => (((current + delta * (step + 1)) % count) + count) % count
        ).find((index) => !filtered[index]?.disabled);
        return next ?? current;
      });
    },
    [filtered]
  );

  // Reset the highlight to the first selectable row whenever the list changes.
  useEffect(() => {
    if (!open) return;
    const firstEnabled = filtered.findIndex((o) => !o.disabled);
    setActiveIndex(firstEnabled === -1 ? 0 : firstEnabled);
  }, [open, filtered]);

  // Focus the search field (or the listbox itself) on open so keyboard nav works.
  useEffect(() => {
    if (!open) return;
    if (showSearch) searchRef.current?.focus();
    else listboxRef.current?.focus();
  }, [open, showSearch]);

  // Close on outside pointer or focus loss.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target instanceof Node ? event.target : null;
      if (!containerRef.current?.contains(target)) close();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, close]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        moveActive(1);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        moveActive(-1);
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        commit(filtered[activeIndex]);
      }
    },
    [close, moveActive, commit, filtered, activeIndex]
  );

  const selectedLabel = selected ? (selected.label ?? selected.value) : label;

  // Render the filtered list with a provider heading inserted whenever the
  // group changes. Indices stay aligned with `filtered` for keyboard nav.
  let lastGroup: string | undefined;
  const rows: ReactNode[] = filtered.map((option, index) => {
    const heading = option.group && option.group !== lastGroup ? option.group : null;
    lastGroup = option.group;
    const isActive = index === activeIndex;
    return (
      <li key={option.value} role="presentation">
        {heading ? (
          <p
            data-slot="workspace-group"
            className="text-muted-foreground px-2 pt-2 pb-1 text-xs font-medium"
          >
            {heading}
          </p>
        ) : null}
        <div
          id={getOptionId(index)}
          role="option"
          // Arrow-key navigation is handled at the popover level (it owns the
          // active highlight), so each option is only programmatically focusable
          // (-1) — never in the tab order.
          tabIndex={-1}
          aria-selected={option.value === selected?.value}
          aria-disabled={option.disabled}
          data-slot="workspace-option"
          data-disabled={option.disabled}
          onMouseEnter={() => {
            if (!option.disabled) setActiveIndex(index);
          }}
          onMouseDown={(event) => {
            event.preventDefault();
            commit(option);
          }}
          className={cn(
            'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm',
            option.disabled
              ? 'text-muted-foreground cursor-not-allowed opacity-60'
              : 'cursor-pointer',
            isActive && !option.disabled ? 'bg-accent text-accent-foreground' : ''
          )}
        >
          <span className="flex size-4 shrink-0 items-center justify-center">{option.icon}</span>
          <span className="flex-1 truncate">{option.label ?? option.value}</span>
          {renderCapabilities(option)}
        </div>
      </li>
    );
  });

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        data-slot="composer-workspace"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="text-muted-foreground hover:bg-accent hover:text-foreground inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors disabled:opacity-50"
      >
        <span className="flex size-3.5 shrink-0 items-center justify-center">
          {selected?.icon ?? fallbackIcon}
        </span>
        <span className="max-w-40 truncate">{selectedLabel}</span>
        <ChevronDown className="size-3.5 shrink-0" aria-hidden />
      </button>

      {open ? (
        <div
          data-slot="workspace-popover"
          className="border-border bg-popover absolute bottom-full z-20 mb-1 min-w-64 overflow-hidden rounded-xl border shadow-md outline-none"
        >
          {showSearch ? (
            <div className="border-border flex items-center gap-2 border-b px-2.5 py-2">
              <Search className="text-muted-foreground size-4 shrink-0" aria-hidden />
              <input
                ref={searchRef}
                type="text"
                value={query}
                aria-label={searchPlaceholder ?? label}
                placeholder={searchPlaceholder}
                onChange={(event) => {
                  setQuery(event.target.value);
                }}
                onKeyDown={handleKeyDown}
                className="placeholder:text-muted-foreground w-full bg-transparent text-sm outline-none"
              />
            </div>
          ) : null}

          {filtered.length === 0 ? (
            <p data-slot="workspace-empty" className="text-muted-foreground px-2 py-2 text-sm">
              {emptyLabel}
            </p>
          ) : (
            <ul
              ref={listboxRef}
              role="listbox"
              id={listboxId}
              aria-label={label}
              // Focusable so arrow-key nav works when no search field is shown;
              // the listbox owns the keyboard interaction (not the wrapper div).
              tabIndex={-1}
              onKeyDown={handleKeyDown}
              className="max-h-72 overflow-auto p-1 outline-none"
            >
              {rows}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
