import { screen } from '@testing-library/react';
import { Folder } from 'lucide-react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeItem, makeT, makeTree, makeWorkspace, renderShell } from './test-utils';

import type { ShellNavGroup, ShellNavItem } from '../shell-chrome-context';
import type { WorkspaceTreeResponse } from '@granit/workspaces';

vi.mock('@granit/react-localization', () => ({ useTranslation: () => ({ t: makeT() }) }));

// Stub the two heavy child trees; they have their own dedicated tests.
vi.mock('../workspace-content-nav', () => ({
  WorkspaceContentNav: () => <div data-slot="workspace-content-nav" />,
}));
vi.mock('../workspace-switcher-menu', () => ({
  WorkspaceSwitcherMenu: () => <div data-slot="workspace-switcher" />,
}));

let granted: Set<string>;
vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: (p: string) => granted.has(p) }),
}));

let tree: WorkspaceTreeResponse | undefined;
let activeWorkspaceName: string | null = null;
vi.mock('@granit/react-workspaces', () => ({
  useWorkspaces: () => ({ data: tree }),
}));
vi.mock('../use-active-workspace', () => ({
  useActiveWorkspace: () => ({ activeWorkspaceName, setActiveWorkspace: vi.fn() }),
}));

let chrome: {
  appKind: 'host' | 'tenant';
  navModel: { mainNavigation: ShellNavItem[]; navGroups: ShellNavGroup[] };
  appVersion?: string;
};
vi.mock('../shell-chrome-context', () => ({
  useShellChrome: () => chrome,
}));

const { AppSidebar } = await import('../app-sidebar');

const leaf = (over: Partial<ShellNavItem> = {}): ShellNavItem => ({
  titleKey: 'Nav.Item',
  href: '/users',
  icon: Folder,
  ...over,
});

beforeEach(() => {
  granted = new Set();
  tree = undefined;
  activeWorkspaceName = null;
  chrome = {
    appKind: 'tenant',
    navModel: { mainNavigation: [], navGroups: [] },
  };
});

describe('AppSidebar', () => {
  it('renders the static admin-console nav when no workspace nav is active', () => {
    chrome.navModel.mainNavigation = [leaf({ titleKey: 'Users', href: '/users' })];
    renderShell(<AppSidebar />, { route: '/' });
    expect(screen.getByText('Admin Console')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Users' })).toHaveAttribute('href', '/users');
    expect(screen.queryByTestId('workspace-content-nav')).not.toBeInTheDocument();
  });

  it('marks a static nav item active when the route matches', () => {
    chrome.navModel.mainNavigation = [leaf({ titleKey: 'Users', href: '/users' })];
    renderShell(<AppSidebar />, { route: '/users/42' });
    expect(screen.getByRole('link', { name: 'Users' })).toHaveAttribute('data-active', 'true');
  });

  it('renders a collapsible parent with children and marks the active child', () => {
    chrome.navModel.mainNavigation = [
      leaf({
        titleKey: 'Settings',
        href: '/settings',
        children: [
          { titleKey: 'General', href: '/settings/general' },
          { titleKey: 'Security', href: '/settings/security' },
        ],
      }),
    ];
    renderShell(<AppSidebar />, { route: '/settings/security' });
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Security' })).toHaveAttribute('data-active', 'true');
    expect(screen.getByRole('link', { name: 'General' })).not.toHaveAttribute(
      'data-active',
      'true'
    );
  });

  it('filters main nav items by permission', () => {
    chrome.navModel.mainNavigation = [
      leaf({ titleKey: 'Open', href: '/open' }),
      leaf({ titleKey: 'Locked', href: '/locked', permission: 'admin' }),
    ];
    renderShell(<AppSidebar />, { route: '/' });
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.queryByText('Locked')).not.toBeInTheDocument();
  });

  it('renders a nav group only when it has visible items', () => {
    chrome.navModel.navGroups = [
      { labelKey: 'Group.Visible', items: [leaf({ titleKey: 'Vis', href: '/vis' })] },
      {
        labelKey: 'Group.Hidden',
        items: [leaf({ titleKey: 'Hid', href: '/hid', permission: 'x' })],
      },
    ];
    renderShell(<AppSidebar />, { route: '/' });
    expect(screen.getByText('Group.Visible')).toBeInTheDocument();
    expect(screen.queryByText('Group.Hidden')).not.toBeInTheDocument();
  });

  it('renders the app version footer when provided', () => {
    chrome.appVersion = '1.2.3';
    renderShell(<AppSidebar />, { route: '/' });
    expect(screen.getByText('v1.2.3')).toBeInTheDocument();
  });

  it('renders the app-supplied user menu slot', () => {
    renderShell(<AppSidebar userMenu={<div>UserMenuSlot</div>} />, { route: '/' });
    expect(screen.getByText('UserMenuSlot')).toBeInTheDocument();
  });

  it('uses workspace-driven nav when the active workspace has items', () => {
    activeWorkspaceName = 'crm';
    tree = makeTree([
      makeWorkspace({
        name: 'crm',
        sections: [
          {
            key: 's',
            displayKey: null,
            order: 0,
            collapsedByDefault: false,
            items: [makeItem({ kind: 'Entity', entityName: 'Party' })],
          },
        ],
      }),
    ]);
    renderShell(<AppSidebar />, { route: '/w/crm' });
    expect(document.querySelector('[data-slot="workspace-content-nav"]')).not.toBeNull();
    expect(screen.queryByText('Admin Console')).not.toBeInTheDocument();
  });

  it('falls back to static nav when the active workspace has no items', () => {
    activeWorkspaceName = 'crm';
    tree = makeTree([makeWorkspace({ name: 'crm', sections: [] })]);
    chrome.navModel.mainNavigation = [leaf({ titleKey: 'Users', href: '/users' })];
    renderShell(<AppSidebar />, { route: '/w/crm' });
    expect(screen.getByText('Admin Console')).toBeInTheDocument();
  });
});
