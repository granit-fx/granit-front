import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ConfirmActionDialog } from '../confirm-action-dialog/confirm-action-dialog';

import { renderWithI18n, setupI18n } from './test-utils';

import type { ReactNode } from 'react';

interface HarnessProps {
  readonly open?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly onConfirm?: () => void;
  readonly description?: ReactNode;
  readonly isPending?: boolean;
  readonly busyLabel?: ReactNode;
  readonly cancelLabel?: ReactNode;
  readonly tone?: 'default' | 'destructive';
}

function Harness({
  open = true,
  onOpenChange = vi.fn(),
  onConfirm = vi.fn(),
  description,
  isPending,
  busyLabel,
  cancelLabel,
  tone,
}: HarnessProps) {
  return (
    <ConfirmActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Revoke key"
      description={description}
      confirmLabel="Revoke"
      busyLabel={busyLabel}
      cancelLabel={cancelLabel}
      isPending={isPending}
      tone={tone}
      onConfirm={onConfirm}
    />
  );
}

beforeAll(setupI18n);

describe('ConfirmActionDialog', () => {
  it('renders the title and confirm button when open', () => {
    renderWithI18n(<Harness />);
    expect(screen.getByText('Revoke key')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Revoke' })).toBeInTheDocument();
  });

  it('does not render the dialog content when closed', () => {
    renderWithI18n(<Harness open={false} />);
    expect(screen.queryByText('Revoke key')).toBeNull();
  });

  it('renders the description only when provided', () => {
    const { unmount } = renderWithI18n(<Harness />);
    expect(screen.queryByText('This cannot be undone')).toBeNull();
    unmount();
    renderWithI18n(<Harness description="This cannot be undone" />);
    expect(screen.getByText('This cannot be undone')).toBeInTheDocument();
  });

  it('invokes onConfirm when the confirm button is clicked', async () => {
    const onConfirm = vi.fn();
    renderWithI18n(<Harness onConfirm={onConfirm} />);
    await userEvent.click(screen.getByRole('button', { name: 'Revoke' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('closes via cancel without confirming', async () => {
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn();
    renderWithI18n(<Harness onOpenChange={onOpenChange} onConfirm={onConfirm} />);
    await userEvent.click(screen.getByRole('button', { name: 'Common.Cancel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('uses a custom cancel label when supplied', () => {
    renderWithI18n(<Harness cancelLabel="Keep" />);
    expect(screen.getByRole('button', { name: 'Keep' })).toBeInTheDocument();
  });

  it('shows the busy label and disables both buttons while pending', () => {
    renderWithI18n(<Harness isPending busyLabel="Revoking…" />);
    expect(screen.getByRole('button', { name: 'Revoking…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Common.Cancel' })).toBeDisabled();
  });

  it('applies destructive styling to the confirm button', () => {
    renderWithI18n(<Harness tone="destructive" />);
    expect(screen.getByRole('button', { name: 'Revoke' }).className).toContain('bg-destructive');
  });
});
