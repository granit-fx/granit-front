import type { BlockCatalogResponse, BlockFieldDescriptor } from '@granit/cms';

/**
 * A render-ready resolved document — the fields the renderer needs to display
 * an image or file link.
 */
export interface ResolvedDocumentAsset {
  readonly url: string;
  readonly width?: number | null;
  readonly height?: number | null;
  readonly mimeType?: string | null;
}

/**
 * Callback the renderer supplies to resolve a batch of document GUIDs.
 * Returns a map of `documentId → asset`. Unknown / revoked IDs are absent
 * from the map (not `null`) so callers can distinguish "not resolved" from
 * "resolved but missing".
 */
export type ResolveDocumentsFn = (ids: string[]) => Promise<Map<string, ResolvedDocumentAsset>>;

/**
 * Walks Puck `Data` alongside the block catalog, collects every
 * `DocumentReference` field value, resolves them in a single batch call,
 * then returns a new data object where each `DocumentReference` field is
 * accompanied by a `_resolved_<fieldName>` sibling carrying the asset
 * descriptor.
 *
 * The original field value (the GUID) is preserved so the Puck editor can
 * still display it. Only plain-object `props` are mutated — Puck metadata
 * (`id`, `type`) is left untouched.
 */
export async function resolveDocumentReferencesInData(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
  catalog: BlockCatalogResponse,
  resolveFn: ResolveDocumentsFn
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  // Build a lookup: blockName → fieldName → descriptor
  const schema = buildSchema(catalog);

  // Collect all GUIDs to resolve
  const guids = new Set<string>();
  for (const component of data?.content ?? []) {
    const blockSchema = schema.get(component?.type as string);
    if (!blockSchema) continue;
    collectGuids(component?.props as Record<string, unknown>, blockSchema, guids);
  }

  if (guids.size === 0) return data;

  const resolved = await resolveFn([...guids]);

  // Inject resolved assets alongside the original field values
  const nextContent = ((data?.content ?? []) as unknown[]).map((component) => {
    const blockSchema = schema.get((component as { type?: string })?.type ?? '');
    if (!blockSchema) return component;
    return {
      ...(component as object),
      props: injectResolved(
        (component as { props?: Record<string, unknown> }).props ?? {},
        blockSchema,
        resolved
      ),
    };
  });

  return { ...data, content: nextContent };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildSchema(
  catalog: BlockCatalogResponse
): Map<string, Map<string, BlockFieldDescriptor>> {
  const result = new Map<string, Map<string, BlockFieldDescriptor>>();
  for (const group of catalog.categories) {
    for (const block of group.blocks) {
      result.set(block.name, new Map(Object.entries(block.fields)));
    }
  }
  return result;
}

/**
 * Extracts a document GUID from either a plain string or a `DocumentPickerItem`
 * object `{ id: string }`. Returns `null` when the value carries no usable GUID.
 */
function extractGuid(value: unknown): string | null {
  if (typeof value === 'string' && value.length > 0) return value;
  if (
    value != null &&
    typeof value === 'object' &&
    'id' in value &&
    typeof (value as { id: unknown }).id === 'string' &&
    (value as { id: string }).id.length > 0
  ) {
    return (value as { id: string }).id;
  }
  return null;
}

function collectGuids(
  props: Record<string, unknown>,
  fieldSchema: Map<string, BlockFieldDescriptor>,
  out: Set<string>
): void {
  for (const [key, descriptor] of fieldSchema) {
    const value = props[key];
    if (descriptor.kind === 'DocumentReference') {
      const guid = extractGuid(value);
      if (guid) out.add(guid);
    } else if (descriptor.kind === 'List' && Array.isArray(value) && descriptor.itemFields) {
      const itemSchema = new Map(Object.entries(descriptor.itemFields));
      for (const item of value as Record<string, unknown>[]) {
        collectGuids(item, itemSchema, out);
      }
    } else if (
      descriptor.kind === 'Nested' &&
      value &&
      typeof value === 'object' &&
      descriptor.fields
    ) {
      const nestedSchema = new Map(Object.entries(descriptor.fields));
      collectGuids(value as Record<string, unknown>, nestedSchema, out);
    }
  }
}

function injectResolved(
  props: Record<string, unknown>,
  fieldSchema: Map<string, BlockFieldDescriptor>,
  resolved: Map<string, ResolvedDocumentAsset>
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...props };

  for (const [key, descriptor] of fieldSchema) {
    const value = props[key];
    if (descriptor.kind === 'DocumentReference') {
      const guid = extractGuid(value);
      if (guid) {
        const asset = resolved.get(guid);
        if (asset) next[`_resolved_${key}`] = asset;
      }
    } else if (descriptor.kind === 'List' && Array.isArray(value) && descriptor.itemFields) {
      const itemSchema = new Map(Object.entries(descriptor.itemFields));
      next[key] = (value as Record<string, unknown>[]).map((item) =>
        injectResolved(item, itemSchema, resolved)
      );
    } else if (
      descriptor.kind === 'Nested' &&
      value &&
      typeof value === 'object' &&
      descriptor.fields
    ) {
      const nestedSchema = new Map(Object.entries(descriptor.fields));
      next[key] = injectResolved(value as Record<string, unknown>, nestedSchema, resolved);
    }
  }

  return next;
}
