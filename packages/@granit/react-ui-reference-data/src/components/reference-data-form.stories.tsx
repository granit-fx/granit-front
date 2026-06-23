import { fn } from 'storybook/test';

import { ReferenceDataForm } from './reference-data-form';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof ReferenceDataForm> = {
  title: 'Features/ReferenceData/ReferenceDataForm',
  component: ReferenceDataForm,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="max-w-3xl">
        <Story />
      </div>
    ),
  ],
  args: {
    i18nPrefix: 'Countries',
    // Empty constraint set — no field is required/validated in the story.
    constraints: {},
    onCancel: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof ReferenceDataForm>;

export const Create: Story = {
  args: {
    mode: 'create',
    onSubmit: fn(),
  },
};

export const Edit: Story = {
  args: {
    mode: 'edit',
    showParentCode: true,
    defaultValues: {
      labelEn: 'France',
      labelFr: 'France',
      sortOrder: 10,
      activated: true,
    },
    onSubmit: fn(),
  },
};

export const Pending: Story = {
  args: {
    mode: 'create',
    isPending: true,
    onSubmit: fn(),
  },
};
