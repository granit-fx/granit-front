import { Button } from '@granit/react-ui';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import * as React from 'react';

import { RouteSuspenseSignal, TopProgressBar } from './top-progress-bar';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof TopProgressBar> = {
  title: 'Admin Kit/TopProgressBar',
  component: TopProgressBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'GitHub-style thin progress bar fixed to the top of the viewport. Tracks React Query fetching/mutations and lazy route chunk loading via `<RouteSuspenseSignal />`.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

function withQueryClient(Story: React.ComponentType) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <Story />
    </QueryClientProvider>
  );
}

function DemoQueryTrigger() {
  const [enabled, setEnabled] = React.useState(false);
  useQuery({
    queryKey: ['demo', enabled],
    queryFn: () => new Promise((resolve) => globalThis.setTimeout(() => resolve('done'), 1500)),
    enabled,
  });
  return (
    <div className="flex flex-col items-start gap-3 p-8">
      <p className="text-muted-foreground text-sm">
        Click to trigger a 1.5s query and watch the bar animate.
      </p>
      <Button
        onClick={() => {
          setEnabled(false);
          globalThis.setTimeout(() => setEnabled(true), 50);
        }}
      >
        Trigger query
      </Button>
    </div>
  );
}

export const WithQuery: Story = {
  decorators: [withQueryClient],
  render: () => (
    <>
      <TopProgressBar />
      <DemoQueryTrigger />
    </>
  ),
};

function DemoSuspenseTrigger() {
  const [showSignal, setShowSignal] = React.useState(false);
  return (
    <div className="flex flex-col items-start gap-3 p-8">
      <p className="text-muted-foreground text-sm">
        Simulates a lazy route chunk load via <code>RouteSuspenseSignal</code>.
      </p>
      <Button
        onClick={() => {
          setShowSignal(true);
          globalThis.setTimeout(() => setShowSignal(false), 1500);
        }}
      >
        Simulate route chunk load
      </Button>
      {showSignal && <RouteSuspenseSignal />}
    </div>
  );
}

export const WithRouteChunk: Story = {
  decorators: [withQueryClient],
  render: () => (
    <>
      <TopProgressBar />
      <DemoSuspenseTrigger />
    </>
  ),
};
