import { fn } from 'storybook/test';

import { LegalDocumentForm } from './legal-document-form';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof LegalDocumentForm> = {
  title: 'Features/Privacy/LegalDocumentForm',
  component: LegalDocumentForm,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    onSubmit: fn(),
    onCancel: fn(),
    isSubmitting: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  args: { mode: 'create' },
};

export const Edit: Story = {
  args: {
    mode: 'edit',
    defaultValues: {
      displayName: 'Privacy Policy',
      description: 'Tells users how their data is processed.',
      templateName: 'privacy-policy-v2',
      documentBlobId: '00000000-0000-0000-0000-000000000000',
      concurrencyStamp: 'a1b2c3d4',
    },
  },
};

export const Submitting: Story = {
  args: { mode: 'create', isSubmitting: true },
};
