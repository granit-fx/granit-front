import { screen } from '@testing-library/react';

import { ErrorFallback } from '../error-fallback';

import { renderWithI18n } from './test-utils';

import type { ReactNode } from 'react';

describe('ErrorFallback', () => {
  const error = new Error('Test error message');

  it('renders the error heading and message', () => {
    renderWithI18n(<ErrorFallback error={error} onReset={() => undefined} />);

    expect(screen.getByText('Unexpected Error')).toBeInTheDocument();
    expect(screen.getByText(/try again/i)).toBeInTheDocument();
  });

  it('hides the error detail block by default', () => {
    renderWithI18n(<ErrorFallback error={error} onReset={() => undefined} />);

    expect(screen.queryByText('Error detail')).not.toBeInTheDocument();
  });

  it('shows the copyable error detail when showErrorDetail is set', () => {
    renderWithI18n(<ErrorFallback error={error} onReset={() => undefined} showErrorDetail />);

    expect(screen.getByText('Error detail')).toBeInTheDocument();
    expect(screen.getByText(/Test error message/)).toBeInTheDocument();
  });

  it('calls onReset when the retry button is clicked', async () => {
    const onReset = vi.fn();
    const { user } = renderWithI18n(<ErrorFallback error={error} onReset={onReset} />);

    await user.click(screen.getByRole('button', { name: /retry/i }));

    expect(onReset).toHaveBeenCalledOnce();
  });

  it('wraps its content in the provided layout slot', () => {
    function Layout({ children }: Readonly<{ children: ReactNode }>) {
      return <div data-testid="layout">{children}</div>;
    }
    renderWithI18n(<ErrorFallback error={error} onReset={() => undefined} layout={Layout} />);

    expect(screen.getByTestId('layout')).toBeInTheDocument();
  });
});
