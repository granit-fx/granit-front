import { render, screen } from '@testing-library/react';

import { Badge, badgeVariants } from '../badge.js';

describe('Badge', () => {
  it('renders a <span> with default variant', () => {
    render(<Badge>New</Badge>);

    const badge = screen.getByText('New');
    expect(badge.tagName).toBe('SPAN');
    expect(badge).toHaveAttribute('data-slot', 'badge');
    expect(badge).toHaveAttribute('data-variant', 'default');
    expect(badge.className).toContain('bg-primary');
  });

  it('applies a non-default variant', () => {
    render(<Badge variant="destructive">Error</Badge>);

    const badge = screen.getByText('Error');
    expect(badge).toHaveAttribute('data-variant', 'destructive');
    expect(badge.className).toContain('bg-destructive');
  });

  it('renders the child element instead of a span when asChild', () => {
    render(
      <Badge asChild>
        <a href="/tag">Tag</a>
      </Badge>
    );

    const link = screen.getByRole('link', { name: 'Tag' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('data-slot', 'badge');
  });

  it('badgeVariants exposes variant classes', () => {
    expect(badgeVariants()).toContain('bg-primary');
    expect(badgeVariants({ variant: 'secondary' })).toContain('bg-secondary');
  });
});
