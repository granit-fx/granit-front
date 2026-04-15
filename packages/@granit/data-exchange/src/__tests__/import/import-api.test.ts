import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  cancelImportJob,
  confirmMappings,
  downloadCorrectionFile,
  dryRunImport,
  executeImport,
  getImportJob,
  listImportJobs,
  getImportReport,
  previewImport,
  uploadImportFile,
} from '../../import/api/import-api.js';

const BASE = '/api/v1/data-exchange';

describe('import-api', () => {
  it('uploadImportFile sends POST with multipart/form-data', async () => {
    const client = createMockClient();
    const job = { id: '1', definitionName: 'Test', status: 'Created' };
    vi.mocked(client.post).mockResolvedValueOnce({ data: job });

    const file = new File(['content'], 'test.csv', { type: 'text/csv' });
    const result = await uploadImportFile(client, BASE, file, 'Test');

    expect(client.post).toHaveBeenCalledWith(`${BASE}/import`, expect.any(FormData), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    expect(result).toEqual(job);
  });

  it('previewImport calls POST /import/{jobId}/preview', async () => {
    const client = createMockClient();
    const preview = {
      headers: ['Col1'],
      previewRows: [['val']],
      suggestions: [],
      fieldMetadata: [],
    };
    vi.mocked(client.post).mockResolvedValueOnce({ data: preview });

    const result = await previewImport(client, BASE, 'job-1');
    expect(client.post).toHaveBeenCalledWith(`${BASE}/import/job-1/preview`);
    expect(result).toEqual(preview);
  });

  it('confirmMappings calls PUT /import/{jobId}/mappings', async () => {
    const client = createMockClient();
    const request = {
      mappings: [{ sourceColumn: 'Col1', targetProperty: 'Email', confidence: 'Manual' as const }],
    };

    await confirmMappings(client, BASE, 'job-1', request);
    expect(client.put).toHaveBeenCalledWith(`${BASE}/import/job-1/mappings`, request);
  });

  it('confirmMappings forwards saveForReuse flag', async () => {
    const client = createMockClient();
    const request = {
      mappings: [{ sourceColumn: 'Col1', targetProperty: 'Email', confidence: 'Manual' as const }],
      saveForReuse: true,
    };

    await confirmMappings(client, BASE, 'job-1', request);
    expect(client.put).toHaveBeenCalledWith(`${BASE}/import/job-1/mappings`, request);
  });

  it('executeImport calls POST /import/{jobId}/execute', async () => {
    const client = createMockClient();
    await executeImport(client, BASE, 'job-1');
    expect(client.post).toHaveBeenCalledWith(`${BASE}/import/job-1/execute`);
  });

  it('dryRunImport calls POST /import/{jobId}/dry-run', async () => {
    const client = createMockClient();
    const report = { importJobId: 'job-1', totalRows: 10, failedRows: 0 };
    vi.mocked(client.post).mockResolvedValueOnce({ data: report });

    const result = await dryRunImport(client, BASE, 'job-1');
    expect(client.post).toHaveBeenCalledWith(`${BASE}/import/job-1/dry-run`);
    expect(result).toEqual(report);
  });

  it('getImportJob calls GET /import/{jobId}', async () => {
    const client = createMockClient();
    const job = { id: 'job-1', status: 'Executing' };
    vi.mocked(client.get).mockResolvedValueOnce({ data: job });

    const result = await getImportJob(client, BASE, 'job-1');
    expect(client.get).toHaveBeenCalledWith(`${BASE}/import/job-1`);
    expect(result).toEqual(job);
  });

  it('cancelImportJob calls DELETE /import/{jobId}', async () => {
    const client = createMockClient();
    await cancelImportJob(client, BASE, 'job-1');
    expect(client.delete).toHaveBeenCalledWith(`${BASE}/import/job-1`);
  });

  it('getImportReport calls GET /import/{jobId}/report', async () => {
    const client = createMockClient();
    const report = { importJobId: 'job-1', totalRows: 100 };
    vi.mocked(client.get).mockResolvedValueOnce({ data: report });

    const result = await getImportReport(client, BASE, 'job-1');
    expect(client.get).toHaveBeenCalledWith(`${BASE}/import/job-1/report`);
    expect(result).toEqual(report);
  });

  it('downloadCorrectionFile calls GET /import/{jobId}/correction-file with blob', async () => {
    const client = createMockClient();
    const blob = new Blob(['data']);
    vi.mocked(client.get).mockResolvedValueOnce({
      data: blob,
      headers: { 'content-disposition': 'attachment; filename="correction.csv"' },
    });

    const result = await downloadCorrectionFile(client, BASE, 'job-1');
    expect(client.get).toHaveBeenCalledWith(`${BASE}/import/job-1/correction-file`, {
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

    await getImportJob(client, BASE, 'job with spaces');
    expect(client.get).toHaveBeenCalledWith(`${BASE}/import/job%20with%20spaces`);
  });

  it('listImportJobs calls GET /import/jobs without params', async () => {
    const client = createMockClient();
    const page = { items: [], totalCount: 0 };
    vi.mocked(client.get).mockResolvedValueOnce({ data: page });

    const result = await listImportJobs(client, BASE);
    expect(client.get).toHaveBeenCalledWith(`${BASE}/import/jobs`, { params: undefined });
    expect(result).toEqual(page);
  });

  it('listImportJobs forwards query params', async () => {
    const client = createMockClient();
    const page = { items: [{ id: '1' }], totalCount: 1 };
    vi.mocked(client.get).mockResolvedValueOnce({ data: page });
    const params = { status: 'Completed', page: 1, pageSize: 10 };

    const result = await listImportJobs(client, BASE, params);
    expect(client.get).toHaveBeenCalledWith(`${BASE}/import/jobs`, { params });
    expect(result).toEqual(page);
  });
});
