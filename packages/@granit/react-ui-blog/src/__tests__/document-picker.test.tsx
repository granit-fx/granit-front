import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DocumentPickerButton } from '../components/document-picker-button';

import { renderWithProviders } from './test-utils';

vi.mock('@granit/react-documents', () => ({
  DocumentSearchPalette: ({
    open,
    onPickDocument,
  }: {
    open: boolean;
    onPickDocument: (id: string) => void;
  }) => (open ? <button onClick={() => onPickDocument('picked-doc')}>mock-pick</button> : null),
}));

afterEach(() => vi.clearAllMocks());

describe('DocumentPickerButton', () => {
  it('opens the palette and reports the picked id', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <DocumentPickerButton
        value={null}
        onChange={onChange}
        pickLabel="Select…"
        clearLabel="Remove"
      />
    );
    await user.click(screen.getByRole('button', { name: 'Select…' }));
    await user.click(screen.getByRole('button', { name: 'mock-pick' }));
    expect(onChange).toHaveBeenCalledWith('picked-doc');
  });

  it('shows the selected id and clears it', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <DocumentPickerButton
        value="doc-1"
        onChange={onChange}
        pickLabel="Select…"
        clearLabel="Remove"
      />
    );
    expect(screen.getByText('doc-1')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
