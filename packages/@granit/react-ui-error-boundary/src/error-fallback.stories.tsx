import { ErrorFallback } from './error-fallback';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Error Boundary/ErrorFallback',
  component: ErrorFallback,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    error: new Error('Cannot read properties of undefined (reading "id")'),
    onReset: () => undefined,
  },
} satisfies Meta<typeof ErrorFallback>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default fallback shown by a boundary's `renderFallback`. */
export const Default: Story = {};

/** Dev mode: the copyable error-detail block is visible. */
export const WithErrorDetail: Story = {
  args: { showErrorDetail: true },
};
