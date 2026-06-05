import {
  activateTenant,
  createTenant,
  deactivateTenant,
  getTenant,
  updateTenant,
} from '@granit/multi-tenancy';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  useActivateTenant,
  useCreateTenant,
  useDeactivateTenant,
  useTenantDetail,
  useUpdateTenant,
} from '../hooks/use-tenant-admin';
import { TenantAdminProvider } from '../providers/tenant-admin-provider';

import type { AdminTenant, CreateTenantRequest, UpdateTenantRequest } from '@granit/multi-tenancy';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/multi-tenancy', async () => {
  const actual = await vi.importActual('@granit/multi-tenancy');
  return {
    ...actual,
    getTenant: vi.fn(),
    createTenant: vi.fn(),
    updateTenant: vi.fn(),
    activateTenant: vi.fn(),
    deactivateTenant: vi.fn(),
  };
});

const mockClient = {} as AxiosInstance;

function wrap(client: QueryClient, basePath?: string) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <TenantAdminProvider config={{ client: mockClient, basePath }}>
        {children}
      </TenantAdminProvider>
    </QueryClientProvider>
  );
}

const SAMPLE_TENANT: AdminTenant = {
  id: 'tenant-1',
  name: 'Tenant 1',
  identifier: 'tenant-1',
  contactEmail: 'admin@tenant-1.test',
  activated: true,
  jurisdiction: 'BE',
  createdAt: '2026-01-01T00:00:00.000Z',
  concurrencyStamp: 'stamp-1',
} as unknown as AdminTenant;

beforeEach(() => {
  vi.mocked(getTenant).mockReset();
  vi.mocked(createTenant).mockReset();
  vi.mocked(updateTenant).mockReset();
  vi.mocked(activateTenant).mockReset();
  vi.mocked(deactivateTenant).mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useTenantDetail', () => {
  it('is disabled when id is empty', () => {
    renderHook(() => useTenantDetail(''), {
      wrapper: wrap(new QueryClient()),
    });

    expect(getTenant).not.toHaveBeenCalled();
  });

  it('calls getTenant when id is provided', async () => {
    vi.mocked(getTenant).mockResolvedValue(SAMPLE_TENANT);

    const { result } = renderHook(() => useTenantDetail('tenant-1'), {
      wrapper: wrap(new QueryClient(), '/admin'),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getTenant).toHaveBeenCalledWith(mockClient, '/admin', 'tenant-1');
  });
});

describe('mutations invalidate the tenant list', () => {
  it('useCreateTenant calls createTenant', async () => {
    vi.mocked(createTenant).mockResolvedValue(SAMPLE_TENANT);

    const { result } = renderHook(() => useCreateTenant(), {
      wrapper: wrap(new QueryClient(), '/admin'),
    });

    const req: CreateTenantRequest = { name: 'X' } as CreateTenantRequest;
    await act(async () => {
      await result.current.mutateAsync(req);
    });

    expect(createTenant).toHaveBeenCalledWith(mockClient, '/admin', req);
  });

  it('useUpdateTenant calls updateTenant', async () => {
    vi.mocked(updateTenant).mockResolvedValue(undefined);

    const { result } = renderHook(() => useUpdateTenant(), {
      wrapper: wrap(new QueryClient(), '/admin'),
    });

    const req: UpdateTenantRequest = { name: 'X' } as UpdateTenantRequest;
    await act(async () => {
      await result.current.mutateAsync({ id: 'tenant-1', request: req });
    });

    expect(updateTenant).toHaveBeenCalledWith(mockClient, '/admin', 'tenant-1', req);
  });

  it('useActivateTenant calls activateTenant', async () => {
    vi.mocked(activateTenant).mockResolvedValue(undefined);

    const { result } = renderHook(() => useActivateTenant(), {
      wrapper: wrap(new QueryClient(), '/admin'),
    });

    await act(async () => {
      await result.current.mutateAsync('tenant-1');
    });

    expect(activateTenant).toHaveBeenCalledWith(mockClient, '/admin', 'tenant-1');
  });

  it('useDeactivateTenant calls deactivateTenant', async () => {
    vi.mocked(deactivateTenant).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeactivateTenant(), {
      wrapper: wrap(new QueryClient(), '/admin'),
    });

    await act(async () => {
      await result.current.mutateAsync('tenant-1');
    });

    expect(deactivateTenant).toHaveBeenCalledWith(mockClient, '/admin', 'tenant-1');
  });
});
