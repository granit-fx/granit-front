import { useTranslation } from '@granit/react-localization';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@granit/react-ui';
import { cn } from '@granit/utils';
import {
  type CountryCode,
  AsYouType,
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
} from 'libphonenumber-js/min';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';

import { type Continent, CONTINENT_ORDER, COUNTRY_TO_CONTINENT } from './phone-input.continents';

interface PhoneInputProps {
  readonly value: string | null;
  readonly onChange: (value: string | null) => void;
  readonly defaultCountry?: CountryCode;
  readonly countries?: readonly CountryCode[];
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly id?: string;
  readonly name?: string;
  readonly className?: string;
  readonly searchPlaceholder?: string;
  readonly emptyText?: string;
  readonly ariaLabelCountry?: string;
}

interface CountryOption {
  readonly code: CountryCode;
  readonly name: string;
  readonly callingCode: string;
  readonly continent: Continent | 'Other';
  readonly searchTokens: string;
}

function FlagIcon({ code, className }: Readonly<{ code: CountryCode; className?: string }>) {
  return (
    <span
      aria-hidden
      className={cn(
        'fi inline-block h-3 w-4 rounded-[1px] bg-cover bg-center bg-no-repeat ring-1 ring-black/5',
        `fi-${code.toLowerCase()}`,
        className
      )}
    />
  );
}

function buildCountryOptions(
  locale: string,
  filter?: readonly CountryCode[]
): readonly CountryOption[] {
  const all = filter ?? getCountries();
  const displayNames = (() => {
    try {
      return new Intl.DisplayNames([locale, 'en'], { type: 'region' });
    } catch {
      return null;
    }
  })();
  return all
    .map<CountryOption>((code) => {
      const name = displayNames?.of(code) ?? code;
      const callingCode = `+${getCountryCallingCode(code)}`;
      const continent = COUNTRY_TO_CONTINENT[code] ?? 'Other';
      return {
        code,
        name,
        callingCode,
        continent,
        searchTokens: `${name} ${code} ${callingCode}`.toLowerCase(),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function groupByContinent(options: readonly CountryOption[]): readonly {
  readonly continent: Continent | 'Other';
  readonly items: readonly CountryOption[];
}[] {
  const buckets = new Map<Continent | 'Other', CountryOption[]>();
  for (const option of options) {
    const bucket = buckets.get(option.continent);
    if (bucket) bucket.push(option);
    else buckets.set(option.continent, [option]);
  }
  const ordered: { continent: Continent | 'Other'; items: CountryOption[] }[] = [];
  for (const continent of CONTINENT_ORDER) {
    const items = buckets.get(continent);
    if (items) ordered.push({ continent, items });
  }
  const others = buckets.get('Other');
  if (others) ordered.push({ continent: 'Other', items: others });
  return ordered;
}

interface ParsedValue {
  readonly country: CountryCode;
  readonly national: string;
}

function parseE164(value: string | null, fallback: CountryCode): ParsedValue | null {
  if (!value) return null;
  const parsed = parsePhoneNumberFromString(value);
  if (parsed?.country) {
    return { country: parsed.country, national: parsed.formatNational() };
  }
  // Couldn't infer country — keep raw, treat as national under fallback
  return { country: fallback, national: value };
}

function formatNational(input: string, country: CountryCode): string {
  const formatter = new AsYouType(country);
  formatter.input(input);
  return formatter.getNumber()?.formatNational() ?? input;
}

export function PhoneInput({
  value,
  onChange,
  defaultCountry = 'BE',
  countries,
  placeholder,
  disabled,
  id,
  name,
  className,
  searchPlaceholder,
  emptyText,
  ariaLabelCountry,
}: PhoneInputProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language ?? 'en';

  const options = useMemo(() => buildCountryOptions(locale, countries), [locale, countries]);
  const groups = useMemo(() => groupByContinent(options), [options]);

  const [state, setState] = useState(() => {
    const parsed = parseE164(value, defaultCountry);
    return {
      country: parsed?.country ?? defaultCountry,
      national: parsed?.national ?? '',
      syncedValue: value,
    };
  });
  const [open, setOpen] = useState(false);

  // Reconcile internal state with external value changes (e.g., form reset).
  // Setting state during render is React's recommended sync-from-props pattern;
  // syncedValue is updated on every emit too, so this branch only fires for
  // truly external mutations.
  if (value !== state.syncedValue) {
    const parsed = parseE164(value, defaultCountry);
    setState({
      country: parsed?.country ?? defaultCountry,
      national: parsed?.national ?? '',
      syncedValue: value,
    });
  }
  const { country, national } = state;

  const emit = (nextCountry: CountryCode, nextNational: string) => {
    const trimmed = nextNational.trim();
    if (!trimmed) {
      setState((s) => ({ ...s, syncedValue: null }));
      onChange(null);
      return;
    }
    const parsed = parsePhoneNumberFromString(trimmed, nextCountry);
    const next =
      parsed?.number ?? `+${getCountryCallingCode(nextCountry)}${trimmed.replaceAll(/\D/g, '')}`;
    setState((s) => ({ ...s, syncedValue: next }));
    onChange(next);
  };

  const handleCountrySelect = (code: CountryCode) => {
    setOpen(false);
    const trimmed = national.trim();
    const reformatted = trimmed ? formatNational(national, code) : national;
    setState((s) => ({ ...s, country: code, national: reformatted }));
    if (trimmed) emit(code, reformatted);
  };

  const handleNationalChange = (raw: string) => {
    const formatted = formatNational(raw, country);
    setState((s) => ({ ...s, national: formatted }));
    emit(country, formatted);
  };

  const selected = options.find((o) => o.code === country);

  return (
    <div data-slot="phone-input" className={cn('flex w-full', disabled && 'opacity-60', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox" // NOSONAR(jsx-a11y/prefer-tag-over-role): custom typeahead combobox — native <input list>/<select> cannot model the rich country selector
            aria-expanded={open}
            aria-controls="phone-input-country-list"
            aria-label={ariaLabelCountry ?? t('Common.Phone.Country', 'Select country')}
            disabled={disabled}
            data-slot="phone-input-country"
            className={cn(
              'flex h-9 shrink-0 items-center gap-1.5 rounded-l-md border border-r-0 border-input bg-transparent px-3 text-sm shadow-xs transition outline-none',
              'hover:bg-accent hover:text-accent-foreground',
              'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50',
              'disabled:cursor-not-allowed'
            )}
          >
            {selected ? <FlagIcon code={selected.code} /> : null}
            <span className="tabular-nums text-muted-foreground">
              {selected?.callingCode ?? ''}
            </span>
            <ChevronsUpDown className="size-3.5 opacity-50" aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent
          id="phone-input-country-list"
          align="start"
          className="w-[280px] p-0"
          data-slot="phone-input-country-list"
        >
          <Command
            filter={(itemValue, search) =>
              itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
            }
          >
            <CommandInput
              placeholder={searchPlaceholder ?? t('Common.Phone.Search', 'Search country…')}
            />
            <CommandList className="max-h-72">
              <CommandEmpty>
                {emptyText ?? t('Common.Phone.Empty', 'No country found.')}
              </CommandEmpty>
              {groups.map(({ continent, items }) => (
                <CommandGroup
                  key={continent}
                  heading={t(`Common.Continent.${continent}`, continent)}
                >
                  {items.map((option) => {
                    const isSelected = option.code === country;
                    return (
                      <CommandItem
                        key={option.code}
                        value={option.searchTokens}
                        onSelect={() => handleCountrySelect(option.code)}
                      >
                        <Check
                          className={cn('mr-2 size-4', isSelected ? 'opacity-100' : 'opacity-0')}
                          aria-hidden
                        />
                        <FlagIcon code={option.code} className="mr-2" />
                        <span className="flex-1 truncate">{option.name}</span>
                        <span className="ml-2 shrink-0 text-xs tabular-nums text-muted-foreground">
                          {option.callingCode}
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
      <Input
        id={id}
        name={name}
        type="tel"
        autoComplete="tel-national"
        inputMode="tel"
        disabled={disabled}
        value={national}
        onChange={(e) => handleNationalChange(e.target.value)}
        placeholder={placeholder ?? t('Common.Phone.Placeholder', 'Phone number')}
        data-slot="phone-input-national"
        className="flex-1 rounded-l-none"
      />
    </div>
  );
}
