import { MemoryRouter } from 'react-router-dom';

import { ReferenceDataCreatePageShell } from './reference-data-create-page-shell';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof ReferenceDataCreatePageShell> = {
  title: 'Features/ReferenceData/ReferenceDataCreatePageShell',
  component: ReferenceDataCreatePageShell,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  args: {
    i18nPrefix: 'Countries',
    basePath: '/countries',
    children: (
      <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        Form slot
      </div>
    ),
  },
};

export default meta;
type Story = StoryObj<typeof ReferenceDataCreatePageShell>;

export const Default: Story = {};
