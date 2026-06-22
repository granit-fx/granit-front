import { screen } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ExportListPage } from '../export-list-page';

import { renderDataExchange } from './test-utils';

// The page consumes the @granit/react-data-exchange hooks directly. ExportProvider
// is stubbed to a passthrough; useGranitClient still resolves from the real
// GranitClientProvider supplied by the render helper.
vi.mock('@granit/react-data-exchange', () => ({
  ExportProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useExportJobs: () => ({ data: { items: [], totalCount: 0 }, isLoading: false, refetch: vi.fn() }),
}));

describe('ExportListPage', () => {
  it('should render the page title', () => {
    renderDataExchange(<ExportListPage />);
    expect(screen.getByRole('heading', { name: 'Export' })).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    renderDataExchange(<ExportListPage />);
    expect(document.querySelector('[data-slot="export-list-page"]')).toBeInTheDocument();
  });
});
