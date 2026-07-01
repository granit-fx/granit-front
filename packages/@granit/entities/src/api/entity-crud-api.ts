import type { AxiosInstance } from '@granit/api-client';

/**
 * Generic single-row wire shape. Manifest-driven entities have no static
 * DTO — the backend returns whatever properties the entity declares — so
 * a row is an opaque camelCase (System.Text.Json default) record.
 */
export type EntityRow = Readonly<Record<string, unknown>>;

/**
 * PascalCase every top-level key. The wire is camelCase (System.Text.Json)
 * but the manifest addresses properties in PascalCase (`propertyName`,
 * `displayProperty`, …), so renderers consume rows keyed PascalCase.
 */
export function toPascalCaseKeys(row: EntityRow): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key.charAt(0).toUpperCase() + key.slice(1), value])
  );
}

/**
 * camelCase every top-level key. Inverse of {@link toPascalCaseKeys} —
 * used when flipping manifest-keyed form values back to the camelCase the
 * write endpoints expect.
 */
export function toCamelCaseKeys(row: EntityRow): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key.charAt(0).toLowerCase() + key.slice(1), value])
  );
}

/**
 * `GET {basePath}/{id}` — read one entity row. `basePath` is the entity's
 * `links.list` from the discovery payload (e.g. `/api/v1/parties`); the
 * row id is appended. Returns the raw camelCase wire record — callers that
 * feed a manifest-driven renderer run it through {@link toPascalCaseKeys}.
 */
export async function getEntity(
  client: AxiosInstance,
  basePath: string,
  id: string,
  options: { readonly signal?: AbortSignal } = {}
): Promise<EntityRow> {
  const response = await client.get<EntityRow>(`${basePath}/${encodeURIComponent(id)}`, {
    signal: options.signal,
  });
  return response.data;
}

/**
 * `POST {basePath}` — create one entity row. `values` are camelCase wire
 * keys; callers holding manifest-keyed (PascalCase) form values flip them
 * with {@link toCamelCaseKeys} first. Returns the created row.
 */
export async function createEntity(
  client: AxiosInstance,
  basePath: string,
  values: EntityRow
): Promise<EntityRow> {
  const response = await client.post<EntityRow>(basePath, values);
  return response.data;
}

/**
 * `PATCH {basePath}/{id}` — partial update of one entity row. PATCH is the
 * canonical update verb across Granit endpoints (`MapPatch("/{id:guid}")`);
 * `values` are camelCase wire keys. Returns the updated row.
 */
export async function updateEntity(
  client: AxiosInstance,
  basePath: string,
  id: string,
  values: EntityRow
): Promise<EntityRow> {
  const response = await client.patch<EntityRow>(`${basePath}/${encodeURIComponent(id)}`, values);
  return response.data;
}
