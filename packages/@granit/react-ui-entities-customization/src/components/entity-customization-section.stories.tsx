import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { CustomizationProvider } from '@granit/react-entities-customization';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { fn } from 'storybook/test';

import { EntityCustomizationSection } from './entity-customization-section';

import type { Meta, StoryObj } from '@storybook/react-vite';

const api = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const fields = [
  { name: 'displayName', label: 'Display name', defaultGroup: 'general' },
  { name: 'email', label: 'Email', defaultGroup: 'general' },
  { name: 'phone', label: 'Phone', defaultGroup: 'contact' },
];

const groups = [
  { key: 'general', label: 'General' },
  { key: 'contact', label: 'Contact' },
];

const meta: Meta<typeof EntityCustomizationSection> = {
  title: 'Features/Customization/EntityCustomizationSection',
  component: EntityCustomizationSection,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    msw: {
      handlers: [
        http.get('/api/v1/workspaces', () =>
          HttpResponse.json({ schemaVersion: 1, workspaces: [] })
        ),
      ],
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <GranitClientProvider client={api}>
          <CustomizationProvider config={{ client: api, apiBase: '/api/v1' }}>
            <Story />
          </CustomizationProvider>
        </GranitClientProvider>
      </QueryClientProvider>
    ),
  ],
  args: {
    entityName: 'Granit.Parties.Party',
    isManifestLoading: false,
    isCustomizationLoading: false,
    fields,
    draftDeltas: [],
    setDraftDeltas: fn(),
    groups,
    onSave: fn(),
    onReset: fn(),
    isSavePending: false,
    onInspectField: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// No entity picked yet — renders the empty-state prompt.
export const NoEntitySelected: Story = {
  args: { entityName: '' },
};

// Manifest still loading — renders a spinner.
export const Loading: Story = {
  args: { isManifestLoading: true },
};

export const Saving: Story = {
  args: { isSavePending: true },
};
