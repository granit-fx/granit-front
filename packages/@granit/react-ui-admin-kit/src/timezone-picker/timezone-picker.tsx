import { useTimezone, useTranslation } from '@granit/react-localization';
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@granit/react-ui';
import { cn } from '@granit/utils';
import { Check, ChevronsUpDown, Globe, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface TimezonePickerProps {
  readonly value: string | null;
  readonly onChange: (value: string | null) => void;
  readonly placeholder?: string;
  readonly searchPlaceholder?: string;
  readonly emptyText?: string;
  readonly clearLabel?: string;
  readonly clearable?: boolean;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly id?: string;
  readonly name?: string;
  readonly ariaLabel?: string;
}

interface TimezoneOption {
  readonly id: string;
  readonly region: string;
  readonly city: string;
  readonly offsetMinutes: number;
  readonly offsetLabel: string;
  readonly searchTokens: string;
}

const SAFE_FALLBACK_TIMEZONES = [
  'UTC',
  'Europe/Brussels',
  'Europe/Paris',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Australia/Sydney',
] as const;

function listSupportedTimezones(): readonly string[] {
  if (typeof Intl.supportedValuesOf === 'function') {
    try {
      return Intl.supportedValuesOf('timeZone');
    } catch {
      return SAFE_FALLBACK_TIMEZONES;
    }
  }
  return SAFE_FALLBACK_TIMEZONES;
}

function computeOffsetMinutes(timeZone: string, reference: Date): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longOffset',
    }).formatToParts(reference);
    const tzPart = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+00:00';
    const match = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(tzPart);
    if (!match) return 0;
    const sign = match[1] === '-' ? -1 : 1;
    const hours = Number.parseInt(match[2] ?? '0', 10);
    const minutes = Number.parseInt(match[3] ?? '0', 10);
    return sign * (hours * 60 + minutes);
  } catch {
    return 0;
  }
}

function formatOffsetLabel(minutes: number): string {
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  const hours = Math.floor(abs / 60)
    .toString()
    .padStart(2, '0');
  const remainder = (abs % 60).toString().padStart(2, '0');
  return `GMT${sign}${hours}:${remainder}`;
}

function buildOptions(): readonly TimezoneOption[] {
  const ids = listSupportedTimezones();
  const reference = new Date();
  return ids
    .map<TimezoneOption>((id) => {
      const [first, ...rest] = id.split('/');
      const region = first ?? id;
      const cityRaw = rest.join('/') || region;
      const city = cityRaw.replaceAll('_', ' ');
      const offsetMinutes = computeOffsetMinutes(id, reference);
      return {
        id,
        region,
        city,
        offsetMinutes,
        offsetLabel: formatOffsetLabel(offsetMinutes),
        searchTokens: `${id} ${city} ${region}`.toLowerCase(),
      };
    })
    .sort((a, b) => {
      if (a.region !== b.region) return a.region.localeCompare(b.region);
      return a.city.localeCompare(b.city);
    });
}

export function TimezonePicker({
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  clearLabel,
  clearable = true,
  disabled,
  className,
  id,
  name,
  ariaLabel,
}: TimezonePickerProps) {
  const { t } = useTranslation();
  const userTimezone = useTimezone();
  const [open, setOpen] = useState(false);

  // Default to the user's timezone on first mount when no value is provided.
  // `useTimezone` resolves the user's preferred zone (browser fallback, never
  // throws), so this stays safe outside a TimezoneProvider. One-shot: a later
  // explicit clear (when `clearable`) is respected and not re-defaulted.
  const didApplyDefault = useRef(false);
  useEffect(() => {
    if (didApplyDefault.current) return;
    if ((value == null || value === '') && userTimezone) {
      didApplyDefault.current = true;
      onChange(userTimezone);
    }
  }, [value, userTimezone, onChange]);

  const options = useMemo(() => buildOptions(), []);
  const groups = useMemo(() => {
    const map = new Map<string, TimezoneOption[]>();
    for (const option of options) {
      const list = map.get(option.region);
      if (list) list.push(option);
      else map.set(option.region, [option]);
    }
    return Array.from(map.entries());
  }, [options]);

  const selected = useMemo(() => options.find((option) => option.id === value), [options, value]);

  const triggerLabel =
    selected == null
      ? (placeholder ?? t('Common.Timezone.Placeholder', 'Select a timezone…'))
      : `${selected.offsetLabel} · ${selected.city}`;

  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    onChange(null);
  };

  const handleClearKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.stopPropagation();
      event.preventDefault();
      onChange(null);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel ?? t('Common.Timezone.AriaLabel', 'Select a timezone')}
          id={id}
          name={name}
          disabled={disabled}
          data-slot="timezone-picker-trigger"
          className={cn(
            'w-full justify-between font-normal',
            !selected && 'text-muted-foreground',
            className
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <Globe className="size-4 shrink-0 opacity-60" aria-hidden />
            <span className="truncate">{triggerLabel}</span>
          </span>
          <span className="ml-2 flex shrink-0 items-center gap-1">
            {clearable && selected ? (
              <span
                role="button"
                tabIndex={-1}
                aria-label={clearLabel ?? t('Common.Timezone.Clear', 'Clear timezone')}
                onClick={handleClear}
                onKeyDown={handleClearKeyDown}
                onPointerDown={(e) => e.stopPropagation()}
                className="rounded-sm p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" aria-hidden />
              </span>
            ) : null}
            <ChevronsUpDown className="size-4 opacity-50" aria-hidden />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0"
        data-slot="timezone-picker-content"
      >
        <Command
          filter={(itemValue, search) => {
            const needle = search.toLowerCase();
            return itemValue.toLowerCase().includes(needle) ? 1 : 0;
          }}
        >
          <CommandInput
            placeholder={searchPlaceholder ?? t('Common.Timezone.Search', 'Search timezone…')}
          />
          <CommandList className="max-h-72">
            <CommandEmpty>
              {emptyText ?? t('Common.Timezone.Empty', 'No timezone found.')}
            </CommandEmpty>
            {groups.map(([region, items]) => (
              <CommandGroup key={region} heading={region}>
                {items.map((option) => {
                  const isSelected = option.id === value;
                  return (
                    <CommandItem
                      key={option.id}
                      value={option.searchTokens}
                      onSelect={() => {
                        onChange(option.id);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn('mr-2 size-4', isSelected ? 'opacity-100' : 'opacity-0')}
                        aria-hidden
                      />
                      <span className="flex-1 truncate">{option.city}</span>
                      <span className="ml-2 shrink-0 text-xs tabular-nums text-muted-foreground">
                        {option.offsetLabel}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
