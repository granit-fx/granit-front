import { describe, expect, it, vi } from 'vitest';

import { resolveDocumentReferencesInData } from '../blocks/resolve-documents';

import type { ResolvedDocumentAsset, ResolveDocumentsFn } from '../blocks/resolve-documents';
import type { BlockCatalogResponse } from '@granit/cms';

const asset1: ResolvedDocumentAsset = {
  url: 'https://cdn.example.com/img1.png',
  width: 800,
  height: 600,
};
const asset2: ResolvedDocumentAsset = { url: 'https://cdn.example.com/img2.png' };

const catalog: BlockCatalogResponse = {
  categories: [
    {
      category: 'content',
      blocks: [
        {
          name: 'Hero',
          version: '1.0.0',
          sourceModule: 'Granit.Cms.Blocks',
          renderSide: 'Server',
          dataSourceKey: null,
          subscribedContentTypes: [],
          fields: {
            headline: { kind: 'Text' },
            imageId: { kind: 'DocumentReference' },
            nested: {
              kind: 'Nested',
              fields: { docId: { kind: 'DocumentReference' } },
            },
            items: {
              kind: 'List',
              itemFields: { itemDoc: { kind: 'DocumentReference' } },
            },
          },
        },
      ],
    },
  ],
};

describe('resolveDocumentReferencesInData', () => {
  it('returns original data when content is empty', async () => {
    const resolveFn: ResolveDocumentsFn = vi.fn().mockResolvedValue(new Map());
    const data = { content: [], zones: {} };

    const result = await resolveDocumentReferencesInData(data, catalog, resolveFn);

    expect(result).toBe(data);
    expect(resolveFn).not.toHaveBeenCalled();
  });

  it('short-circuits without calling resolveFn when no GUIDs are collected', async () => {
    const resolveFn: ResolveDocumentsFn = vi.fn().mockResolvedValue(new Map());
    const data = {
      content: [{ type: 'Hero', props: { headline: 'Hello', imageId: '', nested: {}, items: [] } }],
    };

    const result = await resolveDocumentReferencesInData(data, catalog, resolveFn);

    expect(result).toBe(data);
    expect(resolveFn).not.toHaveBeenCalled();
  });

  it('resolves a top-level DocumentReference and injects _resolved_ sibling', async () => {
    const resolveFn: ResolveDocumentsFn = vi.fn().mockResolvedValue(new Map([['guid-1', asset1]]));
    const data = {
      content: [{ type: 'Hero', props: { headline: 'Hello', imageId: 'guid-1' } }],
    };

    const result = await resolveDocumentReferencesInData(data, catalog, resolveFn);

    expect(result.content[0].props.imageId).toBe('guid-1');

    expect(result.content[0].props._resolved_imageId).toEqual(asset1);
    expect(resolveFn).toHaveBeenCalledWith(['guid-1']);
  });

  it('does not inject _resolved_ when GUID is absent from the resolution map', async () => {
    const resolveFn: ResolveDocumentsFn = vi.fn().mockResolvedValue(new Map());
    const data = {
      content: [{ type: 'Hero', props: { imageId: 'guid-unknown' } }],
    };

    const result = await resolveDocumentReferencesInData(data, catalog, resolveFn);

    expect(result.content[0].props).not.toHaveProperty('_resolved_imageId');
  });

  it('resolves a DocumentReference inside a Nested field', async () => {
    const resolveFn: ResolveDocumentsFn = vi
      .fn()
      .mockResolvedValue(new Map([['guid-nested', asset2]]));
    const data = {
      content: [{ type: 'Hero', props: { nested: { docId: 'guid-nested' } } }],
    };

    const result = await resolveDocumentReferencesInData(data, catalog, resolveFn);

    expect(result.content[0].props.nested._resolved_docId).toEqual(asset2);
  });

  it('resolves DocumentReferences inside List items', async () => {
    const resolveFn: ResolveDocumentsFn = vi.fn().mockResolvedValue(
      new Map([
        ['guid-item1', asset1],
        ['guid-item2', asset2],
      ])
    );
    const data = {
      content: [
        {
          type: 'Hero',
          props: { items: [{ itemDoc: 'guid-item1' }, { itemDoc: 'guid-item2' }] },
        },
      ],
    };

    const result = await resolveDocumentReferencesInData(data, catalog, resolveFn);

    const items: unknown[] = result.content[0].props.items;

    expect(items).toHaveLength(2);

    expect((items[0] as Record<string, unknown>)['_resolved_itemDoc']).toEqual(asset1);

    expect((items[1] as Record<string, unknown>)['_resolved_itemDoc']).toEqual(asset2);
  });

  it('passes through components not present in the catalog unchanged', async () => {
    const resolveFn: ResolveDocumentsFn = vi.fn().mockResolvedValue(new Map([['guid-1', asset1]]));
    const data = {
      content: [
        { type: 'Hero', props: { imageId: 'guid-1' } },
        { type: 'UnknownBlock', props: { imageId: 'guid-1' } },
      ],
    };

    const result = await resolveDocumentReferencesInData(data, catalog, resolveFn);

    expect(result.content[1]).toEqual({ type: 'UnknownBlock', props: { imageId: 'guid-1' } });

    expect(result.content[0].props._resolved_imageId).toEqual(asset1);
  });

  it('handles null data gracefully', async () => {
    const resolveFn: ResolveDocumentsFn = vi.fn().mockResolvedValue(new Map());

    const result = await resolveDocumentReferencesInData(null, catalog, resolveFn);

    expect(result).toBeNull();
    expect(resolveFn).not.toHaveBeenCalled();
  });

  it('deduplicates GUIDs across multiple components in a single batch call', async () => {
    const resolveFn: ResolveDocumentsFn = vi
      .fn()
      .mockResolvedValue(new Map([['shared-guid', asset1]]));
    const data = {
      content: [
        { type: 'Hero', props: { imageId: 'shared-guid' } },
        { type: 'Hero', props: { imageId: 'shared-guid' } },
      ],
    };

    await resolveDocumentReferencesInData(data, catalog, resolveFn);

    expect(resolveFn).toHaveBeenCalledTimes(1);
    expect(resolveFn).toHaveBeenCalledWith(['shared-guid']);
  });

  it('skips Nested field when value is not an object', async () => {
    const resolveFn: ResolveDocumentsFn = vi.fn().mockResolvedValue(new Map([['guid-1', asset1]]));
    const data = {
      content: [{ type: 'Hero', props: { imageId: 'guid-1', nested: null } }],
    };

    const result = await resolveDocumentReferencesInData(data, catalog, resolveFn);

    expect(result.content[0].props._resolved_imageId).toEqual(asset1);

    expect(result.content[0].props.nested).toBeNull();
  });

  it('skips List field when value is not an array', async () => {
    const resolveFn: ResolveDocumentsFn = vi.fn().mockResolvedValue(new Map([['guid-1', asset1]]));
    const data = {
      content: [{ type: 'Hero', props: { imageId: 'guid-1', items: null } }],
    };

    const result = await resolveDocumentReferencesInData(data, catalog, resolveFn);

    expect(result.content[0].props._resolved_imageId).toEqual(asset1);

    expect(result.content[0].props.items).toBeNull();
  });

  it('resolves a DocumentPickerItem object ({id, title}) the same as a plain GUID string', async () => {
    const resolveFn: ResolveDocumentsFn = vi
      .fn()
      .mockResolvedValue(new Map([['guid-picker', asset1]]));
    const pickerItem = { id: 'guid-picker', title: 'My Document', mimeType: 'image/png' };
    const data = {
      content: [{ type: 'Hero', props: { imageId: pickerItem } }],
    };

    const result = await resolveDocumentReferencesInData(data, catalog, resolveFn);

    expect(result.content[0].props._resolved_imageId).toEqual(asset1);
    expect(resolveFn).toHaveBeenCalledWith(['guid-picker']);
  });

  it('deduplicates picker-object GUIDs against plain-string GUIDs in the same batch', async () => {
    const resolveFn: ResolveDocumentsFn = vi
      .fn()
      .mockResolvedValue(new Map([['shared-guid', asset1]]));
    const data = {
      content: [
        { type: 'Hero', props: { imageId: 'shared-guid' } },
        { type: 'Hero', props: { imageId: { id: 'shared-guid', title: 'Doc' } } },
      ],
    };

    await resolveDocumentReferencesInData(data, catalog, resolveFn);

    expect(resolveFn).toHaveBeenCalledTimes(1);
    expect(resolveFn).toHaveBeenCalledWith(['shared-guid']);
  });

  it('ignores a DocumentPickerItem with an empty id', async () => {
    const resolveFn: ResolveDocumentsFn = vi.fn().mockResolvedValue(new Map());
    const data = {
      content: [{ type: 'Hero', props: { imageId: { id: '', title: 'Empty' } } }],
    };

    const result = await resolveDocumentReferencesInData(data, catalog, resolveFn);

    expect(result).toBe(data);
    expect(resolveFn).not.toHaveBeenCalled();
  });
});
