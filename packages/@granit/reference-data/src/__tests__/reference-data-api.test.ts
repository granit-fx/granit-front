import { axiosResponse, createMockClient } from '@granit/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createReferenceDataEntry,
  deactivateReferenceDataEntry,
  fetchReferenceDataChildren,
  fetchReferenceDataEntry,
  fetchReferenceDataList,
  updateReferenceDataEntry,
} from '../api/reference-data-api.js';

import type { ReferenceDataEntry } from '../types/index.js';

const BASE_PATH = '/api/v1/reference-data/country';

const mockEntry: ReferenceDataEntry = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  code: 'BE',
  labelEn: 'Belgium',
  labelFr: 'Belgique',
  labelNl: 'België',
  labelDe: 'Belgien',
  labelEs: 'Bélgica',
  labelIt: 'Belgio',
  labelPt: 'Bélgica',
  labelZh: '比利时',
  labelJa: 'ベルギー',
  labelPl: 'Belgia',
  labelTr: 'Belçika',
  labelKo: '벨기에',
  labelSv: 'Belgien',
  labelCs: 'Belgie',
  label: 'Belgium',
  isActive: true,
  sortOrder: 1,
  validFrom: null,
  validTo: null,
  parentCode: null,
  extraProperties: null,
};

describe('fetchReferenceDataList', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends GET to basePath with params', async () => {
    const client = createMockClient();
    const pagedResult = { items: [mockEntry], totalCount: 1 };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(pagedResult));

    const result = await fetchReferenceDataList(client, BASE_PATH, {
      activeOnly: true,
      search: 'bel',
    });

    expect(client.get).toHaveBeenCalledWith(BASE_PATH, {
      params: { activeOnly: true, search: 'bel' },
    });
    expect(result.items).toHaveLength(1);
    expect(result.totalCount).toBe(1);
  });

  it('sends GET without params when none provided', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ items: [], totalCount: 0 }));

    await fetchReferenceDataList(client, BASE_PATH);

    expect(client.get).toHaveBeenCalledWith(BASE_PATH, { params: undefined });
  });
});

describe('fetchReferenceDataEntry', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends GET to basePath/{code}', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(mockEntry));

    const result = await fetchReferenceDataEntry(client, BASE_PATH, 'BE');

    expect(client.get).toHaveBeenCalledWith(`${BASE_PATH}/BE`);
    expect(result.code).toBe('BE');
  });

  it('encodes special characters in code', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(mockEntry));

    await fetchReferenceDataEntry(client, BASE_PATH, 'A/B');

    expect(client.get).toHaveBeenCalledWith(`${BASE_PATH}/A%2FB`);
  });
});

describe('createReferenceDataEntry', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends POST to basePath with payload', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(undefined));

    const payload = { code: 'BE', labelEn: 'Belgium', labelFr: 'Belgique' };
    await createReferenceDataEntry(client, BASE_PATH, payload);

    expect(client.post).toHaveBeenCalledWith(BASE_PATH, payload);
  });

  it('returns void', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(undefined));

    const result = await createReferenceDataEntry(client, BASE_PATH, {
      code: 'BE',
      labelEn: 'Belgium',
    });

    expect(result).toBeUndefined();
  });
});

describe('updateReferenceDataEntry', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends PUT to basePath/{code} with payload', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue(axiosResponse(undefined));

    const payload = { labelEn: 'Belgium (updated)', isActive: true };
    await updateReferenceDataEntry(client, BASE_PATH, 'BE', payload);

    expect(client.put).toHaveBeenCalledWith(`${BASE_PATH}/BE`, payload);
  });

  it('returns void', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue(axiosResponse(undefined));

    const result = await updateReferenceDataEntry(client, BASE_PATH, 'BE', {
      labelEn: 'Belgium',
    });

    expect(result).toBeUndefined();
  });
});

describe('fetchReferenceDataChildren', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends GET to basePath/{code}/children', async () => {
    const client = createMockClient();
    const children = [{ ...mockEntry, code: 'CHILD-1', parentCode: 'BE' }];
    vi.mocked(client.get).mockResolvedValue(axiosResponse(children));

    const result = await fetchReferenceDataChildren(client, BASE_PATH, 'BE');

    expect(client.get).toHaveBeenCalledWith(`${BASE_PATH}/BE/children`);
    expect(result).toHaveLength(1);
    expect(result[0]!.parentCode).toBe('BE');
  });

  it('encodes special characters in parent code', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([]));

    await fetchReferenceDataChildren(client, BASE_PATH, 'A/B');

    expect(client.get).toHaveBeenCalledWith(`${BASE_PATH}/A%2FB/children`);
  });

  it('returns an empty array when no children exist', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([]));

    const result = await fetchReferenceDataChildren(client, BASE_PATH, 'LEAF');

    expect(result).toEqual([]);
  });
});

describe('deactivateReferenceDataEntry', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends DELETE to basePath/{code}', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

    await deactivateReferenceDataEntry(client, BASE_PATH, 'BE');

    expect(client.delete).toHaveBeenCalledWith(`${BASE_PATH}/BE`);
  });

  it('returns void', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

    const result = await deactivateReferenceDataEntry(client, BASE_PATH, 'BE');

    expect(result).toBeUndefined();
  });
});
