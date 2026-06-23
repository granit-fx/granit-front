import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeT, makeTree, makeWorkspace, renderShell } from './test-utils';

import type { WorkspaceTreeResponse } from '@granit/workspaces';
import type * as ReactRouter from 'react-router-dom';

// resolveLabel is a real (pure) export of @granit/react-localization (#770);
// keep it via importOriginal and override only useTranslation for the test.
vi.mock('@granit/react-localization', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useTranslation: () => ({ t: makeT() }),
}));

vi.mock('./workspace-icon', () => ({
  WorkspaceIcon: ({ name }: { name: string | null }) => <span data-slot="icon">{name ?? ''}</span>,
}));

const navigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof ReactRouter>();
  return { ...actual, useNavigate: () => navigate };
});

let tree: WorkspaceTreeResponse | undefined;
let isLoading = false;
let activeWorkspaceName: string | null = null;
const setActiveWorkspace = vi.fn();

vi.mock('@granit/react-workspaces', () => ({
  useWorkspaces: () => ({ data: tree, isLoading }),
}));

vi.mock('../use-active-workspace', () => ({
  useActiveWorkspace: () => ({ activeWorkspaceName, setActiveWorkspace }),
}));

const { WorkspaceSwitcherMenu } = await import('../workspace-switcher-menu');

beforeEach(() => {
  navigate.mockClear();
  setActiveWorkspace.mockClear();
  tree = undefined;
  isLoading = false;
  activeWorkspaceName = null;
});

describe('WorkspaceSwitcherMenu', () => {
  it('shows the no-active-workspace title/subtitle when none is selected', () => {
    tree = makeTree([makeWorkspace({ name: 'crm', displayKey: 'Crm:Name' })]);
    renderShell(<WorkspaceSwitcherMenu />);
    expect(screen.getByText('Common.AppName')).toBeInTheDocument();
    expect(screen.getByText('No workspace selected')).toBeInTheDocument();
  });

  it('shows the active workspace label and app subtitle when one is selected', () => {
    tree = makeTree([makeWorkspace({ name: 'crm', displayKey: 'Crm:Name' })]);
    activeWorkspaceName = 'crm';
    renderShell(<WorkspaceSwitcherMenu />, { route: '/w/crm' });
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Granit Showcase')).toBeInTheDocument();
  });

  it('shows the loading state inside the menu while workspaces load', async () => {
    isLoading = true;
    const { user } = renderShell(<WorkspaceSwitcherMenu />);
    await user.click(screen.getByRole('button'));
    expect(await screen.findByText('Loading…')).toBeInTheDocument();
  });

  it('shows the empty state when no switchable workspaces remain', async () => {
    // Only a shell workspace -> filtered out of the switchable list.
    tree = makeTree([makeWorkspace({ name: 'identity', isShell: true })]);
    const { user } = renderShell(<WorkspaceSwitcherMenu />);
    await user.click(screen.getByRole('button'));
    expect(await screen.findByText('No workspaces available')).toBeInTheDocument();
  });

  it('lists switchable workspaces, marks the active one, and navigates on click', async () => {
    tree = makeTree([
      makeWorkspace({ name: 'crm', displayKey: 'Crm:Customers' }),
      makeWorkspace({ name: 'sales', displayKey: 'Sales:Pipeline' }),
      makeWorkspace({ name: 'identity', isShell: true }),
    ]);
    activeWorkspaceName = 'crm';
    const { user } = renderShell(<WorkspaceSwitcherMenu />, { route: '/w/crm' });
    await user.click(screen.getByRole('button'));

    const salesItem = await screen.findByRole('menuitem', { name: 'Pipeline' });
    expect(salesItem).toBeInTheDocument();
    // Active workspace is flagged.
    expect(screen.getByRole('menuitem', { name: 'Customers' })).toHaveAttribute(
      'data-active',
      'true'
    );

    await user.click(salesItem);
    expect(setActiveWorkspace).toHaveBeenCalledWith('sales');
    expect(navigate).toHaveBeenCalledWith('/w/sales');
  });

  it('navigates home from the Home menu entry', async () => {
    tree = makeTree([makeWorkspace({ name: 'crm', displayKey: 'Crm:Name' })]);
    const { user } = renderShell(<WorkspaceSwitcherMenu />);
    await user.click(screen.getByRole('button'));
    await user.click(await screen.findByRole('menuitem', { name: 'Home' }));
    expect(navigate).toHaveBeenCalledWith('/');
  });
});
