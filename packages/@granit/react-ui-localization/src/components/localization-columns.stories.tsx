import { mockLocalizationOverrides } from '@granit/react-localization/testing';

import { LocalizationColumnsPreview } from './localization-columns-preview';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof LocalizationColumnsPreview> = {
  title: 'Features/Localization/LocalizationColumns',
  component: LocalizationColumnsPreview,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    onEdit: { action: 'onEdit' },
    onDelete: { action: 'onDelete' },
  },
};

export default meta;
type Story = StoryObj<typeof LocalizationColumnsPreview>;

export const Default: Story = {
  args: {
    data: mockLocalizationOverrides,
    onEdit: () => {},
    onDelete: () => {},
  },
};

export const SingleOverride: Story = {
  args: {
    data: [mockLocalizationOverrides[0]],
    onEdit: () => {},
    onDelete: () => {},
  },
};

export const Empty: Story = {
  args: {
    data: [],
    onEdit: () => {},
    onDelete: () => {},
  },
};
