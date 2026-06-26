// ---------------------------------------------------------------------------
// Shared editor controls — catalogue-backed query picker + metadata-backed
// field selectors used by the chart / table / pivot config forms.
//
// All controls degrade to free-text when no <QueryCatalogProvider> is present
// (or the selected query has no resolvable metadata), so the forms keep working
// in any host. A <QueryClientProvider> is required.
// ---------------------------------------------------------------------------

import { useQueryCatalog, useQueryMetaAt } from '@granit/react-query-engine';

import type { QueryCatalogEntryResponse } from '@granit/query-engine';

export const CONTROL_CLASS =
  'w-full rounded-md border bg-background px-3 py-1.5 text-sm disabled:opacity-50';

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
  /** Group-by-able dimensions of the selected query. */
  readonly groupByOptions: readonly FieldOption[];
  /** Numeric columns of the selected query (aggregation targets). */
  readonly numericColumnOptions: readonly FieldOption[];
  /** All columns of the selected query. */
  readonly columnOptions: readonly FieldOption[];
}

/**
 * Resolves the query catalogue and the selected query's metadata into the
 * field-option lists the config forms render. Returns empty option lists until
 * a catalogue entry matching `queryName` resolves its metadata.
 */
export function useQueryFieldMetadata(queryName: string): QueryFieldMetadata {
  const { data: catalog } = useQueryCatalog();
  const selectedEntry = catalog?.find((entry) => entry.name === queryName) ?? null;
  const { data: meta } = useQueryMetaAt(selectedEntry?.basePath ?? null);

  const columns = meta?.columns ?? [];
  return {
    catalogEntries: catalog,
    hasCatalog: catalog != null && catalog.length > 0,
    groupByOptions: meta?.groupByFields ?? [],
    numericColumnOptions: columns
      .filter((column) => NUMERIC_CLR_TYPES.has(column.type))
      .map((column) => ({ name: column.name, label: column.label })),
    columnOptions: columns.map((column) => ({ name: column.name, label: column.label })),
  };
}

/** Splits a comma-separated free-text field list into trimmed, non-empty names. */
export function splitFields(raw: string): string[] {
  return raw
    .split(',')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}

/**
 * Free-text query name input augmented with a `<datalist>` of catalogue
 * suggestions when a provider is present. Keeps arbitrary values typeable.
 */
export function QueryNameCombobox({
  slot,
  datalistId,
  value,
  onChange,
  entries,
  hasCatalog,
}: {
  readonly slot: string;
  readonly datalistId: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly entries: readonly QueryCatalogEntryResponse[] | undefined;
  readonly hasCatalog: boolean;
}) {
  return (
    <>
      <input
        type="text"
        data-slot={slot}
        list={hasCatalog ? datalistId : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={CONTROL_CLASS}
      />
      {hasCatalog && entries && (
        <datalist id={datalistId}>
          {entries.map((entry) => (
            <option key={entry.name} value={entry.name}>
              {entry.label}
            </option>
          ))}
        </datalist>
      )}
    </>
  );
}

/**
 * Single-value field picker: a `<select>` over metadata options, falling back
 * to a free-text `<input>` when no options are available. The current `value`
 * is always preserved as an option, so switching queries never silently drops
 * a previously bound field.
 */
export function MetaFieldInput({
  slot,
  value,
  options,
  onChange,
  disabled = false,
  allowEmpty = false,
}: {
  readonly slot: string;
  readonly value: string;
  readonly options: readonly FieldOption[];
  readonly onChange: (value: string) => void;
  readonly disabled?: boolean;
  readonly allowEmpty?: boolean;
}) {
  if (options.length === 0) {
    return (
      <input
        type="text"
        data-slot={slot}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={CONTROL_CLASS}
      />
    );
  }

  const knownValue = value === '' || options.some((option) => option.name === value);
  return (
    <select
      data-slot={slot}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={CONTROL_CLASS}
    >
      {allowEmpty && <option value="">—</option>}
      {!knownValue && <option value={value}>{value}</option>}
      {options.map((option) => (
        <option key={option.name} value={option.name}>
          {option.label ?? option.name}
        </option>
      ))}
    </select>
  );
}

/**
 * Multi-value field picker: a native multiple-`<select>` over metadata options,
 * falling back to comma-separated free-text when no options are available.
 * Current values absent from `options` are preserved as leading entries.
 */
export function MetaMultiFieldInput({
  slot,
  values,
  options,
  onChange,
  placeholder,
}: {
  readonly slot: string;
  readonly values: readonly string[];
  readonly options: readonly FieldOption[];
  readonly onChange: (values: string[]) => void;
  readonly placeholder?: string;
}) {
  if (options.length === 0) {
    return (
      <input
        type="text"
        data-slot={slot}
        value={values.join(', ')}
        placeholder={placeholder}
        onChange={(event) => onChange(splitFields(event.target.value))}
        className={CONTROL_CLASS}
      />
    );
  }

  const unknownValues = values.filter((value) => !options.some((option) => option.name === value));
  return (
    <select
      multiple
      data-slot={slot}
      value={values as string[]}
      onChange={(event) =>
        onChange(Array.from(event.target.selectedOptions, (option) => option.value))
      }
      className={CONTROL_CLASS}
    >
      {unknownValues.map((value) => (
        <option key={value} value={value}>
          {value}
        </option>
      ))}
      {options.map((option) => (
        <option key={option.name} value={option.name}>
          {option.label ?? option.name}
        </option>
      ))}
    </select>
  );
}
