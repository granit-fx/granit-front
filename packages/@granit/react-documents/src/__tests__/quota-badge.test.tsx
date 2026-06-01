import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { QuotaBadge } from '../components/quota-badge.tsx';
import { DocumentsProvider } from '../providers/documents-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { TenantStorageQuotaResponse } from '@granit/documents';
import type { ReactNode } from 'react';

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

describe('QuotaBadge', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the loading placeholder', () => {
    const client = createMockClient();
    vi.mocked(client.get).mockReturnValue(new Promise(() => {}));

    render(<QuotaBadge />, { wrapper: createWrapper(client) });

    expect(screen.getByText('…')).toBeInTheDocument();
  });

  it('renders a one-liner usage summary', async () => {
    const client = createMockClient();
    const quota: TenantStorageQuotaResponse = {
      limitBytes: 10 * 1024 * 1024 * 1024,
      usageBytes: 5 * 1024 * 1024 * 1024 + Math.round(0.2 * 1024 * 1024 * 1024),
      percentUsed: 52,
      updatedAt: '2026-05-01T08:00:00Z',
    };
    vi.mocked(client.get).mockResolvedValue({ data: quota });

    render(<QuotaBadge />, { wrapper: createWrapper(client) });

    await waitFor(() =>
      expect(screen.getByText(/5\.2 GB \/ 10\.0 GB \(52%\)/)).toBeInTheDocument()
    );
  });
});
