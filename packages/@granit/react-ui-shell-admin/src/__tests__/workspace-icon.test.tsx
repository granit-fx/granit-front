import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  registerWorkspaceIcons,
  setWorkspaceIconFallback,
  type WorkspaceIconComponent,
} from '../icon-registry';
import { WorkspaceIcon } from '../workspace-icon';

vi.mock('lucide-react', () => ({
  Square: ({ className }: { className?: string }) => (
    <span data-slot="square-fallback" className={className} />
  ),
}));

// A registered icon renders a marker element forwarding its className.
const UsersIcon: WorkspaceIconComponent = ({ className }) => (
  <span data-slot="users-icon" className={className} />
);
registerWorkspaceIcons({ users: UsersIcon });

afterEach(() => setWorkspaceIconFallback(null));

describe('WorkspaceIcon', () => {
  it('renders the Square fallback when name is null', () => {
    render(<WorkspaceIcon name={null} />);
    expect(document.querySelector('[data-slot="square-fallback"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="users-icon"]')).toBeNull();
  });

  it('renders the registered icon for a known name and forwards the className', () => {
    render(<WorkspaceIcon name="users" className="size-4" />);
    const icon = document.querySelector('[data-slot="users-icon"]');
    expect(icon).not.toBeNull();
    expect(icon).toHaveClass('size-4');
  });

  it('falls back to Square when the name is unregistered and no fallback is set', () => {
    render(<WorkspaceIcon name="not-registered" />);
    expect(document.querySelector('[data-slot="square-fallback"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="users-icon"]')).toBeNull();
  });

  it('consults the fallback resolver for names absent from the registry', () => {
    setWorkspaceIconFallback((name) =>
      name === 'via-fallback'
        ? ({ className }) => <span data-slot="fallback-icon" className={className} />
        : undefined
    );
    render(<WorkspaceIcon name="via-fallback" className="size-5" />);
    const icon = document.querySelector('[data-slot="fallback-icon"]');
    expect(icon).not.toBeNull();
    expect(icon).toHaveClass('size-5');
  });

  it('catches a throwing resolved icon via the error boundary', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    setWorkspaceIconFallback(() => () => {
      throw new Error('Name not found');
    });
    render(<WorkspaceIcon name="boom" />);
    expect(document.querySelector('[data-slot="square-fallback"]')).not.toBeNull();
    spy.mockRestore();
  });
});
