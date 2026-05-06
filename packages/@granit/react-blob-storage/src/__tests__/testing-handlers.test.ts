import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { blobQueryMetadata, createBlobStorageHandlers } from '../testing/index.js';

const BASE = 'http://api.test/api/v1/blob-storage';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('createBlobStorageHandlers /meta', () => {
  it('responds with blobQueryMetadata at /blobs/meta', async () => {
    server.use(...createBlobStorageHandlers(BASE));
    const response = await fetch(`${BASE}/blobs/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(blobQueryMetadata);
  });
});

describe('createBlobStorageHandlers — upload flow', () => {
  it('initiate → PUT → confirm round-trip surfaces a Valid descriptor', async () => {
    server.use(...createBlobStorageHandlers(BASE));

    // Initiate
    const initiateResponse = await fetch(`${BASE}/blobs/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        containerName: 'avatars',
        fileName: 'me.png',
        contentType: 'image/png',
        sizeBytes: 1234,
      }),
    });
    expect(initiateResponse.status).toBe(200);
    const ticket = (await initiateResponse.json()) as {
      blobId: string;
      uploadUrl: string;
      httpMethod: string;
    };
    expect(ticket.blobId).toMatch(/^avatars\//);
    expect(ticket.httpMethod).toBe('PUT');
    expect(ticket.uploadUrl).toContain('/_mock-upload-target');

    // Pre-signed PUT
    const putResponse = await fetch(ticket.uploadUrl, {
      method: 'PUT',
      body: 'fake-bytes',
    });
    expect(putResponse.status).toBe(200);

    // Confirm
    const confirmResponse = await fetch(
      `${BASE}/blobs/${encodeURIComponent(ticket.blobId)}/confirm`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ containerName: 'avatars' }),
      }
    );
    expect(confirmResponse.status).toBe(200);
    const confirmation = (await confirmResponse.json()) as {
      blobId: string;
      isValid: boolean;
      verifiedContentType: string | null;
      sizeBytes: number | null;
    };
    expect(confirmation.blobId).toBe(ticket.blobId);
    expect(confirmation.isValid).toBe(true);
    expect(confirmation.verifiedContentType).toBe('image/png');
    expect(confirmation.sizeBytes).toBe(1234);

    // Subsequent GET resolves the freshly-uploaded record.
    const getResponse = await fetch(`${BASE}/blobs/${encodeURIComponent(ticket.blobId)}`);
    expect(getResponse.status).toBe(200);
    const descriptor = (await getResponse.json()) as { id: string; status: number };
    expect(descriptor.id).toBe(ticket.blobId);
    expect(descriptor.status).toBe(2); // Valid
  });

  it('confirm fails when the blobId is unknown', async () => {
    server.use(...createBlobStorageHandlers(BASE));
    const response = await fetch(`${BASE}/blobs/unknown-id/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ containerName: 'avatars' }),
    });
    expect(response.status).toBe(404);
  });
});
