import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  cleanupOrphans,
  confirmUpload,
  deleteBlob,
  getBlob,
  getDownloadUrl,
  initiateUpload,
} from '../api/blob-storage-api';
import { BlobStatus } from '../types/index';

import type {
  BlobCleanupOrphansResponse,
  BlobConfirmUploadResponse,
  BlobDescriptorResponse,
  BlobDownloadUrlResponse,
  BlobUploadInitiateResponse,
} from '../types/index';

const BASE = '/api/v1/blobs';

describe('blob-storage-api', () => {
  describe('initiateUpload', () => {
    it('sends POST to /upload with request body', async () => {
      const client = createMockClient();
      const response: BlobUploadInitiateResponse = {
        blobId: 'abc-123',
        uploadUrl: 'https://s3.example.com/presigned',
        httpMethod: 'PUT',
        expiresAt: '2026-03-20T12:00:00Z',
        requiredHeaders: { 'Content-Type': 'image/png' },
      };
      vi.mocked(client.post).mockResolvedValueOnce({ data: response });

      const result = await initiateUpload(client, BASE, {
        containerName: 'medical-images',
        fileName: 'scan.png',
        contentType: 'image/png',
        sizeBytes: 1024,
      });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/upload`, {
        containerName: 'medical-images',
        fileName: 'scan.png',
        contentType: 'image/png',
        sizeBytes: 1024,
      });
      expect(result).toEqual(response);
    });
  });

  describe('confirmUpload', () => {
    it('sends POST to /{id}/confirm', async () => {
      const client = createMockClient();
      const response: BlobConfirmUploadResponse = {
        blobId: 'abc-123',
        isValid: true,
        status: BlobStatus.Valid,
        verifiedContentType: 'image/png',
        sizeBytes: 1024,
        rejectionReason: null,
      };
      vi.mocked(client.post).mockResolvedValueOnce({ data: response });

      const result = await confirmUpload(client, BASE, 'abc-123', {
        containerName: 'medical-images',
      });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/abc-123/confirm`, {
        containerName: 'medical-images',
      });
      expect(result).toEqual(response);
    });

    it('encodes blob ID with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: {} });

      await confirmUpload(client, BASE, 'id with spaces', {
        containerName: 'docs',
      });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/id%20with%20spaces/confirm`, {
        containerName: 'docs',
      });
    });
  });

  describe('getDownloadUrl', () => {
    it('sends POST to /{id}/download-url', async () => {
      const client = createMockClient();
      const response: BlobDownloadUrlResponse = {
        downloadUrl: 'https://s3.example.com/download',
        expiresAt: '2026-03-20T12:05:00Z',
      };
      vi.mocked(client.post).mockResolvedValueOnce({ data: response });

      const result = await getDownloadUrl(client, BASE, 'abc-123', {
        containerName: 'medical-images',
        fileName: 'report.pdf',
      });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/abc-123/download-url`, {
        containerName: 'medical-images',
        fileName: 'report.pdf',
      });
      expect(result).toEqual(response);
    });
  });

  describe('deleteBlob', () => {
    it('sends DELETE to /{id} with body', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValueOnce({ data: undefined });

      await deleteBlob(client, BASE, 'abc-123', {
        containerName: 'medical-images',
        deletionReason: 'RGPD Art. 17 erasure',
      });

      expect(client.delete).toHaveBeenCalledWith(`${BASE}/abc-123`, {
        data: {
          containerName: 'medical-images',
          deletionReason: 'RGPD Art. 17 erasure',
        },
      });
    });

    it('sends DELETE without deletionReason when omitted', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValueOnce({ data: undefined });

      await deleteBlob(client, BASE, 'abc-123', {
        containerName: 'docs',
      });

      expect(client.delete).toHaveBeenCalledWith(`${BASE}/abc-123`, {
        data: { containerName: 'docs' },
      });
    });
  });

  describe('getBlob', () => {
    it('sends GET to /{id} with containerName query param', async () => {
      const client = createMockClient();
      const descriptor: BlobDescriptorResponse = {
        id: 'abc-123',
        containerName: 'medical-images',
        originalFileName: 'scan.png',
        declaredContentType: 'image/png',
        verifiedContentType: 'image/png',
        declaredSizeBytes: 1024,
        actualSizeBytes: 1020,
        status: BlobStatus.Valid,
        rejectionReason: null,
        deletionReason: null,
        createdAt: '2026-03-20T10:00:00Z',
        validatedAt: '2026-03-20T10:00:05Z',
        deletedAt: null,
      };
      vi.mocked(client.get).mockResolvedValueOnce({ data: descriptor });

      const result = await getBlob(client, BASE, 'abc-123', 'medical-images');

      expect(client.get).toHaveBeenCalledWith(`${BASE}/abc-123`, {
        params: { containerName: 'medical-images' },
      });
      expect(result).toEqual(descriptor);
    });

    it('encodes blob ID with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: {} });

      await getBlob(client, BASE, 'id/slash', 'docs');

      expect(client.get).toHaveBeenCalledWith(`${BASE}/id%2Fslash`, {
        params: { containerName: 'docs' },
      });
    });
  });

  describe('cleanupOrphans', () => {
    it('sends POST to /cleanup-orphans', async () => {
      const client = createMockClient();
      const response: BlobCleanupOrphansResponse = { cleanedCount: 5 };
      vi.mocked(client.post).mockResolvedValueOnce({ data: response });

      const result = await cleanupOrphans(client, BASE);

      expect(client.post).toHaveBeenCalledWith(`${BASE}/cleanup-orphans`);
      expect(result).toEqual(response);
    });
  });
});
