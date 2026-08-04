import { createMemoryRouter, RouterProvider } from 'react-router';

import { ErrorPage } from './error-page';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof ErrorPage> = {
  title: 'Error Boundary/ErrorPage',
  component: ErrorPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

function throwingRouter(thrown: unknown) {
  return createMemoryRouter([
    {
      path: '/',
      loader: () => {
        throw thrown;
      },
      element: <div />,
      errorElement: <ErrorPage showErrorDetail />,
    },
  ]);
}

/** A route that resolves to a 404 — links back home. */
export const NotFound: Story = {
  render: () => <RouterProvider router={throwingRouter(new Response(null, { status: 404 }))} />,
};

/** A route that throws an unexpected error. */
export const Generic: Story = {
  render: () => <RouterProvider router={throwingRouter(new Error('Database connection failed'))} />,
};
