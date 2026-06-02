import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { mockHostnames } from '../testing/data';
import { createHostnamesHandlers } from '../testing/handlers';

import type { CheckAvailabilityResponse, ManagedHostnameResponse } from '@granit/hostnames';

const BASE = 'http://api.test/api/hostnames';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('createHostnamesHandlers', () => {
  describe('GET /availability', () => {
    it('returns isAvailable true for unknown host', async () => {
      server.use(...createHostnamesHandlers(BASE));
      const res = await fetch(`${BASE}/availability?host=brand-new.example.com`);
      expect(res.status).toBe(200);
      const data = (await res.json()) as CheckAvailabilityResponse;
      expect(data.isAvailable).toBe(true);
      expect(data.host).toBe('brand-new.example.com');
    });

    it('returns isAvailable false for seeded host', async () => {
      server.use(...createHostnamesHandlers(BASE));
      const takenHost = mockHostnames[0]!.host;
      const res = await fetch(`${BASE}/availability?host=${takenHost}`);
      expect(res.status).toBe(200);
      const data = (await res.json()) as CheckAvailabilityResponse;
      expect(data.isAvailable).toBe(false);
    });
  });

  describe('GET /', () => {
    it('returns a list of seeded hostnames', async () => {
      server.use(...createHostnamesHandlers(BASE));
      const res = await fetch(BASE);
      expect(res.status).toBe(200);
      const data = (await res.json()) as ManagedHostnameResponse[];
      expect(data.length).toBeGreaterThan(0);
    });

    it('filters by ownerType', async () => {
      server.use(...createHostnamesHandlers(BASE));
      const res = await fetch(`${BASE}?ownerType=cms.site`);
      const data = (await res.json()) as ManagedHostnameResponse[];
      expect(data.every((h) => h.ownerType === 'cms.site')).toBe(true);
    });
  });

  describe('POST /', () => {
    it('creates a new hostname with Pending status', async () => {
      server.use(...createHostnamesHandlers(BASE));
      const res = await fetch(BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: 'new.mysite.com',
          ownerType: 'cms.site',
          ownerId: 'owner-new',
          isPrimary: false,
        }),
      });
      expect(res.status).toBe(201);
      const data = (await res.json()) as ManagedHostnameResponse;
      expect(data.host).toBe('new.mysite.com');
      expect(data.status).toBe('Pending');
      expect(data.id).toBeDefined();
    });
  });

  describe('GET /{id}', () => {
    it('returns a single hostname', async () => {
      server.use(...createHostnamesHandlers(BASE));
      const id = mockHostnames[0]!.id;
      const res = await fetch(`${BASE}/${id}`);
      expect(res.status).toBe(200);
      const data = (await res.json()) as ManagedHostnameResponse;
      expect(data.id).toBe(id);
    });

    it('returns 404 for unknown ID', async () => {
      server.use(...createHostnamesHandlers(BASE));
      const res = await fetch(`${BASE}/non-existent-id`);
      expect(res.status).toBe(404);
    });
  });

  describe('POST /{id}/primary', () => {
    it('sets isPrimary and returns 204', async () => {
      server.use(...createHostnamesHandlers(BASE));
      const id = mockHostnames[1]!.id;
      const res = await fetch(`${BASE}/${id}/primary`, { method: 'POST' });
      expect(res.status).toBe(204);

      const updated = await fetch(`${BASE}/${id}`);
      const data = (await updated.json()) as ManagedHostnameResponse;
      expect(data.isPrimary).toBe(true);
    });
  });

  describe('DELETE /{id}/primary', () => {
    it('clears isPrimary and returns 204', async () => {
      server.use(...createHostnamesHandlers(BASE));
      const id = mockHostnames[0]!.id;
      const res = await fetch(`${BASE}/${id}/primary`, { method: 'DELETE' });
      expect(res.status).toBe(204);

      const updated = await fetch(`${BASE}/${id}`);
      const data = (await updated.json()) as ManagedHostnameResponse;
      expect(data.isPrimary).toBe(false);
    });
  });

  describe('DELETE /{id}', () => {
    it('deletes a hostname and returns 204', async () => {
      server.use(...createHostnamesHandlers(BASE));
      const id = mockHostnames[1]!.id;
      const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
      expect(res.status).toBe(204);
    });
  });

  describe('POST /{id}/verify-now', () => {
    it('returns 202 with updated hostname in Verifying status', async () => {
      server.use(...createHostnamesHandlers(BASE));
      const id = mockHostnames[0]!.id;
      const res = await fetch(`${BASE}/${id}/verify-now`, { method: 'POST' });
      expect(res.status).toBe(202);
      const data = (await res.json()) as ManagedHostnameResponse;
      expect(data.status).toBe('Verifying');
    });
  });
});
