import { render, screen } from '@testing-library/react';

import { StatusBadge, statusBadgeVariants } from '../status-badge.js';

describe('StatusBadge', () => {
  it('renders a <span> with the neutral default intent', () => {
    render(<StatusBadge>Idle</StatusBadge>);

    const badge = screen.getByText('Idle');
    expect(badge.tagName).toBe('SPAN');
    expect(badge).toHaveAttribute('data-slot', 'status-badge');
    expect(badge.className).toContain('text-muted-foreground');
  });

  it('maps an outcome intent to its semantic palette', () => {
    render(<StatusBadge intent="success">Valid</StatusBadge>);

    const badge = screen.getByText('Valid');
    expect(badge).toHaveAttribute('data-intent', 'success');
    expect(badge.className).toContain('bg-success-100');
  });

  it('applies the compact size', () => {
    render(
      <StatusBadge intent="danger" size="sm">
        Rejected
      </StatusBadge>
    );

    expect(screen.getByText('Rejected').className).toContain('text-[10px]');
  });

  it('statusBadgeVariants exposes intent classes', () => {
    expect(statusBadgeVariants({ intent: 'warning' })).toContain('bg-warning-100');
    expect(statusBadgeVariants({ intent: 'info' })).toContain('bg-admin-100');
  });
});
