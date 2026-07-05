import { sampleDevices } from '@granit/react-iot/testing';
import { I18nextProvider } from 'react-i18next';
import { fn } from 'storybook/test';

import { storyI18n } from '../stories-i18n';

import { DeviceForm } from './device-form';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof DeviceForm> = {
  title: 'IoT/DeviceForm',
  component: DeviceForm,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    onCancel: fn(),
    onSubmit: fn(),
  },
  decorators: [
    (Story) => (
      <I18nextProvider i18n={storyI18n}>
        <Story />
      </I18nextProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Provision form — every field editable, spec-driven validation. */
export const Provision: Story = {
  args: { mode: 'provision' },
};

/** Edit form — serial number and model are read-only; only firmware and label change. */
export const Edit: Story = {
  args: { mode: 'edit', defaultValues: sampleDevices[0]! },
};

export const Pending: Story = {
  args: { mode: 'provision', isPending: true },
};
