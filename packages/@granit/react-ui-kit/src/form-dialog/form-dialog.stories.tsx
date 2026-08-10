import { Button, TextField } from '@granit/react-ui';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { FormDialog } from './form-dialog';

import type { Meta, StoryObj } from '@storybook/react-vite';

interface DemoValues {
  name: string;
  email: string;
}

/**
 * Hosts own the form instance, the open state and the submit handler — the
 * dialog only provides the chrome. This demo wires a minimal `react-hook-form`
 * instance so the fields and Cancel/Submit footer are interactive.
 */
function FormDialogDemo({
  isSubmitting = false,
  submitVariant = 'default',
}: {
  readonly isSubmitting?: boolean;
  readonly submitVariant?: 'default' | 'destructive';
}) {
  const [open, setOpen] = useState(true);
  const form = useForm<DemoValues>({ defaultValues: { name: '', email: '' } });

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        form={form}
        onSubmit={() => setOpen(false)}
        title="Create user"
        description="Fill in the details below."
        submitLabel="Create"
        busyLabel="Creating…"
        isSubmitting={isSubmitting}
        submitVariant={submitVariant}
      >
        <TextField control={form.control} name="name" label="Name" placeholder="Jane Doe" />
        <TextField
          control={form.control}
          name="email"
          label="Email"
          type="email"
          placeholder="jane@example.com"
        />
      </FormDialog>
    </>
  );
}

// The stories render `FormDialogDemo`, not `FormDialog` directly: the dialog
// needs a live `useForm` return, which cannot be expressed as a static arg. All
// of the demo's props are optional, so the render-only stories below need no
// `args` — binding `component` to it is both accurate and type-complete.
const meta = {
  title: 'Admin Kit/FormDialog',
  component: FormDialogDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof FormDialogDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default form-in-a-dialog with two fields. */
export const Default: Story = {
  render: () => <FormDialogDemo />,
};

/** Submitting state: both footer buttons disabled, busy label shown. */
export const Submitting: Story = {
  render: () => <FormDialogDemo isSubmitting />,
};

/** Destructive submit variant (e.g. a confirm-and-delete form). */
export const Destructive: Story = {
  render: () => <FormDialogDemo submitVariant="destructive" />,
};
