import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { createWorkspacesHandlers } from '@granit/react-workspaces/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DynamicIcon, type IconName } from 'lucide-react/dynamic';
import { I18nextProvider } from 'react-i18next';

import { storyI18n } from './stories-i18n';
import { WorkspacePage } from './workspace-page';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

// Mirrors the host's injected WorkspaceIcon (lucide dynamic icon by backend name).
const renderIcon = (name: string | null, className?: string) =>
  name ? <DynamicIcon name={name as IconName} className={className} /> : null;

const meta: Meta<typeof WorkspacePage> = {
  title: 'Workspaces/WorkspacePage',
  component: WorkspacePage,
  tags: ['autodocs', '!test'],
  args: { renderIcon },
  parameters: {
    layout: 'fullscreen',
    msw: { handlers: createWorkspacesHandlers() },
  },
  decorators: [
    (Story) => (
      <I18nextProvider i18n={storyI18n}>
        <QueryClientProvider client={queryClient}>
          <GranitClientProvider client={client}>
            <Story />
          </GranitClientProvider>
        </QueryClientProvider>
      </I18nextProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The landing screen for an existing workspace (mock `Showcase.CRM`). */
export const Default: Story = {
  args: { workspaceName: 'Showcase.CRM' },
};

/** The "not found" state when the route names a workspace the user can't see. */
export const NotFound: Story = {
  args: { workspaceName: 'Does.Not.Exist' },
};
