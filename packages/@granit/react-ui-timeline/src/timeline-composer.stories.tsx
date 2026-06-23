import type { MentionSuggestion, PostTimelineEntryRequest } from '@granit/timeline';
import { TimelineEntryType } from '@granit/timeline';
import { fn } from 'storybook/test';

import type { Meta, StoryObj } from '@storybook/react-vite';

import { TimelineComposer } from './timeline-composer';

const mockSuggestions: MentionSuggestion[] = [
  { id: '11111111-1111-1111-1111-111111111111', displayName: 'Jane Dupont' },
  { id: '22222222-2222-2222-2222-222222222222', displayName: 'System Admin' },
];

const searchMentions = async (query: string): Promise<MentionSuggestion[]> => {
  const q = query.toLowerCase();
  return mockSuggestions.filter((s) => s.displayName.toLowerCase().includes(q));
};

const onSubmit = (request: PostTimelineEntryRequest): Promise<void> => {
  fn()(request);
  return Promise.resolve();
};

const meta = {
  title: 'Timeline/TimelineComposer',
  component: TimelineComposer,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    onSubmit,
    searchMentions,
  },
} satisfies Meta<typeof TimelineComposer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SingleEntryType: Story = {
  args: {
    entryTypes: [TimelineEntryType.Comment],
    placeholder: 'Add a comment…',
  },
};

export const InternalNotePreselected: Story = {
  args: {
    entryTypes: [TimelineEntryType.Comment, TimelineEntryType.InternalNote],
    initialEntryType: TimelineEntryType.InternalNote,
  },
};

export const EditMode: Story = {
  args: {
    initialBody: 'An existing note being edited.',
    hideEntryTypeSelector: true,
    submitLabel: 'Save',
  },
};
