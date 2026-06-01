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
  options?: CatalogConfigOptions
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
        fields: buildFields(entry.fields),
        defaultProps: buildDefaultProps(entry.fields),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        render: (props: any) => <CapturedComponent {...props} />,
      };

      // Data-bound blocks: add resolveData to fetch live content at SSR time.
      if (entry.dataSourceKey && options?.resolveBlockData) {
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
  fieldMap: Readonly<Record<string, BlockFieldDescriptor>>
): Fields<Record<string, unknown>> {
  const result: Fields<Record<string, unknown>> = {};
  for (const [key, descriptor] of Object.entries(fieldMap)) {
    result[key] = descriptorToField(descriptor);
  }
  return result;
}

function descriptorToField(
  descriptor: BlockFieldDescriptor
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
      const options = (descriptor.options ?? []).map((o) => ({
        label: o.label,
        value: o.value,
      }));
      return { type: 'select', options };
    }

    case 'DocumentReference':
      return buildDocumentReferenceField();

    case 'List': {
      const itemFields = buildFields(
        (descriptor.itemFields ?? {}) as Record<string, BlockFieldDescriptor>
      );
      return {
        type: 'array',
        arrayFields: itemFields,
        getItemSummary: (_item: unknown, idx?: number) => `Item ${(idx ?? 0) + 1}`,
      };
    }

    case 'Nested': {
      const objectFields = buildFields(
        (descriptor.fields ?? {}) as Record<string, BlockFieldDescriptor>
      );
      return { type: 'object', objectFields };
    }

    default: {
      void (kind as never);
      return { type: 'text' };
    }
  }
}

function buildDocumentReferenceField(): ExternalField<unknown> {
  return {
    type: 'external',
    placeholder: 'Select a document…',
    fetchList: async (): Promise<{ title: string; id: string }[]> => [],
    mapRow: (item: unknown) => ({ title: (item as { title: string }).title }),
    getItemSummary: (value: unknown) => (value as string | null) ?? '—',
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
    default: {
      void (kind as never);
      return null;
    }
  }
}
