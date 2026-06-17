import { describe, expect, it, vi } from 'vitest';

import { catalogToConfig } from '../puck/catalog-to-config';

import type { BlockCatalogResponse } from '@granit/cms';

const catalog: BlockCatalogResponse = {
  categories: [
    {
      category: 'hero',
      blocks: [
        {
          name: 'hero',
          version: '1.0.0',
          sourceModule: 'Granit.Cms.Blocks',
          renderSide: 'Server',
          dataSourceKey: null,
          subscribedContentTypes: [],
          fields: {
            headline: { kind: 'Text' },
            imageId: { kind: 'DocumentReference' },
            highlighted: { kind: 'Boolean' },
            layout: {
              kind: 'Choice',
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Right', value: 'right' },
              ],
            },
            items: {
              kind: 'List',
              itemFields: { text: { kind: 'Text' } },
            },
            meta: {
              kind: 'Nested',
              fields: { title: { kind: 'Text' } },
            },
          },
        },
      ],
    },
    {
      category: 'unknown',
      blocks: [
        {
          name: 'UnknownBlock',
          version: '1.0.0',
          sourceModule: 'Granit.Cms.Blocks',
          renderSide: 'Server',
          dataSourceKey: null,
          subscribedContentTypes: [],
          fields: {},
        },
      ],
    },
  ],
};

describe('catalogToConfig', () => {
  it('maps known blocks to Puck component configs', () => {
    const config = catalogToConfig(catalog);

    expect(config.components).toHaveProperty('hero');
    expect(config.components['hero']?.label).toBe('hero');
  });

  it('skips blocks with no matching registry entry', () => {
    const config = catalogToConfig(catalog);
    expect(config.components).not.toHaveProperty('UnknownBlock');
  });

  it('omits empty categories after filtering unknown blocks', () => {
    const config = catalogToConfig(catalog);
    expect(Object.keys(config.categories ?? {})).not.toContain('unknown');
  });

  it('maps Text → textarea', () => {
    const config = catalogToConfig(catalog);
    const hero = config.components['hero'];
    const fields = hero?.fields ?? {};
    expect(fields['headline']).toEqual({ type: 'textarea' });
  });

  it('maps DocumentReference → external field', () => {
    const config = catalogToConfig(catalog);
    const hero = config.components['hero'];
    const fields = hero?.fields ?? {};
    expect(fields['imageId']).toMatchObject({ type: 'external' });
  });

  it('maps Boolean → radio with true/false options', () => {
    const config = catalogToConfig(catalog);
    const hero = config.components['hero'];
    const fields = hero?.fields ?? {};
    expect(fields['highlighted']).toEqual({
      type: 'radio',
      options: [
        { label: 'Yes', value: true },
        { label: 'No', value: false },
      ],
    });
  });

  it('maps Choice → select with backend options', () => {
    const config = catalogToConfig(catalog);
    const hero = config.components['hero'];
    const fields = hero?.fields ?? {};
    expect(fields['layout']).toEqual({
      type: 'select',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' },
      ],
    });
  });

  it('maps List → array with nested arrayFields', () => {
    const config = catalogToConfig(catalog);
    const hero = config.components['hero'];
    const fields = hero?.fields ?? {};
    expect(fields['items']).toMatchObject({ type: 'array' });
  });

  it('maps Nested → object with objectFields', () => {
    const config = catalogToConfig(catalog);
    const hero = config.components['hero'];
    const fields = hero?.fields ?? {};
    expect(fields['meta']).toMatchObject({ type: 'object' });
  });

  it('creates default props for each field', () => {
    const config = catalogToConfig(catalog);
    const hero = config.components['hero'];
    const defaults = hero?.defaultProps ?? {};
    expect(defaults['headline']).toBe('');
    expect(defaults['imageId']).toBeNull();
    expect(defaults['highlighted']).toBe(false);
    expect(defaults['items']).toEqual([]);
    expect(defaults['meta']).toEqual({});
  });

  it('maps Number → number field and default 0', () => {
    const numericCatalog: BlockCatalogResponse = {
      categories: [
        {
          category: 'pricing',
          blocks: [
            {
              name: 'pricing',
              version: '1.0.0',
              sourceModule: 'Granit.Cms.Blocks',
              renderSide: 'Server',
              dataSourceKey: null,
              subscribedContentTypes: [],
              fields: { price: { kind: 'Number' } },
            },
          ],
        },
      ],
    };

    const config = catalogToConfig(numericCatalog);
    const pricing = config.components['pricing'];
    expect(pricing?.fields?.['price']).toEqual({ type: 'number' });
    expect(pricing?.defaultProps?.['price']).toBe(0);
  });
});

describe('catalogToConfig with resolveBlockData', () => {
  const dataBoundCatalog: BlockCatalogResponse = {
    categories: [
      {
        category: 'pricing',
        blocks: [
          {
            name: 'pricing',
            version: '1.0.0',
            sourceModule: 'Granit.Cms.Blocks',
            renderSide: 'Client',
            dataSourceKey: 'pricing-source',
            subscribedContentTypes: ['product.plan'],
            fields: { price: { kind: 'Number' } },
          },
        ],
      },
    ],
  };

  it('sets resolveData on data-bound blocks when resolveBlockData is provided', () => {
    const resolveFn = vi.fn();
    const config = catalogToConfig(dataBoundCatalog, {
      resolveBlockData: resolveFn,
      siteId: 'site-1',
      culture: 'fr',
    });
    expect(config.components['pricing']?.resolveData).toBeDefined();
  });

  it('does not set resolveData when resolveBlockData is omitted', () => {
    const config = catalogToConfig(dataBoundCatalog);
    expect(config.components['pricing']?.resolveData).toBeUndefined();
  });

  it('resolveData calls resolveFn with query string from props', async () => {
    const resolveFn = vi.fn().mockResolvedValue({ data: { items: [] }, consumedContentKeys: [] });
    const config = catalogToConfig(dataBoundCatalog, {
      resolveBlockData: resolveFn,
      siteId: 'site-1',
      culture: 'fr',
    });

    const resolveData = config.components['pricing']?.resolveData as any;

    await resolveData({ props: { query: 'premium' } });

    expect(resolveFn).toHaveBeenCalledWith({
      dataSourceKey: 'pricing-source',
      query: 'premium',
      siteId: 'site-1',
      culture: 'fr',
    });
  });

  it('resolveData passes null query when props.query is not a string', async () => {
    const resolveFn = vi.fn().mockResolvedValue({ data: {}, consumedContentKeys: [] });
    const config = catalogToConfig(dataBoundCatalog, {
      resolveBlockData: resolveFn,
      siteId: 'site-1',
      culture: 'fr',
    });

    const resolveData = config.components['pricing']?.resolveData as any;

    await resolveData({ props: { price: 99 } });

    expect(resolveFn).toHaveBeenCalledWith(expect.objectContaining({ query: null }));
  });

  it('resolveData returns original props when resolveFn throws', async () => {
    const resolveFn = vi.fn().mockRejectedValue(new Error('network error'));
    const config = catalogToConfig(dataBoundCatalog, {
      resolveBlockData: resolveFn,
      siteId: 'site-1',
      culture: 'fr',
    });

    const resolveData = config.components['pricing']?.resolveData as any;

    const result = await resolveData({ props: { price: 99 } });

    expect(result.props).toEqual({ price: 99 });
  });

  it('resolveData returns resolved data with readOnly flags', async () => {
    const resolveFn = vi.fn().mockResolvedValue({
      data: { items: ['a', 'b'], count: 2 },
      consumedContentKeys: [],
    });
    const config = catalogToConfig(dataBoundCatalog, {
      resolveBlockData: resolveFn,
      siteId: 'site-1',
      culture: 'fr',
    });

    const resolveData = config.components['pricing']?.resolveData as any;

    const result = await resolveData({ props: {} });

    expect(result.props).toEqual({ items: ['a', 'b'], count: 2 });
    expect(result.readOnly).toEqual({ items: true, count: true });
  });
});
