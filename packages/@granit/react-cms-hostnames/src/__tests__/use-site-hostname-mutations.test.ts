import { addSiteHostname, removeSiteHostname, verifySiteHostname } from '@granit/cms-hostnames';
import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockHostnames } from '@granit/react-cms-hostnames/testing';

import {
  useAddSiteHostname,
  useRemoveSiteHostname,
  useVerifySiteHostname,
} from '../hooks/use-site-hostname-mutations';
import { CmsHostnamesProvider } from '../providers/cms-hostnames-provider';

import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/cms-hostnames', () => ({
  addSiteHostname: vi.fn(),
  removeSiteHostname: vi.fn(),
  verifySiteHostname: vi.fn(),
}));

const hostname = mockHostnames[0]!;

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
    result.current.mutate(hostname.id);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(removeSiteHostname).toHaveBeenCalledWith(client, '', 'site-1', hostname.id);
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
    result.current.mutate(hostname.id);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(verifySiteHostname).toHaveBeenCalledWith(client, '', 'site-1', hostname.id);
    expect(result.current.data).toEqual(hostname);
  });
});
