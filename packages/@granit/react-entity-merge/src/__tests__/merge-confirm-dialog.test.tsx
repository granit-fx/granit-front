import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MergeConfirmDialog } from '../components/merge-confirm-dialog.js';

import type { MergeConfirmDialogLabels } from '../components/merge-confirm-dialog.js';

const labels: MergeConfirmDialogLabels = {
  title: 'Confirm merge',
  body: 'This is irreversible.',
  confirm: 'Merge',
  cancel: 'Cancel',
};

describe('MergeConfirmDialog', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <MergeConfirmDialog open={false} onConfirm={() => {}} onCancel={() => {}} labels={labels} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders an accessible dialog when open', () => {
    render(<MergeConfirmDialog open onConfirm={() => {}} onCancel={() => {}} labels={labels} />);
    expect(screen.getByRole('dialog', { name: 'Confirm merge' })).toBeInTheDocument();
    expect(screen.getByText('This is irreversible.')).toBeInTheDocument();
  });

  it('invokes the confirm and cancel callbacks', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<MergeConfirmDialog open onConfirm={onConfirm} onCancel={onCancel} labels={labels} />);
    fireEvent.click(screen.getByRole('button', { name: 'Merge' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('disables both buttons while pending', () => {
    render(
      <MergeConfirmDialog open onConfirm={() => {}} onCancel={() => {}} labels={labels} isPending />
    );
    expect((screen.getByRole('button', { name: 'Merge' }) as HTMLButtonElement).disabled).toBe(
      true
    );
    expect((screen.getByRole('button', { name: 'Cancel' }) as HTMLButtonElement).disabled).toBe(
      true
    );
  });
});
