import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  deleteExportPreset,
  listExportPresets,
  saveExportPreset,
} from '../../export/api/preset-api.js';

const BASE = '/api/v1/data-exchange';

describe('preset-api', () => {
  it('listExportPresets calls GET /metadata/presets/{definitionName}', async () => {
    const client = createMockClient();
    const presets = [
      {
        definitionName: 'Test',
        presetName: 'Monthly',
        selectedFields: ['Email'],
        format: 'xlsx',
        includeIdForImport: false,
      },
    ];
    vi.mocked(client.get).mockResolvedValueOnce({ data: presets });
    const result = await listExportPresets(client, BASE, 'Test');
    expect(client.get).toHaveBeenCalledWith(`${BASE}/metadata/presets/Test`);
    expect(result).toEqual(presets);
  });

  it('saveExportPreset calls POST /metadata/presets', async () => {
    const client = createMockClient();
    const request = {
      definitionName: 'Test',
      presetName: 'Monthly',
      selectedFields: ['Email', 'Name'],
      format: 'csv',
      includeIdForImport: true,
    };
    await saveExportPreset(client, BASE, request);
    expect(client.post).toHaveBeenCalledWith(`${BASE}/metadata/presets`, request);
  });

  it('deleteExportPreset calls DELETE /metadata/presets/{definitionName}/{presetName}', async () => {
    const client = createMockClient();
    await deleteExportPreset(client, BASE, 'Test', 'Monthly');
    expect(client.delete).toHaveBeenCalledWith(`${BASE}/metadata/presets/Test/Monthly`);
  });

  it('deleteExportPreset encodes names', async () => {
    const client = createMockClient();
    await deleteExportPreset(client, BASE, 'My Export', 'Monthly Report');
    expect(client.delete).toHaveBeenCalledWith(`${BASE}/metadata/presets/My%20Export/Monthly%20Report`);
  });
});
