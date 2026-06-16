import { axiosResponse, createMockClient } from '@granit/testing';
import { toISODateString } from '@granit/types';
import { describe, expect, it, vi } from 'vitest';

import {
  addSiteHostname,
  checkSiteHostnameAvailability,
  listSiteHostnames,
  removeSiteHostname,
  verifySiteHostname,
} from '../api/hostnames';

import type { SiteHostnameAvailabilityResponse, SiteHostnameResponse } from '../types/index';

const BASE = 'https://cms.example.com';
const SITE_ID = 'site-1';
const HOSTNAMES_BASE = `${BASE}/api/cms/sites/site-1/hostnames`;

const hostname: SiteHostnameResponse = {
  id: 'h-1',
  host: 'www.acme.com',
  status: 'Active',
  isPrimary: true,
  expectedDnsRecords: [{ recordType: 'Cname', name: 'www', value: 'edge.granit.app' }],
  lastCheckedAt: toISODateString('2026-06-01T10:00:00Z'),
  certificateStatus: 'Secured',
};

describe('listSiteHostnames', () => {
  it('GET /api/cms/sites/{siteId}/hostnames (bare array, no params)', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([hostname]));

    const result = await listSiteHostnames(client, BASE, SITE_ID);

    expect(client.get).toHaveBeenCalledWith(HOSTNAMES_BASE);
    expect(result).toEqual([hostname]);
  });
});

describe('checkSiteHostnameAvailability', () => {
  it('GET /availability?host= returns { host, available }', async () => {
    const client = createMockClient();
    const avail: SiteHostnameAvailabilityResponse = { host: 'www.acme.com', available: true };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(avail));

    const result = await checkSiteHostnameAvailability(client, BASE, SITE_ID, 'www.acme.com');

    expect(client.get).toHaveBeenCalledWith(`${HOSTNAMES_BASE}/availability`, {
      params: { host: 'www.acme.com' },
    });
    expect(result).toEqual(avail);
  });
});

describe('addSiteHostname', () => {
  it('POST / with body { host, isPrimary } only (no owner fields)', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(hostname));

    const result = await addSiteHostname(client, BASE, SITE_ID, {
      host: 'www.acme.com',
      isPrimary: true,
    });

    expect(client.post).toHaveBeenCalledWith(HOSTNAMES_BASE, {
      host: 'www.acme.com',
      isPrimary: true,
    });
    expect(result).toEqual(hostname);
  });

  it('POST / accepts a request without isPrimary', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(hostname));

    await addSiteHostname(client, BASE, SITE_ID, { host: 'www.acme.com' });

    expect(client.post).toHaveBeenCalledWith(HOSTNAMES_BASE, { host: 'www.acme.com' });
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

describe('verifySiteHostname', () => {
  it('POST /{hostnameId}/verify-now returns the updated hostname', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(hostname));

    const result = await verifySiteHostname(client, BASE, SITE_ID, 'h-1');

    expect(client.post).toHaveBeenCalledWith(`${HOSTNAMES_BASE}/h-1/verify-now`);
    expect(result).toEqual(hostname);
  });
});
