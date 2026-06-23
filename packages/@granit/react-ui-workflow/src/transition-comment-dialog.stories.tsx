import { I18nextProvider } from 'react-i18next';
import { fn } from 'storybook/test';

import { storyI18n } from './stories-i18n';
import { TransitionCommentDialog } from './transition-comment-dialog';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof TransitionCommentDialog> = {
  title: 'Workflow/TransitionCommentDialog',
  component: TransitionCommentDialog,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    open: true,
    transitionName: 'Publish',
    requiresApproval: false,
    onConfirm: fn(),
    onCancel: fn(),
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

export const Default: Story = {
  args: { open: true, transitionName: 'Publish', requiresApproval: false },
};

export const RequiresApproval: Story = {
  args: { open: true, transitionName: 'Submit for Review', requiresApproval: true },
};

export const Closed: Story = {
  args: { open: false, transitionName: 'Publish', requiresApproval: false },
};
