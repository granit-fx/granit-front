// ---------------------------------------------------------------------------
// Headless query-field metadata resolution — catalogue + selected-query column
// metadata reduced into the field-option lists the config forms render.
//
// This is the react-ui-free half of the former `query-field-controls`: the
// shadcn-styled controls that consume these options live in
// @granit/react-ui-analytics. Keeping the hook here lets any UI tier (or a
// non-shadcn host form) reuse the same catalogue/metadata wiring.
//
// A <QueryClientProvider> is required for the catalogue/metadata fetches.
// ---------------------------------------------------------------------------

import { useQueryCatalog, useQueryMetaAt } from '@granit/react-query-engine';

import type { QueryCatalogEntryResponse } from '@granit/query-engine';

/**
 * NetTopologySuite geometry CLR type names — a query column bound to a PostGIS
 * geometry/geography column reports one of these as its `type` (`ClrType.Name`),
 * so a map's geography-column picker can offer only spatial columns.
 */
const GEOMETRY_CLR_TYPES = new Set([
  'Geometry',
  'Point',
  'LineString',
  'Polygon',
  'MultiPoint',
  'MultiLineString',
  'MultiPolygon',
  'GeometryCollection',
  'LinearRing',
]);

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
  /**
   * Spatial columns only (NetTopologySuite geometry CLR types) — the map's
   * PostGIS geography-column picker. Falls back to every column when none are
   * detected (e.g. a nullable geometry the backend reports as `Nullable`1`), so
   * the picker never goes empty on an unrecognised shape.
   */
  readonly geographyColumnOptions: readonly FieldOption[];
  /**
   * Sortable field options for the selected query: the columns flagged
   * `isSortable` (they carry display labels), falling back to the query's
   * declared `sortableFields` when no column advertises sortability. Empty until
   * metadata resolves.
   */
  readonly sortableFieldOptions: readonly FieldOption[];
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
  const geometryColumns = (meta?.columns ?? [])
    .filter((column) => GEOMETRY_CLR_TYPES.has(column.type))
    .map(toOption);
  const sortableColumns = (meta?.columns ?? []).filter((column) => column.isSortable).map(toOption);
  const sortableDeclared = (meta?.sortableFields ?? []).map(toOption);

  return {
    catalogEntries: catalog,
    hasCatalog: catalog != null && catalog.length > 0,
    groupByOptions: groupByDeclared.length > 0 ? groupByDeclared : columnOptions,
    fieldOptions: numericColumns.length > 0 ? numericColumns : columnOptions,
    columnOptions,
    geographyColumnOptions: geometryColumns.length > 0 ? geometryColumns : columnOptions,
    sortableFieldOptions: sortableColumns.length > 0 ? sortableColumns : sortableDeclared,
  };
}
