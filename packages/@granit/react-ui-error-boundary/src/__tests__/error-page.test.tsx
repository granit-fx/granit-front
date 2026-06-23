import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { ErrorPage } from '../error-page';
import { testI18n } from './test-utils';

import type { ReactElement } from 'react';

function renderRoute(errorElement: ReactElement, thrown: unknown) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        loader: () => {
          throw thrown;
        },
        element: <div />,
        errorElement,
        hydrateFallbackElement: <div />,
      },
    ],
    { initialEntries: ['/'] }
  );
  return render(
    <I18nextProvider i18n={testI18n}>
      <RouterProvider router={router} />
    </I18nextProvider>
  );
}

describe('ErrorPage', () => {
  it('renders a generic error with a back-home link', async () => {
    renderRoute(<ErrorPage />, new Error('boom'));

    expect(await screen.findByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to home/i })).toHaveAttribute('href', '/');
  });

  it('renders the 404 variant for a 404 response', async () => {
    renderRoute(<ErrorPage />, new Response(null, { status: 404 }));

    expect(await screen.findByText('Page not found')).toBeInTheDocument();
  });

  it('shows the error detail when showErrorDetail is set', async () => {
    renderRoute(<ErrorPage showErrorDetail />, new Error('database down'));

    expect(await screen.findByText('Error detail')).toBeInTheDocument();
    expect(screen.getByText(/database down/)).toBeInTheDocument();
  });

  it('calls onError with the caught error', async () => {
    const onError = vi.fn();
    const err = new Error('boom');
    renderRoute(<ErrorPage onError={onError} />, err);

    await screen.findByText('Something went wrong');
    expect(onError).toHaveBeenCalledWith(err);
  });
});
