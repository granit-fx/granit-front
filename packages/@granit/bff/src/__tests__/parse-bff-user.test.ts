import { describe, expect, it } from 'vitest';

import { parseBffSessionResponse } from '../validation/parse-bff-user.js';

const validIsoDate = '2026-12-31T23:59:59Z';

const validBase = {
  authenticated: true as const,
  sub: 'user-1',
  name: 'Jane Doe',
  email: 'jane@example.com',
  roles: ['Reader'],
  sessionExpiresAt: validIsoDate,
};

describe('parseBffSessionResponse', () => {
  describe('unauthenticated', () => {
    it('accepts { authenticated: false }', () => {
      const r = parseBffSessionResponse({ authenticated: false });
      expect(r).toEqual({ success: true, data: { authenticated: false } });
    });

    it('ignores extra fields on unauthenticated response', () => {
      const r = parseBffSessionResponse({ authenticated: false, extra: 'noise' });
      expect(r.success).toBe(true);
    });
  });

  describe('tenant user (isHost: false)', () => {
    it('accepts a complete tenant user payload', () => {
      const r = parseBffSessionResponse({
        ...validBase,
        isHost: false,
        tenantId: 'acme',
      });
      expect(r.success).toBe(true);
      if (r.success && r.data.authenticated) {
        expect(r.data.isHost).toBe(false);
        if (!r.data.isHost) {
          expect(r.data.tenantId).toBe('acme');
        }
      }
    });

    it('rejects a tenant user with missing tenantId', () => {
      const r = parseBffSessionResponse({
        ...validBase,
        isHost: false,
      });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.issues.some((i) => i.includes('tenantId'))).toBe(true);
      }
    });

    it('rejects a tenant user with empty tenantId', () => {
      const r = parseBffSessionResponse({
        ...validBase,
        isHost: false,
        tenantId: '',
      });
      expect(r.success).toBe(false);
    });
  });

  describe('host user (isHost: true)', () => {
    it('accepts a host user without tenantId', () => {
      const r = parseBffSessionResponse({ ...validBase, isHost: true });
      expect(r.success).toBe(true);
      if (r.success && r.data.authenticated) {
        expect(r.data.isHost).toBe(true);
        // The discriminated union must NOT expose `tenantId` on the host branch.
        expect('tenantId' in r.data).toBe(false);
      }
    });

    it('rejects a host user carrying a tenantId (invariant violated)', () => {
      const r = parseBffSessionResponse({
        ...validBase,
        isHost: true,
        tenantId: 'acme',
      });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.issues.some((i) => i.includes('IsHost ⇔ tenantId'))).toBe(true);
      }
    });

    it('rejects a host user with non-null but empty tenantId still flagged', () => {
      const r = parseBffSessionResponse({
        ...validBase,
        isHost: true,
        tenantId: 'x',
      });
      expect(r.success).toBe(false);
    });
  });

  describe('malformed payloads', () => {
    it('rejects null', () => {
      expect(parseBffSessionResponse(null).success).toBe(false);
    });

    it('rejects a non-object (string)', () => {
      expect(parseBffSessionResponse('hello').success).toBe(false);
    });

    it('rejects when `authenticated` is missing', () => {
      const r = parseBffSessionResponse({ ...validBase, isHost: false, tenantId: 'acme' });
      delete (r as unknown as { authenticated?: unknown }).authenticated;
      // Build the actual rejection case
      const r2 = parseBffSessionResponse({
        sub: 'x',
        isHost: false,
        tenantId: 'a',
      });
      expect(r2.success).toBe(false);
    });

    it('rejects when isHost is not a boolean', () => {
      const r = parseBffSessionResponse({ ...validBase, isHost: 'yes', tenantId: 'acme' });
      expect(r.success).toBe(false);
    });

    it('rejects when sub is empty', () => {
      const r = parseBffSessionResponse({ ...validBase, sub: '', isHost: true });
      expect(r.success).toBe(false);
    });

    it('rejects when roles is not an array', () => {
      const r = parseBffSessionResponse({ ...validBase, roles: 'Reader', isHost: true });
      expect(r.success).toBe(false);
    });

    it('rejects when sessionExpiresAt is not ISO-8601', () => {
      const r = parseBffSessionResponse({
        ...validBase,
        sessionExpiresAt: 'last tuesday',
        isHost: true,
      });
      expect(r.success).toBe(false);
    });
  });
});
