import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  FOLDER_CONTRACTS_ID,
  createDocumentsHandlers,
  documentQueryMetadata,
  mockQuotaData,
} from '../testing/index';

const BASE = 'http://api.test/api/v1/documents';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('createDocumentsHandlers', () => {
  it('returns a non-empty handler array', () => {
    const handlers = createDocumentsHandlers({ basePath: BASE });
    expect(handlers.length).toBeGreaterThanOrEqual(25);
  });

  it('responds with the documentQueryMetadata at /documents/meta', async () => {
    server.use(...createDocumentsHandlers({ basePath: BASE }));
    const response = await fetch(`${BASE}/documents/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(documentQueryMetadata);
  });

  it('responds with the tenant quota payload at /quota', async () => {
    server.use(...createDocumentsHandlers({ basePath: BASE }));
    const response = await fetch(`${BASE}/quota`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(mockQuotaData);
  });

  it('filters /documents by folderId Eq', async () => {
    server.use(...createDocumentsHandlers({ basePath: BASE }));
    const response = await fetch(
      `${BASE}/documents?filter[folderId.Eq]=${FOLDER_CONTRACTS_ID}&filter[status.Eq]=Active&page=1&pageSize=50`
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { items: { folderId: string }[] };
    expect(body.items.length).toBeGreaterThan(0);
    for (const item of body.items) {
      expect(item.folderId).toBe(FOLDER_CONTRACTS_ID);
    }
  });

  it('exposes the expected query metadata columns (incl. the !72 audit/size/type grid columns)', () => {
    expect(documentQueryMetadata.columns).toHaveLength(8);
    expect(documentQueryMetadata.columns.map((c) => c.name)).toEqual([
      'name',
      'status',
      'folderId',
      'ownerId',
      'createdAt',
      'modifiedAt',
      'currentVersionSizeBytes',
      'currentVersionContentType',
    ]);
  });

  it('marks createdAt + modifiedAt as filterable and sortable (F11.1 advanced filters)', () => {
    for (const name of ['createdAt', 'modifiedAt']) {
      const column = documentQueryMetadata.columns.find((c) => c.name === name);
      expect(column?.isFilterable, name).toBe(true);
      expect(column?.isSortable, name).toBe(true);
    }
  });

  it('exposes the current-version size as a sortable/filterable Int64 column', () => {
    const size = documentQueryMetadata.columns.find((c) => c.name === 'currentVersionSizeBytes');
    expect(size?.type).toBe('Int64');
    expect(size?.isFilterable).toBe(true);
    expect(size?.isSortable).toBe(true);
  });
});
