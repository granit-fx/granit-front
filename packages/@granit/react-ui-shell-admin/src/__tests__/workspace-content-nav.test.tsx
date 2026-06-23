import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  emptyFeatureRoutes,
  makeItem,
  makeT,
  makeTree,
  makeWorkspace,
  renderShell,
} from './test-utils';

import type { WorkspaceTreeResponse } from '@granit/workspaces';

// resolveLabel is a real (pure) export of @granit/react-localization (#770);
// keep it via importOriginal and override only useTranslation for the test.
vi.mock('@granit/react-localization', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@granit/react-localization')>()),
  useTranslation: () => ({ t: makeT() }),
}));

vi.mock('./workspace-icon', () => ({
  WorkspaceIcon: ({ name }: { name: string | null }) => <span data-slot="icon">{name ?? ''}</span>,
}));

let tree: WorkspaceTreeResponse | undefined;
let activeWorkspaceName: string | null = 'crm';

vi.mock('@granit/react-workspaces', () => ({
  useWorkspaces: () => ({ data: tree }),
  useFeatureRouteTable: () => emptyFeatureRoutes,
}));

vi.mock('../use-active-workspace', () => ({
  useActiveWorkspace: () => ({ activeWorkspaceName, setActiveWorkspace: vi.fn() }),
}));

const { WorkspaceContentNav } = await import('../workspace-content-nav');

function setState(next: { tree?: WorkspaceTreeResponse; active?: string | null }) {
  tree = next.tree;
  activeWorkspaceName = next.active ?? null;
}

describe('WorkspaceContentNav', () => {
  it('returns null when no workspace data is loaded', () => {
    setState({ tree: undefined, active: 'crm' });
    const { container } = renderShell(<WorkspaceContentNav />);
    expect(container.querySelector('[data-slot="workspace-content-section"]')).toBeNull();
  });

  it('returns null when there is no active workspace', () => {
    setState({ tree: makeTree([makeWorkspace()]), active: null });
    const { container } = renderShell(<WorkspaceContentNav />);
    expect(container.querySelector('[data-slot="workspace-content-section"]')).toBeNull();
  });

  it('returns null when the active workspace is not in the tree', () => {
    setState({ tree: makeTree([makeWorkspace({ name: 'other' })]), active: 'crm' });
    const { container } = renderShell(<WorkspaceContentNav />);
    expect(container.querySelector('[data-slot="workspace-content-section"]')).toBeNull();
  });

  it('returns null when the active workspace has no sections with items', () => {
    setState({
      tree: makeTree([makeWorkspace({ name: 'crm', sections: [] })]),
      active: 'crm',
    });
    const { container } = renderShell(<WorkspaceContentNav />);
    expect(container.querySelector('[data-slot="workspace-content-section"]')).toBeNull();
  });

  it('renders a section label from displayKey and a default label otherwise', () => {
    setState({
      tree: makeTree([
        makeWorkspace({
          name: 'crm',
          sections: [
            {
              key: 'people',
              displayKey: 'Crm:People',
              order: 0,
              collapsedByDefault: false,
              items: [makeItem({ kind: 'Entity', entityName: 'Party', displayKey: 'Crm:Party' })],
            },
            {
              key: 'misc',
              displayKey: null,
              order: 1,
              collapsedByDefault: false,
              items: [makeItem({ kind: 'Entity', entityName: 'Note', displayKey: null })],
            },
          ],
        }),
      ]),
      active: 'crm',
    });
    renderShell(<WorkspaceContentNav />, { route: '/' });
    // displayKey present -> last segment fallback "People"
    expect(screen.getByText('People')).toBeInTheDocument();
    // no displayKey -> default "Items" label
    expect(screen.getByText('Items')).toBeInTheDocument();
  });

  it('renders an active leaf item as a link when the route matches its href', () => {
    setState({
      tree: makeTree([
        makeWorkspace({
          name: 'crm',
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
      ]),
      active: 'crm',
    });
    renderShell(<WorkspaceContentNav />, { route: '/w/crm/Party' });
    const link = screen.getByRole('link', { name: 'Party' });
    expect(link).toHaveAttribute('href', '/w/crm/Party');
    expect(link).toHaveAttribute('data-active', 'true');
  });

  it('renders a disabled leaf item (no href) without a link', () => {
    setState({
      tree: makeTree([
        makeWorkspace({
          name: 'crm',
          sections: [
            {
              key: 's',
              displayKey: null,
              order: 0,
              collapsedByDefault: false,
              // Entity with no entityName -> resolveItemHref returns null.
              items: [makeItem({ kind: 'Entity', entityName: null, displayKey: 'Crm:Empty' })],
            },
          ],
        }),
      ]),
      active: 'crm',
    });
    renderShell(<WorkspaceContentNav />, { route: '/' });
    expect(screen.getByText('Empty')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Empty' })).not.toBeInTheDocument();
  });

  it('renders a SubWorkspace as a collapsible group with its children', () => {
    setState({
      tree: makeTree([
        makeWorkspace({
          name: 'framework',
          sections: [
            {
              key: 'shells',
              displayKey: null,
              order: 0,
              collapsedByDefault: false,
              items: [
                makeItem({
                  kind: 'SubWorkspace',
                  subWorkspaceName: 'identity',
                  displayKey: 'Fw:Identity',
                }),
              ],
            },
          ],
        }),
        makeWorkspace({
          name: 'identity',
          isShell: true,
          sections: [
            {
              key: 'idsec',
              displayKey: null,
              order: 0,
              collapsedByDefault: false,
              items: [
                makeItem({ kind: 'Entity', entityName: 'User', displayKey: 'Id:User' }),
                makeItem({ kind: 'Entity', entityName: null, displayKey: 'Id:Disabled' }),
              ],
            },
          ],
        }),
      ]),
      active: 'framework',
    });
    renderShell(<WorkspaceContentNav />, { route: '/w/identity/User' });
    // Parent group trigger label.
    expect(screen.getByText('Identity')).toBeInTheDocument();
    // Active child renders as a link; disabled child as plain text.
    const childLink = screen.getByRole('link', { name: 'User' });
    expect(childLink).toHaveAttribute('href', '/w/identity/User');
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('falls back to a leaf item when the SubWorkspace target is missing', () => {
    setState({
      tree: makeTree([
        makeWorkspace({
          name: 'framework',
          sections: [
            {
              key: 'shells',
              displayKey: null,
              order: 0,
              collapsedByDefault: false,
              items: [
                makeItem({
                  kind: 'SubWorkspace',
                  subWorkspaceName: 'ghost',
                  displayKey: 'Fw:Ghost',
                }),
              ],
            },
          ],
        }),
      ]),
      active: 'framework',
    });
    renderShell(<WorkspaceContentNav />, { route: '/' });
    // SubWorkspace href resolves to /w/ghost even without a matching workspace node.
    const link = screen.getByRole('link', { name: 'Ghost' });
    expect(link).toHaveAttribute('href', '/w/ghost');
  });
});
