import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ImportButton } from '../components/import/import-button';

import { renderDataExchange } from './test-utils';

describe('ImportButton', () => {
  it('should render with the default label', () => {
    renderDataExchange(<ImportButton onImport={vi.fn()} />);
    expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument();
  });

  it('should render a custom label', () => {
    renderDataExchange(<ImportButton label="Import from CSV" onImport={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Import from CSV' })).toBeInTheDocument();
  });

  it('should call onImport when clicked', async () => {
    const onImport = vi.fn();
    const { user } = renderDataExchange(<ImportButton onImport={onImport} />);
    await user.click(screen.getByRole('button', { name: /import/i }));
    expect(onImport).toHaveBeenCalledTimes(1);
  });

  it('should expose the data-slot attribute', () => {
    renderDataExchange(<ImportButton onImport={vi.fn()} />);
    expect(document.querySelector('[data-slot="import-button"]')).toBeInTheDocument();
  });
});
