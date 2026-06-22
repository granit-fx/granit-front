import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import type { ReactElement } from 'react';

// AppShell reads `globalThis.matchMedia` in an effect; the shared jsdom setup
// only installs it on `window`. Provide a minimal listener-capable stub.
if (typeof globalThis.matchMedia !== 'function') {
  globalThis.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof globalThis.matchMedia;
}

// Stub the composed children — each is covered by its own test. This keeps the
// AppShell test focused on its layout + the sidebar-collapse state logic.
vi.mock('../app-sidebar', () => ({
  AppSidebar: ({ userMenu }: { userMenu?: React.ReactNode }) => (
    <div data-slot="stub-sidebar">{userMenu}</div>
  ),
}));
vi.mock('../app-right-sidebar', () => ({
  AppRightSidebar: () => <div data-slot="stub-right" />,
}));
vi.mock('../header', () => ({
  Header: ({ actions }: { actions?: React.ReactNode }) => (
    <div data-slot="stub-header">{actions}</div>
  ),
}));

const { AppShell } = await import('../app-shell');

function renderAt(ui: ReactElement, route: string) {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);
}

describe('AppShell', () => {
  it('renders the children inside the layout content slot', () => {
    renderAt(
      <AppShell>
        <p>page-body</p>
      </AppShell>,
      '/users'
    );
    expect(screen.getByText('page-body')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="layout-content"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="layout-main"]')).not.toBeNull();
  });

  it('forwards the user menu and header actions to the chrome slots', () => {
    renderAt(
      <AppShell userMenu={<span>menu-slot</span>} headerActions={<span>action-slot</span>}>
        <p>body</p>
      </AppShell>,
      '/users'
    );
    expect(screen.getByText('menu-slot')).toBeInTheDocument();
    expect(screen.getByText('action-slot')).toBeInTheDocument();
  });

  it('mounts the stubbed sidebar/header/right rail', () => {
    renderAt(
      <AppShell>
        <p>body</p>
      </AppShell>,
      '/'
    );
    expect(document.querySelector('[data-slot="stub-sidebar"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="stub-header"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="stub-right"]')).not.toBeNull();
  });

  it('accepts a custom collapsedPaths set without crashing on a non-collapsed route', () => {
    renderAt(
      <AppShell collapsedPaths={['/launcher']}>
        <p>body</p>
      </AppShell>,
      '/dashboard'
    );
    expect(screen.getByText('body')).toBeInTheDocument();
  });
});
