import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeT, makeTree, makeWorkspace, renderShell } from './test-utils';

import type { WorkspaceTreeResponse } from '@granit/workspaces';
import type * as ReactRouter from 'react-router';

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
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof ReactRouter>();
  return { ...actual, useNavigate: () => navigate };
});

let tree: WorkspaceTreeResponse | undefined;
let isLoading = false;
const setActiveWorkspace = vi.fn();

vi.mock('@granit/react-workspaces', () => ({
  useWorkspaces: () => ({ data: tree, isLoading }),
}));

vi.mock('../use-active-workspace', () => ({
  useActiveWorkspace: () => ({ activeWorkspaceName: null, setActiveWorkspace }),
}));

const { HostHomePage } = await import('../host-home-page');

beforeEach(() => {
  navigate.mockClear();
  setActiveWorkspace.mockClear();
  tree = undefined;
  isLoading = false;
});

describe('HostHomePage', () => {
  it('renders the title and subtitle', () => {
    tree = makeTree([]);
    renderShell(<HostHomePage />);
    expect(screen.getByRole('heading', { name: 'Granit Showcase' })).toBeInTheDocument();
    expect(screen.getByText('Choose a workspace to get started.')).toBeInTheDocument();
  });

  it('renders skeleton tiles while loading', () => {
    isLoading = true;
    renderShell(<HostHomePage />);
    expect(document.querySelector('[data-slot="host-home-grid"]')).toBeNull();
    expect(screen.queryByText('No workspaces are registered for the current user.')).toBeNull();
  });

  it('renders the empty state when no non-shell workspaces exist', () => {
    tree = makeTree([makeWorkspace({ name: 'identity', isShell: true })]);
    renderShell(<HostHomePage />);
    expect(
      screen.getByText('No workspaces are registered for the current user.')
    ).toBeInTheDocument();
  });

  it('renders a tile per launcher workspace, filtering out shells', () => {
    tree = makeTree([
      makeWorkspace({ name: 'crm', displayKey: 'Crm:Customers' }),
      makeWorkspace({ name: 'identity', isShell: true, displayKey: 'Id:Identity' }),
    ]);
    renderShell(<HostHomePage />);
    const tiles = document.querySelectorAll('[data-slot="host-home-tile"]');
    expect(tiles).toHaveLength(1);
    expect(screen.getByText('Customers')).toBeInTheDocument();
    expect(screen.queryByText('Identity')).not.toBeInTheDocument();
  });

  it('selects the workspace and navigates when a tile is clicked', async () => {
    tree = makeTree([makeWorkspace({ name: 'crm', displayKey: 'Crm:Customers' })]);
    const { user } = renderShell(<HostHomePage />);
    await user.click(screen.getByText('Customers'));
    expect(setActiveWorkspace).toHaveBeenCalledWith('crm');
    expect(navigate).toHaveBeenCalledWith('/w/crm');
  });
});
