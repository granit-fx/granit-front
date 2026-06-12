import { describe, expect, it } from 'vitest';

import { parseBffSessionList } from '../validation/parse-bff-session-list';

const validCreatedAt = '2026-03-23T08:15:00Z';

function entry(overrides: Record<string, unknown> = {}) {
  return {
    sessionId: 'ab12...cd34',
    isCurrent: true,
    createdAt: validCreatedAt,
    userAgent: 'Mozilla/5.0',
    lastAccessedAt: '2026-03-23T09:00:00Z',
    location: { city: 'Brussels', countryCode: 'BE', latitude: 50.85, longitude: 4.35 },
    ipAddress: '203.0.113.xxx',
    riskLevel: 'Low',
    ...overrides,
  };
}

describe('parseBffSessionList', () => {
  describe('envelope', () => {
    it('rejects a non-object body', () => {
      const r = parseBffSessionList('not json');
      expect(r.success).toBe(false);
    });

    it('rejects a missing/invalid sessions array', () => {
      const r = parseBffSessionList({ sessions: 'nope' });
      expect(r).toEqual({ success: false, issues: ['field "sessions" must be an array'] });
    });

    it('accepts an empty list', () => {
      const r = parseBffSessionList({ sessions: [] });
      expect(r).toEqual({ success: true, data: [] });
    });
  });

  describe('normalization', () => {
    it('maps a complete entry through unchanged', () => {
      const r = parseBffSessionList({ sessions: [entry()] });
      expect(r.success).toBe(true);
      if (!r.success) return;
      expect(r.data).toHaveLength(1);
      expect(r.data[0]).toEqual({
        sessionId: 'ab12...cd34',
        isCurrent: true,
        createdAt: validCreatedAt,
        userAgent: 'Mozilla/5.0',
        lastAccessedAt: '2026-03-23T09:00:00Z',
        location: {
          city: 'Brussels',
          region: null,
          country: null,
          countryCode: 'BE',
          latitude: 50.85,
          longitude: 4.35,
        },
        ipAddress: '203.0.113.xxx',
        riskLevel: 'Low',
      });
    });

    it('coerces absent nullable fields to null', () => {
      const r = parseBffSessionList({
        sessions: [{ sessionId: 'aa11...bb22', isCurrent: false, createdAt: validCreatedAt }],
      });
      expect(r.success).toBe(true);
      if (!r.success) return;
      expect(r.data[0]).toMatchObject({
        userAgent: null,
        lastAccessedAt: null,
        location: null,
        ipAddress: null,
        riskLevel: null,
      });
    });

    it('treats isCurrent as strictly boolean true', () => {
      const r = parseBffSessionList({
        sessions: [entry({ isCurrent: 'yes' })],
      });
      expect(r.success && r.data[0]!.isCurrent).toBe(false);
    });
  });

  describe('hardening untrusted fields', () => {
    it('bounds an oversized user-agent', () => {
      const huge = 'x'.repeat(5000);
      const r = parseBffSessionList({ sessions: [entry({ userAgent: huge })] });
      expect(r.success).toBe(true);
      if (!r.success) return;
      expect(r.data[0]!.userAgent).toHaveLength(512);
    });

    it('drops a non-string user-agent to null', () => {
      const r = parseBffSessionList({ sessions: [entry({ userAgent: { evil: true } })] });
      expect(r.success && r.data[0]!.userAgent).toBeNull();
    });

    it('rejects an unknown risk level', () => {
      const r = parseBffSessionList({ sessions: [entry({ riskLevel: 'Critical' })] });
      expect(r.success && r.data[0]!.riskLevel).toBeNull();
    });

    it('drops non-finite coordinates', () => {
      const r = parseBffSessionList({
        sessions: [
          entry({ location: { latitude: Number.NaN, longitude: 'x', country: 'Belgium' } }),
        ],
      });
      expect(r.success).toBe(true);
      if (!r.success) return;
      expect(r.data[0]!.location).toEqual({
        city: null,
        region: null,
        country: 'Belgium',
        countryCode: null,
        latitude: null,
        longitude: null,
      });
    });

    it('collapses an all-null location to null', () => {
      const r = parseBffSessionList({
        sessions: [entry({ location: { city: 123, latitude: 'nope' } })],
      });
      expect(r.success && r.data[0]!.location).toBeNull();
    });
  });

  describe('per-entry resilience', () => {
    it('drops entries without a usable sessionId or createdAt but keeps the rest', () => {
      const r = parseBffSessionList({
        sessions: [
          entry(),
          { sessionId: '', isCurrent: false, createdAt: validCreatedAt },
          { sessionId: 'cd34...ef56', isCurrent: false, createdAt: 'not-a-date' },
          'garbage',
          entry({ sessionId: 'gh78...ij90' }),
        ],
      });
      expect(r.success).toBe(true);
      if (!r.success) return;
      expect(r.data.map((s) => s.sessionId)).toEqual(['ab12...cd34', 'gh78...ij90']);
    });
  });
});
