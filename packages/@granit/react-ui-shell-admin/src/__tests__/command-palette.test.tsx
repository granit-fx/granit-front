import { act, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OPEN_COMMAND_PALETTE_EVENT } from '../command-palette-events';

import {
  emptyFeatureRoutes,
  makeItem,
  makeT,
  makeTree,
  makeWorkspace,
  renderShell,
} from './test-utils';

import type { WorkspaceTreeResponse } from '@granit/workspaces';
import type * as ReactRouter from 'react-router-dom';

// resolveLabel is a real (pure) export of @granit/react-localization (#770);
// keep it via importOriginal and override only useTranslation for the test.
vi.mock('@granit/react-localization', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@granit/react-localization')>()),
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
const setActiveWorkspace = vi.fn();

vi.mock('@granit/react-workspaces', () => ({
  useWorkspaces: () => ({ data: tree }),
  useFeatureRouteTable: () => emptyFeatureRoutes,
}));

vi.mock('../use-active-workspace', () => ({
  useActiveWorkspace: () => ({ activeWorkspaceName: null, setActiveWorkspace }),
}));

const { CommandPalette } = await import('../command-palette');

function openViaEvent() {
  act(() => {
    globalThis.dispatchEvent(new CustomEvent(OPEN_COMMAND_PALETTE_EVENT));
  });
}

beforeEach(() => {
  navigate.mockClear();
  setActiveWorkspace.mockClear();
  tree = undefined;
});

describe('CommandPalette', () => {
  it('renders nothing visible until opened', () => {
    tree = makeTree([makeWorkspace({ name: 'crm', displayKey: 'Crm:Customers' })]);
    renderShell(<CommandPalette />);
    expect(screen.queryByPlaceholderText('Type a command or search…')).not.toBeInTheDocument();
  });

  it('opens on the custom event and lists workspaces and items', async () => {
    tree = makeTree([
      makeWorkspace({
        name: 'crm',
        displayKey: 'Crm:Customers',
        sections: [
          {
            key: 's',
            displayKey: null,
            order: 0,
            collapsedByDefault: false,
            items: [makeItem({ kind: 'Entity', entityName: 'Party', displayKey: 'Crm:Party' })],
          },
        ],
      }),
    ]);
    renderShell(<CommandPalette />);
    openViaEvent();
    expect(await screen.findByPlaceholderText('Type a command or search…')).toBeInTheDocument();
    expect(screen.getByText('Workspaces')).toBeInTheDocument();
    expect(screen.getByText('Items')).toBeInTheDocument();
    // "Customers" appears as the workspace entry and as each item's parent label.
    expect(screen.getAllByText('Customers').length).toBeGreaterThan(0);
    expect(screen.getByText('Party')).toBeInTheDocument();
  });

  it('hides the workspace group when only shell workspaces exist but still lists their items', async () => {
    tree = makeTree([
      makeWorkspace({
        name: 'identity',
        isShell: true,
        displayKey: 'Id:Identity',
        sections: [
          {
            key: 's',
            displayKey: null,
            order: 0,
            collapsedByDefault: false,
            items: [makeItem({ kind: 'Entity', entityName: 'User', displayKey: 'Id:User' })],
          },
        ],
      }),
    ]);
    renderShell(<CommandPalette />);
    openViaEvent();
    await screen.findByPlaceholderText('Type a command or search…');
    // No switchable (non-shell) workspaces -> the Workspaces group is omitted.
    expect(screen.queryByText('Workspaces')).not.toBeInTheDocument();
    // But the shell's items are still flattened into the Items group.
    expect(screen.getByText('Items')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
  });

  it('renders the empty list when no workspaces are loaded', async () => {
    tree = makeTree([]);
    renderShell(<CommandPalette />);
    openViaEvent();
    await screen.findByPlaceholderText('Type a command or search…');
    expect(screen.queryByText('Workspaces')).not.toBeInTheDocument();
    expect(screen.queryByText('Items')).not.toBeInTheDocument();
  });

  it('navigates and sets the active workspace when a workspace entry is selected', async () => {
    tree = makeTree([makeWorkspace({ name: 'crm', displayKey: 'Crm:Customers' })]);
    const { user } = renderShell(<CommandPalette />);
    openViaEvent();
    await screen.findByPlaceholderText('Type a command or search…');
    await user.click(screen.getByText('Customers'));
    expect(setActiveWorkspace).toHaveBeenCalledWith('crm');
    expect(navigate).toHaveBeenCalledWith('/w/crm');
  });

  it('navigates to an item href and sets its parent workspace active', async () => {
    tree = makeTree([
      makeWorkspace({
        name: 'crm',
        displayKey: 'Crm:Customers',
        sections: [
          {
            key: 's',
            displayKey: null,
            order: 0,
            collapsedByDefault: false,
            items: [makeItem({ kind: 'Entity', entityName: 'Party', displayKey: 'Crm:Party' })],
          },
        ],
      }),
    ]);
    const { user } = renderShell(<CommandPalette />);
    openViaEvent();
    await screen.findByPlaceholderText('Type a command or search…');
    await user.click(screen.getByText('Party'));
    expect(setActiveWorkspace).toHaveBeenCalledWith('crm');
    expect(navigate).toHaveBeenCalledWith('/w/crm/Party');
  });

  it('opens external links in a new tab instead of navigating', async () => {
    const openSpy = vi.spyOn(globalThis, 'open').mockImplementation(() => null);
    tree = makeTree([
      makeWorkspace({
        name: 'crm',
        displayKey: 'Crm:Customers',
        sections: [
          {
            key: 's',
            displayKey: null,
            order: 0,
            collapsedByDefault: false,
            items: [
              makeItem({ kind: 'Link', linkUrl: 'https://example.com', displayKey: 'Crm:Docs' }),
            ],
          },
        ],
      }),
    ]);
    const { user } = renderShell(<CommandPalette />);
    openViaEvent();
    await screen.findByPlaceholderText('Type a command or search…');
    await user.click(screen.getByText('Docs'));
    expect(openSpy).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
    expect(navigate).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it('does not navigate when a disabled item (no href) is selected', async () => {
    tree = makeTree([
      makeWorkspace({
        name: 'crm',
        displayKey: 'Crm:Customers',
        sections: [
          {
            key: 's',
            displayKey: null,
            order: 0,
            collapsedByDefault: false,
            // Entity with no entityName -> resolveItemHref returns null -> disabled.
            items: [makeItem({ kind: 'Entity', entityName: null, displayKey: 'Crm:Empty' })],
          },
        ],
      }),
    ]);
    const { user } = renderShell(<CommandPalette />);
    openViaEvent();
    await screen.findByPlaceholderText('Type a command or search…');
    await user.click(screen.getByText('Empty'));
    expect(navigate).not.toHaveBeenCalled();
    expect(setActiveWorkspace).not.toHaveBeenCalled();
  });

  it('toggles open via the Ctrl+K shortcut', async () => {
    tree = makeTree([makeWorkspace({ name: 'crm', displayKey: 'Crm:Customers' })]);
    renderShell(<CommandPalette />);
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    });
    expect(await screen.findByPlaceholderText('Type a command or search…')).toBeInTheDocument();
  });
});
