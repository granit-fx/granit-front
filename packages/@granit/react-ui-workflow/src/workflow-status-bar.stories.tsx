import { I18nextProvider } from 'react-i18next';
import { fn } from 'storybook/test';

import { storyI18n } from './stories-i18n';
import { WorkflowStatusBar } from './workflow-status-bar';

import type { WorkflowTransition } from '@granit/workflow';
import type { Meta, StoryObj } from '@storybook/react-vite';

const USER_STATES = ['PendingValidation', 'Active', 'Suspended', 'Archived'] as const;

const allowedTransitions: WorkflowTransition[] = [
  { targetState: 'Suspended', name: 'Suspend', allowed: true, requiresApproval: false },
  { targetState: 'Archived', name: 'Archive', allowed: false, requiresApproval: true },
];

const meta: Meta<typeof WorkflowStatusBar> = {
  title: 'Workflow/WorkflowStatusBar',
  component: WorkflowStatusBar,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    currentState: { control: 'select', options: USER_STATES },
    isLoading: { control: 'boolean' },
  },
  args: { onTransition: fn() },
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
  args: { currentState: 'Active', states: USER_STATES, transitions: allowedTransitions },
};

export const FirstState: Story = {
  args: {
    currentState: 'PendingValidation',
    states: USER_STATES,
    transitions: [{ targetState: 'Active', name: 'Activate', allowed: true, requiresApproval: false }],
  },
};

export const LastState: Story = {
  args: { currentState: 'Archived', states: USER_STATES, transitions: [] },
};

export const Loading: Story = {
  args: {
    currentState: 'Active',
    states: USER_STATES,
    transitions: allowedTransitions,
    isLoading: true,
  },
};

export const RequiresApproval: Story = {
  args: {
    currentState: 'Suspended',
    states: USER_STATES,
    transitions: [{ targetState: 'Active', name: 'Reactivate', allowed: false, requiresApproval: true }],
  },
};

export const SimpleThreeState: Story = {
  args: {
    currentState: 'Draft',
    states: ['Draft', 'Published', 'Archived'],
    transitions: [{ targetState: 'Published', name: 'Publish', allowed: true, requiresApproval: false }],
  },
};
