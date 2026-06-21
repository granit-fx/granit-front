import { screen } from '@testing-library/react';

import { EmptyState } from '../querying/query-data-table/empty-state';
import { renderWithI18n, setupI18n } from './test-utils';

beforeAll(setupI18n);

describe('EmptyState', () => {
  it('renders a custom message when provided', () => {
    renderWithI18n(<EmptyState message="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('falls back to the default no-results key', () => {
    const { container } = renderWithI18n(<EmptyState />);
    expect(container.querySelector('[data-slot="empty-state"]')).not.toBeNull();
  });

  it('applies an extra class name', () => {
    const { container } = renderWithI18n(<EmptyState className="mt-4" />);
    expect(container.querySelector('[data-slot="empty-state"]')?.className).toContain('mt-4');
  });
});
