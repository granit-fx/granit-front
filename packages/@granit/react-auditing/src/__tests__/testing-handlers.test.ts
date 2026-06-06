import { createMswServer } from '@granit/testing/msw-server';
import { describe, expect, it } from 'vitest';

import {
  auditEntityChangeQueryMetadata,
  auditEntryQueryMetadata,
  createAuditEntityChangesHandlers,
  createAuditHandlers,
} from '../testing/index';

import type { AuditEntryDetailResponse, AuditPage } from '@granit/auditing';

const BASE = 'http://api.test/api/v1/auditing';
const server = createMswServer();

describe('createAuditHandlers — audit-entries', () => {
  it('serves query metadata at /audit-entries/meta', async () => {
    server.use(...createAuditHandlers(BASE));
    const response = await fetch(`${BASE}/audit-entries/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(auditEntryQueryMetadata);
  });

  it('lists entries newest-first', async () => {
    server.use(...createAuditHandlers(BASE));
    const response = await fetch(`${BASE}/audit-entries?page=1&pageSize=25`);
    const page = (await response.json()) as AuditPage;
    expect(page.totalCount).toBe(10);
    expect(page.items.length).toBe(10);
    // Newest first: timestamps are already in descending order.
    const timestamps = page.items.map((e) => e.timestamp as string);
    expect(timestamps).toEqual([...timestamps].sort((a, b) => b.localeCompare(a)));
  });

  it('filters by query-engine category filter', async () => {
    server.use(...createAuditHandlers(BASE));
    const response = await fetch(`${BASE}/audit-entries?filter[category.eq]=ConfigurationChange`);
    const page = (await response.json()) as AuditPage;
    expect(page.totalCount).toBe(3);
    expect(page.items.every((e) => e.category === 'ConfigurationChange')).toBe(true);
  });

  it('returns a detail entry without entityChangeCount', async () => {
    server.use(...createAuditHandlers(BASE));
    const response = await fetch(`${BASE}/audit-entries/audit-001`);
    expect(response.status).toBe(200);
    const detail = (await response.json()) as AuditEntryDetailResponse & {
      entityChangeCount?: number;
    };
    expect(detail.entityChangeCount).toBeUndefined();
    expect(detail.entityChanges.length).toBeGreaterThan(0);
  });

  it('returns 404 for an unknown detail id', async () => {
    server.use(...createAuditHandlers(BASE));
    const response = await fetch(`${BASE}/audit-entries/does-not-exist`);
    expect(response.status).toBe(404);
  });

  it('returns correlated detail entries', async () => {
    server.use(...createAuditHandlers(BASE));
    const response = await fetch(`${BASE}/audit-entries/correlation/corr-1`);
    const details = (await response.json()) as AuditEntryDetailResponse[];
    expect(Array.isArray(details)).toBe(true);
    expect(details.length).toBe(2);
    expect(details[0]).toHaveProperty('entityChanges');
  });

  it('returns a per-entity audit trail page', async () => {
    server.use(...createAuditHandlers(BASE));
    const response = await fetch(`${BASE}/audit-entries/entity/User/user-001`);
    const page = (await response.json()) as AuditPage;
    expect(page.totalCount).toBe(10);
  });

  it('responds 204 to pseudonymize', async () => {
    server.use(...createAuditHandlers(BASE));
    const response = await fetch(`${BASE}/audit-entries/pseudonymize/user-1`, { method: 'POST' });
    expect(response.status).toBe(204);
  });
});

describe('createAuditEntityChangesHandlers — audit-entity-changes', () => {
  it('serves query metadata at /audit-entity-changes/meta', async () => {
    server.use(...createAuditEntityChangesHandlers(BASE));
    const response = await fetch(`${BASE}/audit-entity-changes/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(auditEntityChangeQueryMetadata);
  });

  it('lists entity changes and filters by entityType', async () => {
    server.use(...createAuditEntityChangesHandlers(BASE));
    const all = await (await fetch(`${BASE}/audit-entity-changes`)).json();
    expect(all.totalCount).toBe(3);

    const filtered = await (
      await fetch(`${BASE}/audit-entity-changes?filter[entityType.eq]=User`)
    ).json();
    expect(filtered.totalCount).toBe(2);
  });
});
