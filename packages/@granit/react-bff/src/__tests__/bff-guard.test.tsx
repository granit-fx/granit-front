import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BffGuard } from '../components/bff-guard';

// Drive the guard through a mocked auth hook so we can observe how many login
// flows it starts under re-renders and StrictMode double-invocation.
const h = vi.hoisted(() => ({
  state: {
    user: null as unknown,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('../hooks/use-bff-auth', () => ({
  useBffAuth: () => h.state,
}));

function setState(next: Partial<typeof h.state>) {
  h.state = { ...h.state, ...next };
}

describe('BffGuard', () => {
  beforeEach(() => {
    h.state = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when authenticated', () => {
    setState({ isAuthenticated: true });
    render(
      <BffGuard>
        <span data-testid="content">Protected</span>
      </BffGuard>
    );
    expect(screen.getByTestId('content')).toBeTruthy();
    expect(h.state.login).not.toHaveBeenCalled();
  });

  it('shows the fallback and does not redirect while loading', () => {
    setState({ isLoading: true });
    render(
      <BffGuard fallback={<span data-testid="loading">Loading…</span>}>
        <span data-testid="content">Protected</span>
      </BffGuard>
    );
    expect(screen.getByTestId('loading')).toBeTruthy();
    expect(screen.queryByTestId('content')).toBeNull();
    expect(h.state.login).not.toHaveBeenCalled();
  });

  it('starts exactly one login flow under StrictMode double-invocation', () => {
    setState({ isAuthenticated: false, isLoading: false });
    render(
      <StrictMode>
        <BffGuard>
          <span data-testid="content">Protected</span>
        </BffGuard>
      </StrictMode>
    );
    // The render-phase login() bug fired on every render; the effect + one-shot
    // ref now fire a single redirect even though StrictMode mounts twice.
    expect(h.state.login).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('re-arms after an authenticated → unauthenticated (logout) cycle', () => {
    const login = vi.fn();
    setState({ login, isAuthenticated: false, isLoading: false });

    const { rerender } = render(
      <BffGuard>
        <span>child</span>
      </BffGuard>
    );
    expect(login).toHaveBeenCalledTimes(1);

    // Becomes authenticated — the guard must not redirect again…
    setState({ isAuthenticated: true });
    rerender(
      <BffGuard>
        <span>child</span>
      </BffGuard>
    );
    expect(login).toHaveBeenCalledTimes(1);

    // …but a later logout re-arms it for a single fresh redirect.
    setState({ isAuthenticated: false });
    rerender(
      <BffGuard>
        <span>child</span>
      </BffGuard>
    );
    expect(login).toHaveBeenCalledTimes(2);
  });
});
