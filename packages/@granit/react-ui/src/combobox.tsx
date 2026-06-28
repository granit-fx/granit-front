'use client';

import { cn } from '@granit/utils';
import { CheckIcon, ChevronsUpDownIcon, XIcon } from 'lucide-react';
import * as React from 'react';

import { Button } from './button.js';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './command.js';
import { Popover, PopoverContent, PopoverTrigger } from './popover.js';

export interface ComboboxOption {
  readonly value: string;
  readonly label?: string;
}

interface ComboboxBaseProps {
  readonly options: readonly ComboboxOption[];
  readonly placeholder?: string;
  readonly searchPlaceholder?: string;
  readonly emptyText?: string;
  /** Let the typed search term be committed as a value not present in {@link options}. */
  readonly allowCustomValue?: boolean;
  readonly disabled?: boolean;
  /**
   * Marks the control as required: when it currently holds no value the trigger
   * gets `aria-invalid` + a destructive border, signalling the field must be
   * filled. Purely presentational — enforcement (blocking save) is the host's.
   */
  readonly required?: boolean;
  readonly className?: string;
  readonly id?: string;
  /** `data-slot` placed on the trigger button (test / styling hook). */
  readonly slot?: string;
}

export interface ComboboxProps extends ComboboxBaseProps {
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  /** Render a "— none —" item that commits the empty string. */
  readonly allowEmpty?: boolean;
}

function optionLabel(options: readonly ComboboxOption[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

/**
 * Single-select combobox (shadcn pattern: Popover + Command). Searchable, and —
 * with {@link ComboboxProps.allowCustomValue} — accepts a typed value outside
 * the option list, so it doubles as a free-text-with-suggestions input.
 */
export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyText = 'No results.',
  allowCustomValue = false,
  allowEmpty = false,
  disabled = false,
  required = false,
  className,
  id,
  slot,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const invalid = required && !value;

  const commit = (next: string) => {
    onValueChange(next);
    setOpen(false);
    setSearch('');
  };

  const trimmed = search.trim();
  const showCustom =
    allowCustomValue && trimmed.length > 0 && !options.some((option) => option.value === trimmed);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          id={id}
          data-slot={slot}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground',
            invalid && 'border-destructive',
            className
          )}
        >
          <span className="truncate">{value ? optionLabel(options, value) : placeholder}</span>
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {allowEmpty && (
                <CommandItem value="__none__" onSelect={() => commit('')}>
                  <CheckIcon
                    className={cn('mr-2 size-4', value === '' ? 'opacity-100' : 'opacity-0')}
                  />
                  <span className="text-muted-foreground">— none —</span>
                </CommandItem>
              )}
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label ?? option.value}
                  onSelect={() => commit(option.value)}
                >
                  <CheckIcon
                    className={cn(
                      'mr-2 size-4',
                      value === option.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {option.label ?? option.value}
                </CommandItem>
              ))}
              {showCustom && (
                <CommandItem value={trimmed} onSelect={() => commit(trimmed)}>
                  <CheckIcon className="mr-2 size-4 opacity-0" />
                  Use “{trimmed}”
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export interface ComboboxMultiProps extends ComboboxBaseProps {
  readonly values: readonly string[];
  readonly onValuesChange: (values: string[]) => void;
}

/**
 * Multi-select combobox. Toggles options on/off (checkmarks), shows the current
 * selection as a comma-joined summary on the trigger, and — with
 * {@link ComboboxBaseProps.allowCustomValue} — adds typed values not in the list.
 */
export function ComboboxMulti({
  options,
  values,
  onValuesChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyText = 'No results.',
  allowCustomValue = false,
  disabled = false,
  required = false,
  className,
  id,
  slot,
}: ComboboxMultiProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const invalid = required && values.length === 0;

  const toggle = (next: string) => {
    onValuesChange(
      values.includes(next) ? values.filter((value) => value !== next) : [...values, next]
    );
    setSearch('');
  };

  const trimmed = search.trim();
  const showCustom =
    allowCustomValue && trimmed.length > 0 && !options.some((option) => option.value === trimmed);

  const summary = values.map((value) => optionLabel(options, value)).join(', ');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          id={id}
          data-slot={slot}
          className={cn(
            'w-full justify-between font-normal',
            values.length === 0 && 'text-muted-foreground',
            invalid && 'border-destructive',
            className
          )}
        >
          <span className="truncate">{values.length > 0 ? summary : placeholder}</span>
          {values.length > 0 ? (
            <XIcon
              className="ml-2 size-4 shrink-0 opacity-50 hover:opacity-100"
              role="button"
              aria-label="Clear"
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onValuesChange([]);
              }}
            />
          ) : (
            <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label ?? option.value}
                  onSelect={() => toggle(option.value)}
                >
                  <CheckIcon
                    className={cn(
                      'mr-2 size-4',
                      values.includes(option.value) ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {option.label ?? option.value}
                </CommandItem>
              ))}
              {showCustom && (
                <CommandItem value={trimmed} onSelect={() => toggle(trimmed)}>
                  <CheckIcon className="mr-2 size-4 opacity-0" />
                  Add “{trimmed}”
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
