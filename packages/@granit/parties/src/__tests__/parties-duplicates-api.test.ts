import { createMockClient } from '@granit/testing';
import { toEntityId } from '@granit/types';
import { describe, expect, it, vi } from 'vitest';

import {
  dismissPartyDuplicate,
  listDuplicatesForParty,
  mergePartyFromDuplicate,
} from '../api/parties-duplicates-api.js';

import type {
  PartyDuplicateCandidateId,
  PartyDuplicateCandidateResponse,
  PartyDuplicateMergeRequest,
  PartyId,
  PartyMergeResponse,
} from '../types/index.js';

const basePath = '/api/v1/parties';
const partyId: PartyId = toEntityId<'Party'>('00000000-0000-0000-0000-000000000001');
const candidatePartyId: PartyId = toEntityId<'Party'>('00000000-0000-0000-0000-000000000002');
const duplicateRowId: PartyDuplicateCandidateId = toEntityId<'PartyDuplicateCandidate'>('dup-001');

const sampleCandidate: PartyDuplicateCandidateResponse = {
  id: duplicateRowId,
  partyId,
  candidateId: candidatePartyId,
  score: 0.92,
  tier: 'Deterministic',
  signals: [{ kind: 'TaxIdEqual', score: 1.0 }],
  dismissedAt: null,
  createdAt: '2026-04-26T08:00:00Z',
  updatedAt: '2026-04-27T02:00:00Z',
};

describe('parties-duplicates-api', () => {
  describe('listDuplicatesForParty', () => {
    it('GETs {basePath}/{id}/duplicate-candidates', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [sampleCandidate] });

      const result = await listDuplicatesForParty(client, basePath, partyId);

      expect(client.get).toHaveBeenCalledWith(`${basePath}/${partyId}/duplicate-candidates`);
      expect(result).toEqual([sampleCandidate]);
    });

    it('returns an empty array when the party has no candidates', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [] });

      const result = await listDuplicatesForParty(client, basePath, partyId);

      expect(result).toEqual([]);
    });
  });

  describe('dismissPartyDuplicate', () => {
    it('POSTs {basePath}/duplicates/{id}/dismiss with no body', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: undefined });

      await dismissPartyDuplicate(client, basePath, duplicateRowId);

      expect(client.post).toHaveBeenCalledWith(`${basePath}/duplicates/${duplicateRowId}/dismiss`);
    });
  });

  describe('mergePartyFromDuplicate', () => {
    const mergeResponse: PartyMergeResponse = {
      survivorId: partyId,
      loserId: candidatePartyId,
      conflicts: [],
      rewriteCounts: { 'Invoice.PartyId': 5 },
      dryRun: false,
    };

    it('POSTs the merge request without an Idempotency-Key by default', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: mergeResponse });

      const request: PartyDuplicateMergeRequest = {
        survivorId: partyId,
        choices: { Name: 'Survivor' },
        reason: 'Confirmed by ops review',
      };

      const result = await mergePartyFromDuplicate(client, basePath, duplicateRowId, request);

      expect(client.post).toHaveBeenCalledWith(
        `${basePath}/duplicates/${duplicateRowId}/merge`,
        request,
        undefined
      );
      expect(result).toEqual(mergeResponse);
    });

    it('forwards the Idempotency-Key header when provided', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: mergeResponse });

      const idempotencyKey = '11111111-2222-4333-8444-555555555555';
      const request: PartyDuplicateMergeRequest = { survivorId: partyId };

      await mergePartyFromDuplicate(client, basePath, duplicateRowId, request, idempotencyKey);

      expect(client.post).toHaveBeenCalledWith(
        `${basePath}/duplicates/${duplicateRowId}/merge`,
        request,
        { headers: { 'Idempotency-Key': idempotencyKey } }
      );
    });
  });
});
