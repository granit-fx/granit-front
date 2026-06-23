import { Button } from '@granit/react-ui';
import { ArrowLeft, Plus } from 'lucide-react';

import { EntityPageLayout } from './entity-page-layout';

import type { Meta, StoryObj } from '@storybook/react-vite';


const meta = {
  title: 'Shared Components/Layout/EntityPageLayout',
  component: EntityPageLayout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    contentWidth: {
      control: 'select',
      options: ['full', 'comfortable', 'narrow'],
    },
  },
} satisfies Meta<typeof EntityPageLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleBody = (
  <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
    View-specific content (table, kanban, cards…) renders here.
  </div>
);

/** List page: title, primary action, query controls and pagination slots. */
export const ListPage: Story = {
  args: {
    title: 'Invoices',
    subtitle: '128 records',
    actions: (
      <Button size="sm">
        <Plus className="mr-2 size-4" />
        New invoice
      </Button>
    ),
    queryControls: (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">Filters · Sort</div>
    ),
    pagination: <div className="text-sm text-muted-foreground">1–20 / 128</div>,
    children: sampleBody,
  },
};

/** Detail page: back navigation, no query controls, comfortable width. */
export const DetailPage: Story = {
  args: {
    contentWidth: 'comfortable',
    back: (
      <Button variant="ghost" size="sm">
        <ArrowLeft className="mr-2 size-4" />
        Back to invoices
      </Button>
    ),
    title: 'Invoice #2026-0042',
    subtitle: 'Acme Corp · Paid',
    children: sampleBody,
  },
};

/** Form page: narrow width, header omitted (body owns its own title). */
export const FormPage: Story = {
  args: {
    contentWidth: 'narrow',
    children: sampleBody,
  },
};
