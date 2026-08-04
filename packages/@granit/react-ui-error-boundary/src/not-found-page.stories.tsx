import { MemoryRouter } from 'react-router';

import { NotFoundPage } from './not-found-page';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof NotFoundPage> = {
  title: 'Error Boundary/NotFoundPage',
  component: NotFoundPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
