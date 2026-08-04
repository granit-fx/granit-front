import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import { NotFoundPage } from '../not-found-page';

import { testI18n } from './test-utils';

describe('NotFoundPage', () => {
  it('renders the 404 message and a back-home link', () => {
    render(
      <I18nextProvider i18n={testI18n}>
        <MemoryRouter>
          <NotFoundPage />
        </MemoryRouter>
      </I18nextProvider>
    );

    expect(screen.getByText('Page not found')).toBeInTheDocument();
    expect(screen.getByText(/does not exist/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to home/i })).toHaveAttribute('href', '/');
  });
});
