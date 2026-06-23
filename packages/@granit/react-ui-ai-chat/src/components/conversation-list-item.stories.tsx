import { ConversationListItem } from './conversation-list-item';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof ConversationListItem> = {
  title: 'Features/AiChat/ConversationListItem',
  component: ConversationListItem,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
  args: {
    id: 'c1',
    title: 'Advantages of Next.js',
    isActive: false,
    isPinned: false,
    onSelect: () => {},
    onTogglePin: () => {},
    onRename: () => {},
    onDelete: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof ConversationListItem>;

export const Default: Story = {};
export const Active: Story = { args: { isActive: true } };
export const Pinned: Story = { args: { isPinned: true } };
