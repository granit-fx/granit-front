import { ChatMessageActions } from './chat-message-actions';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof ChatMessageActions> = {
  title: 'Features/AiChat/ChatMessageActions',
  component: ChatMessageActions,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  // Tooltips rely on the global TooltipProvider decorator (.storybook/preview.ts).
  args: {
    content: 'Invoice #42 was paid on 12 June 2026.',
    onRegenerate: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof ChatMessageActions>;

/** User message: copy only. */
export const UserMessage: Story = {
  args: { canRegenerate: false, canReport: false },
};

/** Assistant message: split copy (HTML / Markdown / plain), regenerate, report. */
export const AssistantMessage: Story = {
  args: { isAssistant: true, canRegenerate: true, canReport: true },
};
