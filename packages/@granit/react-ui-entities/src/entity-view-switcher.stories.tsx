import { fn } from 'storybook/test';

import { EntityViewSwitcher } from './entity-view-switcher';

import type { EntityListLayoutManifest } from '@granit/entities';
import type { Meta, StoryObj } from '@storybook/react-vite';


const layout = (
  kind: EntityListLayoutManifest['kind'],
  isDefault = false
): EntityListLayoutManifest => ({
  kind,
  isDefault,
  kanban: null,
  calendar: null,
  gallery: null,
});

const meta = {
  title: 'Shared Components/Layout/EntityViewSwitcher',
  component: EntityViewSwitcher,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    onChange: fn(),
  },
} satisfies Meta<typeof EntityViewSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

/** All four layout kinds, List active. */
export const AllKinds: Story = {
  args: {
    layouts: [layout('List', true), layout('Kanban'), layout('Calendar'), layout('Gallery')],
    activeKind: 'List',
  },
};

/** Kanban active. */
export const KanbanActive: Story = {
  args: {
    layouts: [layout('List'), layout('Kanban', true), layout('Calendar')],
    activeKind: 'Kanban',
  },
};

/** A single registered layout renders nothing — the switcher collapses. */
export const SingleLayoutHidden: Story = {
  args: {
    layouts: [layout('List', true)],
    activeKind: 'List',
  },
};
