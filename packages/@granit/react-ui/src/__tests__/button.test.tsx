import { render, screen } from '@testing-library/react';

import { Button, buttonVariants } from '../button.js';

describe('Button', () => {
  it('renders a native <button> by default', () => {
    render(<Button>Click</Button>);

    const button = screen.getByRole('button', { name: 'Click' });
    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveAttribute('data-slot', 'button');
  });

  it('applies variant and size data attributes and classes', () => {
    render(
      <Button variant="destructive" size="lg">
        Delete
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button).toHaveAttribute('data-variant', 'destructive');
    expect(button).toHaveAttribute('data-size', 'lg');
    expect(button.className).toContain('bg-destructive');
    expect(button.className).toContain('h-10');
  });

  it('renders the child element instead of a button when asChild', () => {
    render(
      <Button asChild>
        <a href="/home">Home</a>
      </Button>
    );

    const link = screen.getByRole('link', { name: 'Home' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/home');
    expect(link).toHaveAttribute('data-slot', 'button');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('buttonVariants exposes default variant classes', () => {
    expect(buttonVariants()).toContain('bg-primary');
    expect(buttonVariants({ variant: 'outline' })).toContain('border');
  });
});
