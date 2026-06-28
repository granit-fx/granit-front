// ---------------------------------------------------------------------------
// Shared editor controls — catalogue-backed query picker + metadata-backed
// field selectors used by the chart / table / pivot config forms.
//
// Built on the shadcn Combobox / Select from @granit/react-ui. The comboboxes
// accept a typed value outside the option list (allowCustomValue), so they keep
// working as free-text-with-suggestions when no <QueryCatalogProvider> is present
// or the selected query has no resolvable metadata. A <QueryClientProvider> is
// required for the catalogue/metadata fetches.
// ---------------------------------------------------------------------------

import { useQueryCatalog, useQueryMetaAt } from '@granit/react-query-engine';
import {
  Combobox,
  ComboboxMulti,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type ComboboxOption,
} from '@granit/react-ui';
import { useTranslation } from 'react-i18next';

import type { QueryCatalogEntryResponse } from '@granit/query-engine';
import type { TFunction } from 'i18next';

/** CLR type names eligible for numeric aggregation (Sum/Avg/Min/Max). */
const NUMERIC_CLR_TYPES = new Set([
  'Byte',
  'SByte',
  'Int16',
  'UInt16',
  'Int32',
  'UInt32',
  'Int64',
  'UInt64',
  'Single',
  'Double',
  'Decimal',
]);

export interface FieldOption {
  readonly name: string;
  readonly label?: string;
}

export interface QueryFieldMetadata {
  /** Catalogue entries for the query combobox, or `undefined` with no provider. */
  readonly catalogEntries: readonly QueryCatalogEntryResponse[] | undefined;
  readonly hasCatalog: boolean;
  /**
   * Group By dimension options: the query's declared group-by fields, or — when
   * a query declares none — every column as a fallback so the control still
   * offers a real picker.
   */
  readonly groupByOptions: readonly FieldOption[];
  /**
   * Field (aggregation target) options: numeric columns, or — when none are
   * detected (e.g. nullable numerics the backend reports as `Nullable`1`) —
   * every column as a fallback.
   */
  readonly fieldOptions: readonly FieldOption[];
  /** All columns of the selected query (e.g. the table visible-columns picker). */
  readonly columnOptions: readonly FieldOption[];
}

/**
 * Resolves the query catalogue and the selected query's metadata into the
 * field-option lists the config forms render. Returns empty option lists until
 * a catalogue entry matching `queryName` resolves its metadata; once columns
 * load, Group By and Field always have options (falling back to all columns).
 */
export function useQueryFieldMetadata(queryName: string): QueryFieldMetadata {
  const { data: catalog } = useQueryCatalog();
  const selectedEntry = catalog?.find((entry) => entry.name === queryName) ?? null;
  const { data: meta } = useQueryMetaAt(selectedEntry?.basePath ?? null);

  const toOption = (field: { name: string; label?: string }): FieldOption => ({
    name: field.name,
    label: field.label,
  });
  const columnOptions = (meta?.columns ?? []).map(toOption);
  const groupByDeclared = (meta?.groupByFields ?? []).map(toOption);
  const numericColumns = (meta?.columns ?? [])
    .filter((column) => NUMERIC_CLR_TYPES.has(column.type))
    .map(toOption);

  return {
    catalogEntries: catalog,
    hasCatalog: catalog != null && catalog.length > 0,
    groupByOptions: groupByDeclared.length > 0 ? groupByDeclared : columnOptions,
    fieldOptions: numericColumns.length > 0 ? numericColumns : columnOptions,
    columnOptions,
  };
}

/** Splits a comma-separated free-text field list into trimmed, non-empty names. */
export function splitFields(raw: string): string[] {
  return raw
    .split(',')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}

const toComboboxOptions = (options: readonly FieldOption[]): ComboboxOption[] =>
  options.map((option) => ({ value: option.name, label: option.label }));

/** Red asterisk appended to a required field's label. Decorative (aria-hidden). */
export function RequiredMark() {
  return (
    <span aria-hidden className="text-destructive">
      {' *'}
    </span>
  );
}

/**
 * Query name picker: a catalogue-backed combobox that also accepts an arbitrary
 * typed value, so it works with or without a `<QueryCatalogProvider>`.
 *
 * Entry semantics (per the `/catalog` contract): the option VALUE is the stable
 * `name` (what we persist), the option LABEL is `t(labelKey)` resolved against the
 * merged i18n bundle — falling back to a humanised last segment of `name` when the
 * key is not in the bundle (`Query:*` keys are opt-in backend-side). Entries with
 * `basePath === null` are not routed (no endpoint to load data from), so they are
 * hidden — flip `HIDE_UNROUTED_QUERIES` to surface them disabled instead.
 */
const HIDE_UNROUTED_QUERIES = true;

/** Humanises the last dot-segment of a query name, e.g. `…CategoriesQuery` → `Categories Query`. */
export function humanizeQueryName(name: string): string {
  const last = name.split('.').pop() ?? name;
  return last
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .trim();
}

/** Resolves a catalogue entry's display label: `t(labelKey)`, else a humanised name. */
export function resolveQueryLabel(t: TFunction, entry: QueryCatalogEntryResponse): string {
  const translated = t(entry.labelKey);
  return translated === entry.labelKey ? humanizeQueryName(entry.name) : translated;
}

export function QueryNameCombobox({
  slot,
  value,
  onChange,
  entries,
  required = false,
}: {
  readonly slot: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly entries: readonly QueryCatalogEntryResponse[] | undefined;
  readonly required?: boolean;
}) {
  const { t } = useTranslation();
  const options: ComboboxOption[] = (entries ?? [])
    .filter((entry) => !HIDE_UNROUTED_QUERIES || entry.basePath !== null)
    .map((entry) => ({ value: entry.name, label: resolveQueryLabel(t, entry) }))
    // Sorted by the DISPLAYED label (ascending), not the wire name.
    .sort((a, b) => (a.label ?? '').localeCompare(b.label ?? ''));

  return (
    <Combobox
      slot={slot}
      value={value}
      onValueChange={onChange}
      options={options}
      allowCustomValue
      required={required}
      placeholder="Select a query…"
      searchPlaceholder="Search or type a query name…"
      emptyText="No matching query — type to use a custom name."
    />
  );
}

/**
 * Single-value field picker: a combobox over metadata options that also accepts
 * a typed value, so it doubles as a free-text input when no options are loaded
 * and always preserves the current value.
 */
export function MetaFieldInput({
  slot,
  value,
  options,
  onChange,
  disabled = false,
  allowEmpty = false,
  required = false,
}: {
  readonly slot: string;
  readonly value: string;
  readonly options: readonly FieldOption[];
  readonly onChange: (value: string) => void;
  readonly disabled?: boolean;
  readonly allowEmpty?: boolean;
  readonly required?: boolean;
}) {
  return (
    <Combobox
      slot={slot}
      value={value}
      onValueChange={onChange}
      options={toComboboxOptions(options)}
      allowCustomValue
      allowEmpty={allowEmpty}
      disabled={disabled}
      required={required}
      placeholder="Select a field…"
      searchPlaceholder="Search or type a field…"
    />
  );
}

/**
 * Multi-value field picker: a multi-select combobox over metadata options that
 * also accepts typed values (free-text fallback when no options are loaded).
 */
export function MetaMultiFieldInput({
  slot,
  values,
  options,
  onChange,
  placeholder,
  required = false,
}: {
  readonly slot: string;
  readonly values: readonly string[];
  readonly options: readonly FieldOption[];
  readonly onChange: (values: string[]) => void;
  readonly placeholder?: string;
  readonly required?: boolean;
}) {
  return (
    <ComboboxMulti
      slot={slot}
      values={values}
      onValuesChange={onChange}
      options={toComboboxOptions(options)}
      allowCustomValue
      required={required}
      placeholder={placeholder ?? 'Select fields…'}
      searchPlaceholder="Search or type a field…"
    />
  );
}

/** Fixed-enum dropdown (aggregation, chart type, …) on the shadcn Select. */
export function EnumSelect({
  slot,
  value,
  options,
  onChange,
}: {
  readonly slot: string;
  readonly value: string;
  /** Bare values (label === value) or explicit `{ value, label }` pairs. */
  readonly options: readonly (string | { readonly value: string; readonly label: string })[];
  readonly onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger data-slot={slot} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => {
          const { value: optionValue, label } =
            typeof option === 'string' ? { value: option, label: option } : option;
          return (
            <SelectItem key={optionValue} value={optionValue}>
              {label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
