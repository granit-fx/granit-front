import { CertificateStatus, ManagedHostnameStatus } from '@granit/hostnames';
import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  addSiteHostname,
  checkSiteHostnameAvailability,
  clearSiteHostnamePrimary,
  listSiteHostnames,
  removeSiteHostname,
  setSiteHostnamePrimary,
  verifySiteHostname,
} from '../api/hostnames.js';

import type { ManagedHostnameResponse } from '@granit/hostnames';

const BASE = 'https://cms.example.com';
const SITE_ID = 'site-1';
const HOSTNAMES_BASE = `${BASE}/api/cms/sites/site-1/hostnames`;

const hostname: ManagedHostnameResponse = {
  id: 'h-1',
  host: 'www.acme.com',
  ownerType: 'cms.site',
  ownerId: SITE_ID,
  tenantId: null,
  status: ManagedHostnameStatus.Active,
  isPrimary: true,
  verificationToken: null,
  expectedDnsRecords: [],
  lastCheckedAt: '2026-06-01T10:00:00Z',
  conflicts: [],
  failedCheckCount: 0,
  nextCheckAt: null,
  certificateStatus: CertificateStatus.Secured,
  certExpiresAt: '2027-06-01T10:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
  createdBy: 'user@example.com',
  modifiedAt: '2026-06-01T10:00:00Z',
  modifiedBy: 'user@example.com',
  concurrencyStamp: 'stamp-abc',
};

describe('listSiteHostnames', () => {
  it('calls listHostnames with ownerType=cms.site and ownerId=siteId', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([hostname]));

    const result = await listSiteHostnames(client, BASE, SITE_ID);

    expect(client.get).toHaveBeenCalledWith(HOSTNAMES_BASE, {
      params: { ownerType: 'cms.site', ownerId: SITE_ID },
    });
    expect(result).toEqual([hostname]);
  });

  it('passes maxResults param', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([]));

    await listSiteHostnames(client, BASE, SITE_ID, { maxResults: 50 });

    expect(client.get).toHaveBeenCalledWith(HOSTNAMES_BASE, {
      params: { ownerType: 'cms.site', ownerId: SITE_ID, maxResults: 50 },
    });
  });
});

describe('addSiteHostname', () => {
  it('creates hostname with ownerType=cms.site', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(hostname));

    const result = await addSiteHostname(client, BASE, SITE_ID, {
      host: 'www.acme.com',
      isPrimary: true,
    });

    expect(client.post).toHaveBeenCalledWith(HOSTNAMES_BASE, {
      host: 'www.acme.com',
      isPrimary: true,
      ownerType: 'cms.site',
      ownerId: SITE_ID,
    });
    expect(result).toEqual(hostname);
  });
});

describe('removeSiteHostname', () => {
  it('DELETE /{hostnameId}', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue({ status: 204, data: undefined });

    await removeSiteHostname(client, BASE, SITE_ID, 'h-1');

    expect(client.delete).toHaveBeenCalledWith(`${HOSTNAMES_BASE}/h-1`);
  });
});

describe('setSiteHostnamePrimary', () => {
  it('POST /{hostnameId}/primary', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue({ status: 204, data: undefined });

    await setSiteHostnamePrimary(client, BASE, SITE_ID, 'h-1');

    expect(client.post).toHaveBeenCalledWith(`${HOSTNAMES_BASE}/h-1/primary`);
  });
});

describe('clearSiteHostnamePrimary', () => {
  it('DELETE /{hostnameId}/primary', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue({ status: 204, data: undefined });

    await clearSiteHostnamePrimary(client, BASE, SITE_ID, 'h-1');

    expect(client.delete).toHaveBeenCalledWith(`${HOSTNAMES_BASE}/h-1/primary`);
  });
});

describe('checkSiteHostnameAvailability', () => {
  it('GET /availability?host=', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse({ host: 'www.acme.com', isAvailable: true })
    );

    const result = await checkSiteHostnameAvailability(client, BASE, SITE_ID, 'www.acme.com');

    expect(client.get).toHaveBeenCalledWith(`${HOSTNAMES_BASE}/availability`, {
      params: { host: 'www.acme.com' },
    });
    expect(result).toEqual({ host: 'www.acme.com', isAvailable: true });
  });
});

describe('verifySiteHostname', () => {
  it('POST /{hostnameId}/verify-now', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(hostname));

    const result = await verifySiteHostname(client, BASE, SITE_ID, 'h-1');

    expect(client.post).toHaveBeenCalledWith(`${HOSTNAMES_BASE}/h-1/verify-now`);
    expect(result).toEqual(hostname);
  });
});
