import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';


import { FormDialog } from '../form-dialog/form-dialog';

import { renderWithI18n, setupI18n } from './test-utils';

import type { ReactNode } from 'react';

interface Values {
  readonly name: string;
}

interface HarnessProps {
  readonly open?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly onSubmit?: (values: Values) => void;
  readonly description?: ReactNode;
  readonly isSubmitting?: boolean;
  readonly busyLabel?: ReactNode;
  readonly cancelLabel?: ReactNode;
}

function Harness({
  open = true,
  onOpenChange = vi.fn(),
  onSubmit = vi.fn(),
  description,
  isSubmitting,
  busyLabel,
  cancelLabel,
}: HarnessProps) {
  const form = useForm<Values>({ defaultValues: { name: 'Alice' } });
  return (
    <FormDialog<Values>
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
      title="Edit entity"
      description={description}
      submitLabel="Save"
      busyLabel={busyLabel}
      cancelLabel={cancelLabel}
      isSubmitting={isSubmitting}
    >
      <input aria-label="name" {...form.register('name')} />
    </FormDialog>
  );
}

beforeAll(setupI18n);

describe('FormDialog', () => {
  it('renders the title and body fields when open', () => {
    renderWithI18n(<Harness />);
    expect(screen.getByText('Edit entity')).toBeInTheDocument();
    expect(screen.getByLabelText('name')).toBeInTheDocument();
  });

  it('does not render the dialog content when closed', () => {
    renderWithI18n(<Harness open={false} />);
    expect(screen.queryByText('Edit entity')).toBeNull();
  });

  it('renders the description only when provided', () => {
    const { unmount } = renderWithI18n(<Harness />);
    expect(screen.queryByText('Some help text')).toBeNull();
    unmount();
    renderWithI18n(<Harness description="Some help text" />);
    expect(screen.getByText('Some help text')).toBeInTheDocument();
  });

  it('submits the current form values through the handler', async () => {
    const onSubmit = vi.fn();
    renderWithI18n(<Harness onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ name: 'Alice' });
  });

  it('closes via the cancel button without submitting', async () => {
    const onOpenChange = vi.fn();
    const onSubmit = vi.fn();
    renderWithI18n(<Harness onOpenChange={onOpenChange} onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: 'Common.Cancel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('uses a custom cancel label when supplied', () => {
    renderWithI18n(<Harness cancelLabel="Dismiss" />);
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
  });

  it('shows the busy label and disables both buttons while submitting', () => {
    renderWithI18n(<Harness isSubmitting busyLabel="Saving…" />);
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Common.Cancel' })).toBeDisabled();
  });
});
