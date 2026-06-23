import { mockWorkflowHistory } from '@granit/react-workflow/testing';

import { WorkflowHistory } from './workflow-history';

import type { TransitionHistory } from '@granit/workflow';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof WorkflowHistory> = {
  title: 'Workflow/WorkflowHistory',
  component: WorkflowHistory,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { history: mockWorkflowHistory },
};

export const MultipleEntries: Story = {
  args: {
    history: [
      ...mockWorkflowHistory,
      {
        previousState: 'Active',
        newState: 'Suspended',
        transitionedAt: '2026-01-10T14:20:00Z',
        transitionedBy: 'Jane Doe',
        comment: 'Temporary suspension pending review.',
      } satisfies TransitionHistory,
      {
        previousState: 'Suspended',
        newState: 'Active',
        transitionedAt: '2026-01-15T08:00:00Z',
        transitionedBy: 'John Smith',
      } satisfies TransitionHistory,
    ],
  },
};

export const Empty: Story = {
  args: { history: [], emptyMessage: 'No transitions yet.' },
};

export const CustomEmptyMessage: Story = {
  args: { history: [], emptyMessage: 'This workflow has no history entries.' },
};

export const Loading: Story = {
  args: { history: [], loading: true },
};
