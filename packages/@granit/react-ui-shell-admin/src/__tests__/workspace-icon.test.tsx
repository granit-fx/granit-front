import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Replace lucide's DynamicIcon: throw for a sentinel "bad" name (to exercise
// the error boundary), otherwise render a marker element.
vi.mock('lucide-react/dynamic', () => ({
  DynamicIcon: ({ name, className }: { name: string; className?: string }) => {
    if (name === 'bad') throw new Error('Name not found');
    return <span data-slot="dynamic-icon" data-name={name} className={className} />;
  },
}));

vi.mock('lucide-react', () => ({
  Square: ({ className }: { className?: string }) => (
    <span data-slot="square-fallback" className={className} />
  ),
}));

const { WorkspaceIcon } = await import('../workspace-icon');

describe('WorkspaceIcon', () => {
  it('renders the Square fallback when name is null', () => {
    render(<WorkspaceIcon name={null} />);
    expect(document.querySelector('[data-slot="square-fallback"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="dynamic-icon"]')).toBeNull();
  });

  it('renders the dynamic icon for a valid name and forwards the className', () => {
    render(<WorkspaceIcon name="users" className="size-4" />);
    const icon = document.querySelector('[data-slot="dynamic-icon"]');
    expect(icon).not.toBeNull();
    expect(icon).toHaveAttribute('data-name', 'users');
    expect(icon).toHaveClass('size-4');
  });

  it('falls back to Square via the error boundary when the icon name is unknown', () => {
    // Silence the expected React error-boundary console output.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<WorkspaceIcon name="bad" />);
    expect(document.querySelector('[data-slot="square-fallback"]')).not.toBeNull();
    spy.mockRestore();
  });
});
