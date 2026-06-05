import { checkSiteHostnameAvailability, listSiteHostnames } from '@granit/cms-hostnames';
import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useSiteHostnameAvailability, useSiteHostnames } from '../hooks/use-site-hostnames';
import { CmsHostnamesProvider } from '../providers/cms-hostnames-provider';

import type { SiteHostnameAvailabilityResponse, SiteHostnameResponse } from '@granit/cms-hostnames';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/cms-hostnames', () => ({
  listSiteHostnames: vi.fn(),
  checkSiteHostnameAvailability: vi.fn(),
}));

const hostname: SiteHostnameResponse = {
  id: 'h-1',
  host: 'example.com',
  status: 'Active',
  isPrimary: true,
  expectedDnsRecords: [],
  lastCheckedAt: null,
  certificateStatus: 'Unprovisioned',
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

describe('useSiteHostnames', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches hostnames for a site', async () => {
    const client = createMockClient();
    vi.mocked(listSiteHostnames).mockResolvedValue([hostname]);

    const { result } = renderHook(() => useSiteHostnames('site-1'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listSiteHostnames).toHaveBeenCalledWith(client, '', 'site-1');
    expect(result.current.data).toEqual([hostname]);
  });

  it('is disabled when siteId is empty', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useSiteHostnames(''), { wrapper: createWrapper(client) });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useSiteHostnameAvailability', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('checks hostname availability', async () => {
    const client = createMockClient();
    const avail: SiteHostnameAvailabilityResponse = { host: 'example.com', available: true };
    vi.mocked(checkSiteHostnameAvailability).mockResolvedValue(avail);

    const { result } = renderHook(() => useSiteHostnameAvailability('site-1', 'example.com'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(checkSiteHostnameAvailability).toHaveBeenCalledWith(client, '', 'site-1', 'example.com');
    expect(result.current.data).toEqual(avail);
  });

  it('is disabled when host is empty', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useSiteHostnameAvailability('site-1', ''), {
      wrapper: createWrapper(client),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });
});
