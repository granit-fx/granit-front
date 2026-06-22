import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeT, renderShell } from './test-utils';

vi.mock('@granit/react-localization', () => ({ useTranslation: () => ({ t: makeT() }) }));

// useRightSidebar is consumed via the package's own context; stub it so we can
// drive both the open and closed branches without a real provider.
const toggle = vi.fn();
let sidebarOpen = false;
vi.mock('../right-sidebar-context', () => ({
  useRightSidebar: () => ({ open: sidebarOpen, toggle }),
}));

const dispatchSpy = vi.fn();
vi.mock('../command-palette-events', () => ({
  openCommandPalette: () => dispatchSpy(),
}));

// Imported after the mocks are registered.
const { Header } = await import('../header');

beforeEach(() => {
  toggle.mockClear();
  dispatchSpy.mockClear();
  sidebarOpen = false;
});

describe('Header', () => {
  it('renders the command-palette trigger and sidebar trigger', () => {
    renderShell(<Header />, { route: '/' });
    expect(screen.getByRole('button', { name: 'Open command palette' })).toBeInTheDocument();
    expect(screen.getByText('Type a command or search…')).toBeInTheDocument();
  });

  it('renders no breadcrumb on the root route (no segments)', () => {
    renderShell(<Header routeLabels={{ users: 'Navigation.Users' }} />, { route: '/' });
    expect(screen.queryByText('Navigation.Users')).not.toBeInTheDocument();
  });

  it('renders a single breadcrumb page when only the root segment matches a label', () => {
    renderShell(<Header routeLabels={{ users: 'Navigation.Users' }} />, { route: '/users' });
    expect(screen.getByText('Navigation.Users')).toBeInTheDocument();
  });

  it('renders root link + detail page for a two-segment route', () => {
    renderShell(<Header routeLabels={{ users: 'Navigation.Users' }} />, { route: '/users/42' });
    const link = screen.getByRole('link', { name: 'Navigation.Users' });
    expect(link).toHaveAttribute('href', '/users');
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('labels a "new" detail segment with the New label instead of the raw value', () => {
    renderShell(<Header routeLabels={{ users: 'Navigation.Users' }} />, { route: '/users/new' });
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.queryByText('new')).not.toBeInTheDocument();
  });

  it('omits the breadcrumb entirely when the root segment is unmapped', () => {
    renderShell(<Header routeLabels={{}} />, { route: '/unknown/1' });
    expect(screen.queryByText('unknown')).not.toBeInTheDocument();
  });

  it('renders app-supplied actions', () => {
    renderShell(<Header actions={<button type="button">Bell</button>} />, { route: '/' });
    expect(screen.getByRole('button', { name: 'Bell' })).toBeInTheDocument();
  });

  it('shows the "open" right-panel icon and toggles on click when closed', async () => {
    sidebarOpen = false;
    const { user } = renderShell(<Header />, { route: '/' });
    const toggleButton = screen.getByRole('button', { name: 'Toggle right panel' });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggleButton);
    expect(toggle).toHaveBeenCalledTimes(1);
  });

  it('reflects the expanded state when the right panel is open', () => {
    sidebarOpen = true;
    renderShell(<Header />, { route: '/' });
    expect(screen.getByRole('button', { name: 'Toggle right panel' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('opens the command palette when the trigger is clicked', async () => {
    const { user } = renderShell(<Header />, { route: '/' });
    await user.click(screen.getByRole('button', { name: 'Open command palette' }));
    expect(dispatchSpy).toHaveBeenCalledTimes(1);
  });
});
