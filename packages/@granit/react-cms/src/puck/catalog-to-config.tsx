'use client';

import { BLOCK_COMPONENTS } from '../blocks/registry';

import type { BlockCatalogResponse, BlockFieldDescriptor, BlockFieldKind } from '@granit/cms';
import type { Config, ExternalField, Fields } from '@puckeditor/core';

/**
 * Callback supplied by the renderer to resolve live data for a data-bound block.
 * Called inside Puck's `resolveData` during `resolveAllData`.
 */
export type ResolveBlockDataFn = (params: {
  dataSourceKey: string;
  query: string | null;
  siteId: string;
  culture: string;
}) => Promise<{ data: unknown; consumedContentKeys: string[] }>;

/**
 * A document item returned by the editor-side document picker.
 * Stored as the prop value for `DocumentReference` fields when the editor
 * uses the picker. `resolve-documents.ts` accepts this shape alongside plain
 * GUID strings so both paths resolve transparently.
 */
export interface DocumentPickerItem {
  readonly id: string;
  readonly title: string;
  readonly mimeType?: string | null;
}

/**
 * Callback supplied by the renderer so the Puck editor can search for
 * documents to assign to `DocumentReference` fields. Receives the user's
 * search query and returns matching items. The editor runs this client-side
 * via a server-proxied route — the Bearer token never leaves the server.
 */
export type FetchDocumentsFn = (query: string) => Promise<DocumentPickerItem[]>;

export interface CatalogConfigOptions {
  /**
   * When provided, data-bound blocks (`dataSourceKey != null`) get a `resolveData`
   * that calls this function and merges the result into the component's props.
   * Omit for the editor surface where live data should not be pre-resolved.
   */
  resolveBlockData?: ResolveBlockDataFn;
  /** Site identifier forwarded to the data resolver. Required when `resolveBlockData` is set. */
  siteId?: string;
  /** BCP-47 locale forwarded to the data resolver. Required when `resolveBlockData` is set. */
  culture?: string;
  /**
   * When provided, `DocumentReference` fields show a search-driven document
   * picker in the Puck editor sidebar. Without this, the field is rendered as
   * a no-op external field (empty list).
   */
  fetchDocuments?: FetchDocumentsFn;
}

/**
 * Generates a Puck `Config` from the backend block catalog.
 *
 * The backend exposes semantic `BlockFieldKind` values; this function is the
 * only place where the kind → Puck-field mapping lives. Category → Puck
 * sidebar groups map 1:1 to the catalog's `category` field.
 *
 * Blocks not present in {@link BLOCK_COMPONENTS} are silently skipped —
 * the catalog may lag behind the frontend registry or include future blocks.
 *
 * When `options.resolveBlockData` is provided, blocks with a `dataSourceKey`
 * get a `resolveData` hook that fetches live data at SSR time. Presentational
 * blocks are unaffected.
 */
export function catalogToConfig(
  catalog: BlockCatalogResponse,
  options: CatalogConfigOptions = {}
): Config {
  const components: Config['components'] = {};
  const categories: Config['categories'] = {};

  for (const group of catalog.categories) {
    const componentNames: string[] = [];

    for (const entry of group.blocks) {
      const BlockComponent = BLOCK_COMPONENTS[entry.name];
      if (!BlockComponent) continue;

      componentNames.push(entry.name);

      const CapturedComponent = BlockComponent;
      const componentConfig: Config['components'][string] = {
        label: entry.name,
        fields: buildFields(entry.fields, options.fetchDocuments),
        defaultProps: buildDefaultProps(entry.fields),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        render: (props: any) => <CapturedComponent {...props} />,
      };

      // Data-bound blocks: add resolveData to fetch live content at SSR time.
      if (entry.dataSourceKey && options.resolveBlockData) {
        const capturedKey = entry.dataSourceKey;
        const resolveFn = options.resolveBlockData;
        const siteId = options.siteId ?? '';
        const culture = options.culture ?? '';

        componentConfig.resolveData = async (data) => {
          const query =
            typeof (data.props as Record<string, unknown>)['query'] === 'string'
              ? ((data.props as Record<string, unknown>)['query'] as string)
              : null;

          try {
            const result = await resolveFn({
              dataSourceKey: capturedKey,
              query,
              siteId,
              culture,
            });

            return {
              props: result.data as Record<string, unknown>,
              // Lock all live-data fields so the editor can't overwrite them.
              readOnly: Object.fromEntries(
                Object.keys((result.data as Record<string, unknown>) ?? {}).map((k) => [k, true])
              ),
            };
          } catch {
            // Data resolution failure must not crash the page — return as-is.
            return { props: data.props as Record<string, unknown> };
          }
        };
      }

      components[entry.name] = componentConfig;
    }

    if (componentNames.length > 0) {
      categories[group.category] = {
        title: group.category,
        components: componentNames,
      };
    }
  }

  return { components, categories };
}

function buildFields(
  fieldMap: Readonly<Record<string, BlockFieldDescriptor>>,
  fetchDocuments?: FetchDocumentsFn
): Fields<Record<string, unknown>> {
  const result: Fields<Record<string, unknown>> = {};
  for (const [key, descriptor] of Object.entries(fieldMap)) {
    result[key] = descriptorToField(descriptor, fetchDocuments);
  }
  return result;
}

function descriptorToField(
  descriptor: BlockFieldDescriptor,
  fetchDocuments?: FetchDocumentsFn
): Fields<Record<string, unknown>>[string] {
  const kind: BlockFieldKind = descriptor.kind;

  switch (kind) {
    case 'Text':
      return { type: 'textarea' };

    case 'Number':
      return { type: 'number' };

    case 'Boolean':
      return {
        type: 'radio',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      };

    case 'Choice': {
      const opts = (descriptor.options ?? []).map((o) => ({
        label: o.label,
        value: o.value,
      }));
      return { type: 'select', options: opts };
    }

    case 'DocumentReference':
      return buildDocumentReferenceField(fetchDocuments);

    case 'List': {
      const itemFields = buildFields(descriptor.itemFields ?? {}, fetchDocuments);
      return {
        type: 'array',
        arrayFields: itemFields,
        getItemSummary: (_item: unknown, idx?: number) => `Item ${(idx ?? 0) + 1}`,
      };
    }

    case 'Nested': {
      const objectFields = buildFields(descriptor.fields ?? {}, fetchDocuments);
      return { type: 'object', objectFields };
    }

    default:
      return { type: 'text' };
  }
}

function buildDocumentReferenceField(fetchDocuments?: FetchDocumentsFn): ExternalField<unknown> {
  return {
    type: 'external',
    placeholder: 'Select a document…',
    showSearch: true,
    fetchList: async ({ query }: { query: string }): Promise<DocumentPickerItem[]> => {
      if (!fetchDocuments) return [];
      return fetchDocuments(query);
    },
    mapRow: (item: unknown) => {
      const doc = item as DocumentPickerItem;
      return {
        title: doc.title,
        ...(doc.mimeType ? { type: doc.mimeType } : {}),
      };
    },
    getItemSummary: (item: unknown) => (item as DocumentPickerItem | null)?.title ?? '—',
  };
}

function buildDefaultProps(
  fieldMap: Readonly<Record<string, BlockFieldDescriptor>>
): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const [key, descriptor] of Object.entries(fieldMap)) {
    defaults[key] = defaultForKind(descriptor.kind);
  }
  return defaults;
}

function defaultForKind(kind: BlockFieldKind): unknown {
  switch (kind) {
    case 'Text':
      return '';
    case 'Number':
      return 0;
    case 'Boolean':
      return false;
    case 'Choice':
      return null;
    case 'DocumentReference':
      return null;
    case 'List':
      return [];
    case 'Nested':
      return {};
    default:
      return null;
  }
}
