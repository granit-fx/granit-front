import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ExportButton } from '../components/export/export-button';

import { renderDataExchange } from './test-utils';

describe('ExportButton', () => {
  it('should render with the default label', () => {
    renderDataExchange(<ExportButton onExport={vi.fn()} />);
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
  });

  it('should render a custom label', () => {
    renderDataExchange(<ExportButton label="Export to CSV" onExport={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Export to CSV' })).toBeInTheDocument();
  });

  it('should call onExport when clicked', async () => {
    const onExport = vi.fn();
    const { user } = renderDataExchange(<ExportButton onExport={onExport} />);
    await user.click(screen.getByRole('button', { name: /export/i }));
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it('should expose the data-slot attribute', () => {
    renderDataExchange(<ExportButton onExport={vi.fn()} />);
    expect(document.querySelector('[data-slot="export-button"]')).toBeInTheDocument();
  });
});
