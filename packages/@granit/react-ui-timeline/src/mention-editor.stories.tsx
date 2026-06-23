import type { MentionSuggestion } from '@granit/timeline';
import { fn } from 'storybook/test';

import type { Meta, StoryObj } from '@storybook/react-vite';

import { MentionEditor } from './mention-editor';

const mockSuggestions: MentionSuggestion[] = [
  { id: '11111111-1111-1111-1111-111111111111', displayName: 'Jane Dupont' },
  { id: '22222222-2222-2222-2222-222222222222', displayName: 'System Admin' },
  { id: '33333333-3333-3333-3333-333333333333', displayName: 'Security Officer' },
];

const searchMentions = async (query: string): Promise<MentionSuggestion[]> => {
  const q = query.toLowerCase();
  return mockSuggestions.filter((s) => s.displayName.toLowerCase().includes(q));
};

const meta = {
  title: 'Timeline/MentionEditor',
  component: MentionEditor,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    onChange: fn(),
    searchMentions,
    placeholder: 'Write a comment… use @ to mention someone',
  },
} satisfies Meta<typeof MentionEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithInitialBody: Story = {
  args: {
    initialBody: 'Thanks @[Jane Dupont](user:11111111-1111-1111-1111-111111111111), reviewing now.',
  },
};

export const NoMentionLookup: Story = {
  args: {
    searchMentions: undefined,
    placeholder: 'Plain comment, no mentions',
  },
};

export const Disabled: Story = {
  args: {
    initialBody: 'This editor is read-only.',
    disabled: true,
  },
};
