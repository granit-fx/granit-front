import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  createExportJob,
  downloadExportFile,
  fetchExportDefinitions,
  fetchExportFields,
  fetchExportJobs,
  fetchExportJobStatus,
} from '../../export/api/export-api.js';

const BASE = '/api/v1/data-exchange';

describe('export-api', () => {
  it('fetchExportDefinitions calls GET /definitions', async () => {
    const client = createMockClient();
    const defs = [{ name: 'Test', entityType: 'Entity', supportedFormats: ['xlsx'] }];
    vi.mocked(client.get).mockResolvedValueOnce({ data: defs });
    const result = await fetchExportDefinitions(client, BASE);
    expect(client.get).toHaveBeenCalledWith(`${BASE}/metadata/definitions`);
    expect(result).toEqual(defs);
  });

  it('fetchExportFields calls GET /definitions/{name}/fields', async () => {
    const client = createMockClient();
    const fields = [
      {
        propertyPath: 'Email',
        clrTypeName: 'String',
        header: 'Email',
        format: null,
        order: 1,
        isNavigation: false,
      },
    ];
    vi.mocked(client.get).mockResolvedValueOnce({ data: fields });
    const result = await fetchExportFields(client, BASE, 'Test');
    expect(client.get).toHaveBeenCalledWith(`${BASE}/metadata/definitions/Test/fields`);
    expect(result).toEqual(fields);
  });

  it('fetchExportFields encodes definition name', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: [] });
    await fetchExportFields(client, BASE, 'My Export');
    expect(client.get).toHaveBeenCalledWith(`${BASE}/metadata/definitions/My%20Export/fields`);
  });

  it('createExportJob calls POST /jobs', async () => {
    const client = createMockClient();
    const job = { id: '1', definitionName: 'Test', format: 'xlsx', status: 'Queued' };
    vi.mocked(client.post).mockResolvedValueOnce({ data: job });
    const request = {
      definitionName: 'Test',
      format: 'xlsx',
      selectedFields: ['Email'],
      includeIdForImport: false,
      sort: null,
      filter: null,
      presets: null,
      search: null,
    };
    const result = await createExportJob(client, BASE, request);
    expect(client.post).toHaveBeenCalledWith(`${BASE}/export/jobs`, request);
    expect(result).toEqual(job);
  });

  it('fetchExportJobStatus calls GET /jobs/{jobId}', async () => {
    const client = createMockClient();
    const job = { id: 'abc', status: 'Exporting' };
    vi.mocked(client.get).mockResolvedValueOnce({ data: job });
    const result = await fetchExportJobStatus(client, BASE, 'abc');
    expect(client.get).toHaveBeenCalledWith(`${BASE}/export/jobs/abc`);
    expect(result).toEqual(job);
  });

  it('downloadExportFile calls GET /jobs/{jobId}/download with blob responseType', async () => {
    const client = createMockClient();
    const blob = new Blob(['data']);
    vi.mocked(client.get).mockResolvedValueOnce({
      data: blob,
      headers: { 'content-disposition': 'attachment; filename="export.xlsx"' },
    });
    const result = await downloadExportFile(client, BASE, 'abc');
    expect(client.get).toHaveBeenCalledWith(`${BASE}/export/jobs/abc/download`, { responseType: 'blob' });
    expect(result.blob).toBe(blob);
    expect(result.fileName).toBe('export.xlsx');
  });

  it('downloadExportFile falls back to "export" when no content-disposition', async () => {
    const client = createMockClient();
    const blob = new Blob(['data']);
    vi.mocked(client.get).mockResolvedValueOnce({ data: blob, headers: {} });
    const result = await downloadExportFile(client, BASE, 'abc');
    expect(result.fileName).toBe('export');
  });

  it('fetchExportJobs calls GET /jobs without params', async () => {
    const client = createMockClient();
    const page = { items: [], totalCount: 0 };
    vi.mocked(client.get).mockResolvedValueOnce({ data: page });
    const result = await fetchExportJobs(client, BASE);
    expect(client.get).toHaveBeenCalledWith(`${BASE}/export/jobs`, { params: undefined });
    expect(result).toEqual(page);
  });

  it('fetchExportJobs forwards query params', async () => {
    const client = createMockClient();
    const page = { items: [{ id: '1' }], totalCount: 1 };
    vi.mocked(client.get).mockResolvedValueOnce({ data: page });
    const params = { status: 'Completed', page: 1, pageSize: 10 };
    const result = await fetchExportJobs(client, BASE, params);
    expect(client.get).toHaveBeenCalledWith(`${BASE}/export/jobs`, { params });
    expect(result).toEqual(page);
  });
});
