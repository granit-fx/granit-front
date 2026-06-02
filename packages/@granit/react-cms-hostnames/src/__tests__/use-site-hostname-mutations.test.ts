import {
  addSiteHostname,
  clearSiteHostnamePrimary,
  removeSiteHostname,
  setSiteHostnamePrimary,
  verifySiteHostname,
} from '@granit/cms-hostnames';
import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useAddSiteHostname,
  useClearSiteHostnamePrimary,
  useRemoveSiteHostname,
  useSetSiteHostnamePrimary,
  useVerifySiteHostname,
} from '../hooks/use-site-hostname-mutations';
import { CmsHostnamesProvider } from '../providers/cms-hostnames-provider';

import type { ManagedHostnameResponse } from '@granit/hostnames';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/cms-hostnames', () => ({
  addSiteHostname: vi.fn(),
  removeSiteHostname: vi.fn(),
  setSiteHostnamePrimary: vi.fn(),
  clearSiteHostnamePrimary: vi.fn(),
  verifySiteHostname: vi.fn(),
}));

const hostname: ManagedHostnameResponse = {
  id: 'h-1',
  host: 'example.com',
  isPrimary: true,
  ownerType: 'cms.site',
  ownerId: 'site-1',
  tenantId: null,
  status: 'Active',
  verificationToken: null,
  expectedDnsRecords: [],
  lastCheckedAt: null,
  conflicts: [],
  failedCheckCount: 0,
  nextCheckAt: null,
  certificateStatus: 'Unprovisioned',
  certExpiresAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  createdBy: 'system',
  modifiedAt: null,
  modifiedBy: null,
  concurrencyStamp: 'stamp-1',
};

function createWrapper(client: AxiosInstance) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(CmsHostnamesProvider, { config: { client }, children })
    );
  };
}

describe('useAddSiteHostname', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls addSiteHostname', async () => {
    const client = createMockClient();
    vi.mocked(addSiteHostname).mockResolvedValue(hostname);

    const { result } = renderHook(() => useAddSiteHostname('site-1'), {
      wrapper: createWrapper(client),
    });
    result.current.mutate({ host: 'example.com', isPrimary: true });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(addSiteHostname).toHaveBeenCalledWith(client, '', 'site-1', {
      host: 'example.com',
      isPrimary: true,
    });
  });
});

describe('useRemoveSiteHostname', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls removeSiteHostname', async () => {
    const client = createMockClient();
    vi.mocked(removeSiteHostname).mockResolvedValue(undefined);

    const { result } = renderHook(() => useRemoveSiteHostname('site-1'), {
      wrapper: createWrapper(client),
    });
    result.current.mutate('h-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(removeSiteHostname).toHaveBeenCalledWith(client, '', 'site-1', 'h-1');
  });
});

describe('useSetSiteHostnamePrimary', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls setSiteHostnamePrimary', async () => {
    const client = createMockClient();
    vi.mocked(setSiteHostnamePrimary).mockResolvedValue(undefined);

    const { result } = renderHook(() => useSetSiteHostnamePrimary('site-1'), {
      wrapper: createWrapper(client),
    });
    result.current.mutate('h-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(setSiteHostnamePrimary).toHaveBeenCalledWith(client, '', 'site-1', 'h-1');
  });
});

describe('useClearSiteHostnamePrimary', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls clearSiteHostnamePrimary', async () => {
    const client = createMockClient();
    vi.mocked(clearSiteHostnamePrimary).mockResolvedValue(undefined);

    const { result } = renderHook(() => useClearSiteHostnamePrimary('site-1'), {
      wrapper: createWrapper(client),
    });
    result.current.mutate('h-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(clearSiteHostnamePrimary).toHaveBeenCalledWith(client, '', 'site-1', 'h-1');
  });
});

describe('useVerifySiteHostname', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls verifySiteHostname and returns updated hostname', async () => {
    const client = createMockClient();
    vi.mocked(verifySiteHostname).mockResolvedValue(hostname);

    const { result } = renderHook(() => useVerifySiteHostname('site-1'), {
      wrapper: createWrapper(client),
    });
    result.current.mutate('h-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(verifySiteHostname).toHaveBeenCalledWith(client, '', 'site-1', 'h-1');
    expect(result.current.data).toEqual(hostname);
  });
});
