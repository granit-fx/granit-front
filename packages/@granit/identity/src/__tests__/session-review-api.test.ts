import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { getSessionReviewContext, submitSessionReview } from '../api/session-review-api';

import type { SessionReviewContextResponse, SessionReviewResultResponse } from '../types/index';

const basePath = '/api/v1';

describe('session-review-api', () => {
  describe('getSessionReviewContext', () => {
    it('should GET {basePath}/sessions/review with the token as a query param', async () => {
      const client = createMockClient();
      const context: SessionReviewContextResponse = { country: 'Belgium', decision: null };
      vi.mocked(client.get).mockResolvedValue(axiosResponse(context));

      const result = await getSessionReviewContext(client, basePath, 'tok-123');

      expect(client.get).toHaveBeenCalledWith(`${basePath}/sessions/review`, {
        params: { token: 'tok-123' },
      });
      expect(result).toEqual(context);
    });

    it('should return an already-reviewed context unchanged', async () => {
      const client = createMockClient();
      const context: SessionReviewContextResponse = { country: 'France', decision: 'Denied' };
      vi.mocked(client.get).mockResolvedValue(axiosResponse(context));

      const result = await getSessionReviewContext(client, basePath, 'tok-reviewed');

      expect(result).toEqual(context);
    });
  });

  describe('submitSessionReview', () => {
    it('should POST {basePath}/sessions/review with the token and decision', async () => {
      const client = createMockClient();
      const outcome: SessionReviewResultResponse = { decision: 'Confirmed', applied: true };
      vi.mocked(client.post).mockResolvedValue(axiosResponse(outcome));

      const result = await submitSessionReview(client, basePath, {
        token: 'tok-123',
        decision: 'Confirmed',
      });

      expect(client.post).toHaveBeenCalledWith(`${basePath}/sessions/review`, {
        token: 'tok-123',
        decision: 'Confirmed',
      });
      expect(result).toEqual(outcome);
    });

    it('should surface applied=false for an idempotent re-submission', async () => {
      const client = createMockClient();
      const outcome: SessionReviewResultResponse = { decision: 'Denied', applied: false };
      vi.mocked(client.post).mockResolvedValue(axiosResponse(outcome));

      const result = await submitSessionReview(client, basePath, {
        token: 'tok-123',
        decision: 'Denied',
      });

      expect(result.applied).toBe(false);
      expect(result.decision).toBe('Denied');
    });
  });
});
