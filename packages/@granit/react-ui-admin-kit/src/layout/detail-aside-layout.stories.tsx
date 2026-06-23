import * as React from 'react';

import { DetailAsideLayout, DetailAsideMobileTrigger } from './detail-aside-layout';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof DetailAsideLayout> = {
  title: 'Admin Kit/DetailAsideLayout',
  component: DetailAsideLayout,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

function SampleAside() {
  return (
    <div className="space-y-4 p-4">
      <h3 className="text-sm font-semibold text-foreground">Activity</h3>
      <ul className="space-y-2">
        {['Created by Alice', 'Updated by Bob', 'Reviewed by Charlie'].map((entry) => (
          <li key={entry} className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            {entry}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SampleContent() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-base font-semibold text-foreground">Main content area</h2>
        <p className="text-sm text-muted-foreground">
          This is the primary content pane. On desktop (≥ 1024 px) the aside panel appears inline to
          the right. On smaller viewports the aside is hidden and accessible via the mobile trigger
          button.
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-2 text-base font-semibold text-foreground">Second section</h2>
        <p className="text-sm text-muted-foreground">Additional content fills this card.</p>
      </div>
    </div>
  );
}

function SampleHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Entity Detail</h1>
        <p className="text-sm text-muted-foreground">Entity › Detail</p>
      </div>
      <DetailAsideMobileTrigger />
    </div>
  );
}

export const Default: Story = {
  args: {
    asideTitle: 'Activity',
    aside: <SampleAside />,
    children: <SampleContent />,
  },
};

export const WithHeader: Story = {
  args: {
    asideTitle: 'Activity',
    aside: <SampleAside />,
    header: <SampleHeader />,
    children: <SampleContent />,
  },
};

export const CollapsedByDefault: Story = {
  args: {
    asideTitle: 'Activity',
    aside: <SampleAside />,
    storageKey: 'granit:detail-aside-open-story-collapsed',
    children: <SampleContent />,
  },
  decorators: [
    (Story) => {
      React.useEffect(() => {
        globalThis.localStorage.setItem('granit:detail-aside-open-story-collapsed', 'false');
      }, []);
      return <Story />;
    },
  ],
};
