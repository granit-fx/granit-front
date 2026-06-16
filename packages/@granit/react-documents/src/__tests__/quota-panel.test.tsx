import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { QuotaPanel } from '../components/quota-panel.tsx';
import { DocumentsProvider } from '../providers/documents-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { TenantStorageQuotaResponse } from '@granit/documents';
import type { ReactNode } from 'react';

const quota: TenantStorageQuotaResponse = {
  limitBytes: 10 * 1024 * 1024 * 1024,
  usageBytes: 5 * 1024 * 1024 * 1024,
  percentUsed: 50,
  updatedAt: toISODateString('2026-05-01T08:00:00Z'),
};

function createWrapper(client: AxiosInstance) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const qc = createTestQueryClient();
    return (
      <QueryClientProvider client={qc}>
        <DocumentsProvider config={{ client }}>{children}</DocumentsProvider>
      </QueryClientProvider>
    );
  };
}

describe('QuotaPanel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the loading label', () => {
    const client = createMockClient();
    vi.mocked(client.get).mockReturnValue(new Promise(() => {}));

    render(<QuotaPanel />, { wrapper: createWrapper(client) });

    expect(screen.getByText('Loading quota…')).toBeInTheDocument();
  });

  it('renders formatted usage and limit', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: quota });

    render(<QuotaPanel />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('5.0 GB')).toBeInTheDocument());
    expect(screen.getByText('10.0 GB')).toBeInTheDocument();
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('50');
  });
});
