import { screen } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ImportListPage } from '../import-list-page';

import { renderDataExchange } from './test-utils';

// The page consumes the @granit/react-data-exchange hooks directly. ImportProvider
// is stubbed to a passthrough; useGranitClient still resolves from the real
// GranitClientProvider supplied by the render helper.
vi.mock('@granit/react-data-exchange', () => ({
  ImportProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useImportJobs: () => ({ data: { items: [], totalCount: 0 }, isLoading: false, refetch: vi.fn() }),
  useImportReport: () => ({
    report: { data: null, isLoading: false },
    downloadCorrection: vi.fn(),
  }),
}));

describe('ImportListPage', () => {
  it('should render the page title', () => {
    renderDataExchange(<ImportListPage />);
    expect(screen.getByRole('heading', { name: 'Import' })).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    renderDataExchange(<ImportListPage />);
    expect(document.querySelector('[data-slot="import-list-page"]')).toBeInTheDocument();
  });
});
