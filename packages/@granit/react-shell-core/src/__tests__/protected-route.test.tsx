import { render, screen } from '@testing-library/react';

import { ProtectedRoute, ShellAuthProvider, type ShellAuthState } from '../auth-context';

function renderRoute(auth: ShellAuthState) {
  return render(
    <ShellAuthProvider value={auth}>
      <ProtectedRoute>
        <span>Protected content</span>
      </ProtectedRoute>
    </ShellAuthProvider>
  );
}

describe('ProtectedRoute', () => {
  it('renders nothing while loading', () => {
    const { container } = renderRoute({ authenticated: false, loading: true, login: vi.fn() });
    expect(container.querySelector('span')).toBeNull();
  });

  it('starts login and renders nothing when unauthenticated', () => {
    const login = vi.fn();
    renderRoute({ authenticated: false, loading: false, login });
    expect(screen.queryByText('Protected content')).toBeNull();
    expect(login).toHaveBeenCalledTimes(1);
  });

  it('renders children when authenticated', () => {
    renderRoute({ authenticated: true, loading: false, login: vi.fn() });
    expect(screen.queryByText('Protected content')).not.toBeNull();
  });
});
