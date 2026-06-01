import { describe, expect, it } from 'vitest';

import { catalogToConfig } from '../puck/catalog-to-config.js';

import type { BlockCatalogResponse } from '@granit/cms';

const catalog: BlockCatalogResponse = {
  categories: [
    {
      category: 'hero',
      blocks: [
        {
          name: 'Hero',
          version: '1.0.0',
          sourceModule: 'Granit.Cms.Blocks',
          renderSide: 'Server',
          dataSourceKey: null,
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
          fields: {},
        },
      ],
    },
  ],
};

describe('catalogToConfig', () => {
  it('maps known blocks to Puck component configs', () => {
    const config = catalogToConfig(catalog);

    expect(config.components).toHaveProperty('Hero');
    expect(config.components['Hero']?.label).toBe('Hero');
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
    const hero = config.components['Hero'];
    const fields = hero?.fields ?? {};
    expect(fields['headline']).toEqual({ type: 'textarea' });
  });

  it('maps DocumentReference → external field', () => {
    const config = catalogToConfig(catalog);
    const hero = config.components['Hero'];
    const fields = hero?.fields ?? {};
    expect(fields['imageId']).toMatchObject({ type: 'external' });
  });

  it('maps Boolean → radio with true/false options', () => {
    const config = catalogToConfig(catalog);
    const hero = config.components['Hero'];
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
    const hero = config.components['Hero'];
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
    const hero = config.components['Hero'];
    const fields = hero?.fields ?? {};
    expect(fields['items']).toMatchObject({ type: 'array' });
  });

  it('maps Nested → object with objectFields', () => {
    const config = catalogToConfig(catalog);
    const hero = config.components['Hero'];
    const fields = hero?.fields ?? {};
    expect(fields['meta']).toMatchObject({ type: 'object' });
  });

  it('creates default props for each field', () => {
    const config = catalogToConfig(catalog);
    const hero = config.components['Hero'];
    const defaults = hero?.defaultProps ?? {};
    expect(defaults['headline']).toBe('');
    expect(defaults['imageId']).toBeNull();
    expect(defaults['highlighted']).toBe(false);
    expect(defaults['items']).toEqual([]);
    expect(defaults['meta']).toEqual({});
  });
});
