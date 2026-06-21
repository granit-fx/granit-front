import { render, screen } from '@testing-library/react';

import { Spinner } from '../spinner.js';

describe('Spinner', () => {
  it('renders with status role and an accessible label', () => {
    render(<Spinner />);

    const spinner = screen.getByRole('status', { name: 'Loading' });
    expect(spinner).toBeInTheDocument();
    expect(spinner.classList.contains('animate-spin')).toBe(true);
  });

  it('applies the default (md) size variant', () => {
    render(<Spinner />);

    expect(screen.getByRole('status').classList.contains('size-8')).toBe(true);
  });

  it('applies the requested size variant', () => {
    render(<Spinner size="lg" />);

    expect(screen.getByRole('status').classList.contains('size-12')).toBe(true);
  });

  it('merges a custom className', () => {
    render(<Spinner className="custom-spin" />);

    expect(screen.getByRole('status').classList.contains('custom-spin')).toBe(true);
  });
});
