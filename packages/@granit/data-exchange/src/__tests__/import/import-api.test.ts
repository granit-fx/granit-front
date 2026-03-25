import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  cancelImportJob,
  confirmMappings,
  downloadCorrectionFile,
  dryRunImport,
  executeImport,
  fetchImportJob,
  fetchImportJobs,
  fetchImportReport,
  previewImport,
  uploadImportFile,
} from '../../import/api/import-api.js';

const BASE = '/api/v1/data-exchange/import';

describe('import-api', () => {
  it('uploadImportFile sends POST with multipart/form-data', async () => {
    const client = createMockClient();
    const job = { id: '1', definitionName: 'Test', status: 'Created' };
    vi.mocked(client.post).mockResolvedValueOnce({ data: job });

    const file = new File(['content'], 'test.csv', { type: 'text/csv' });
    const result = await uploadImportFile(client, BASE, file, 'Test');

    expect(client.post).toHaveBeenCalledWith(BASE, expect.any(FormData), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    expect(result).toEqual(job);
  });

  it('previewImport calls POST /{jobId}/preview', async () => {
    const client = createMockClient();
    const preview = {
      headers: ['Col1'],
      previewRows: [['val']],
      suggestions: [],
      fieldMetadata: [],
    };
    vi.mocked(client.post).mockResolvedValueOnce({ data: preview });

    const result = await previewImport(client, BASE, 'job-1');
    expect(client.post).toHaveBeenCalledWith(`${BASE}/job-1/preview`);
    expect(result).toEqual(preview);
  });

  it('confirmMappings calls PUT /{jobId}/mappings', async () => {
    const client = createMockClient();
    const request = {
      mappings: [{ sourceColumn: 'Col1', targetProperty: 'Email', confidence: 'Manual' as const }],
    };

    await confirmMappings(client, BASE, 'job-1', request);
    expect(client.put).toHaveBeenCalledWith(`${BASE}/job-1/mappings`, request);
  });

  it('confirmMappings forwards saveForReuse flag', async () => {
    const client = createMockClient();
    const request = {
      mappings: [{ sourceColumn: 'Col1', targetProperty: 'Email', confidence: 'Manual' as const }],
      saveForReuse: true,
    };

    await confirmMappings(client, BASE, 'job-1', request);
    expect(client.put).toHaveBeenCalledWith(`${BASE}/job-1/mappings`, request);
  });

  it('executeImport calls POST /{jobId}/execute', async () => {
    const client = createMockClient();
    await executeImport(client, BASE, 'job-1');
    expect(client.post).toHaveBeenCalledWith(`${BASE}/job-1/execute`);
  });

  it('dryRunImport calls POST /{jobId}/dry-run', async () => {
    const client = createMockClient();
    const report = { importJobId: 'job-1', totalRows: 10, failedRows: 0 };
    vi.mocked(client.post).mockResolvedValueOnce({ data: report });

    const result = await dryRunImport(client, BASE, 'job-1');
    expect(client.post).toHaveBeenCalledWith(`${BASE}/job-1/dry-run`);
    expect(result).toEqual(report);
  });

  it('fetchImportJob calls GET /{jobId}', async () => {
    const client = createMockClient();
    const job = { id: 'job-1', status: 'Executing' };
    vi.mocked(client.get).mockResolvedValueOnce({ data: job });

    const result = await fetchImportJob(client, BASE, 'job-1');
    expect(client.get).toHaveBeenCalledWith(`${BASE}/job-1`);
    expect(result).toEqual(job);
  });

  it('cancelImportJob calls DELETE /{jobId}', async () => {
    const client = createMockClient();
    await cancelImportJob(client, BASE, 'job-1');
    expect(client.delete).toHaveBeenCalledWith(`${BASE}/job-1`);
  });

  it('fetchImportReport calls GET /{jobId}/report', async () => {
    const client = createMockClient();
    const report = { importJobId: 'job-1', totalRows: 100 };
    vi.mocked(client.get).mockResolvedValueOnce({ data: report });

    const result = await fetchImportReport(client, BASE, 'job-1');
    expect(client.get).toHaveBeenCalledWith(`${BASE}/job-1/report`);
    expect(result).toEqual(report);
  });

  it('downloadCorrectionFile calls GET /{jobId}/correction-file with blob', async () => {
    const client = createMockClient();
    const blob = new Blob(['data']);
    vi.mocked(client.get).mockResolvedValueOnce({
      data: blob,
      headers: { 'content-disposition': 'attachment; filename="correction.csv"' },
    });

    const result = await downloadCorrectionFile(client, BASE, 'job-1');
    expect(client.get).toHaveBeenCalledWith(`${BASE}/job-1/correction-file`, {
      responseType: 'blob',
    });
    expect(result.blob).toBe(blob);
    expect(result.fileName).toBe('correction.csv');
  });

  it('downloadCorrectionFile falls back to "correction" when no content-disposition', async () => {
    const client = createMockClient();
    const blob = new Blob(['data']);
    vi.mocked(client.get).mockResolvedValueOnce({ data: blob, headers: {} });

    const result = await downloadCorrectionFile(client, BASE, 'job-1');
    expect(result.fileName).toBe('correction');
  });

  it('encodes jobId with special characters', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: {} });

    await fetchImportJob(client, BASE, 'job with spaces');
    expect(client.get).toHaveBeenCalledWith(`${BASE}/job%20with%20spaces`);
  });

  it('fetchImportJobs calls GET /jobs without params', async () => {
    const client = createMockClient();
    const page = { items: [], totalCount: 0 };
    vi.mocked(client.get).mockResolvedValueOnce({ data: page });

    const result = await fetchImportJobs(client, BASE);
    expect(client.get).toHaveBeenCalledWith(`${BASE}/jobs`, { params: undefined });
    expect(result).toEqual(page);
  });

  it('fetchImportJobs forwards query params', async () => {
    const client = createMockClient();
    const page = { items: [{ id: '1' }], totalCount: 1 };
    vi.mocked(client.get).mockResolvedValueOnce({ data: page });
    const params = { status: 'Completed', page: 1, pageSize: 10 };

    const result = await fetchImportJobs(client, BASE, params);
    expect(client.get).toHaveBeenCalledWith(`${BASE}/jobs`, { params });
    expect(result).toEqual(page);
  });
});
