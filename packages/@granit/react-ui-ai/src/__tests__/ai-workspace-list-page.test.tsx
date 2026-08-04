import { mockWorkspaces } from '@granit/react-ai/testing';
import { screen, waitFor } from '@testing-library/react';

import { AIWorkspaceListPage } from '../components/ai-workspace-list-page';

import { renderWithProviders } from './test-utils';

import type { AIWorkspaceListResponse } from '@granit/ai';
import type { ReactNode } from 'react';

const dataMock = vi.hoisted(() => ({
  data: { workspaces: [] } as AIWorkspaceListResponse | undefined,
  isLoading: false,
  removeAsync: vi.fn<(name: string) => Promise<void>>(),
  canManage: true,
}));

const navigateMock = vi.hoisted(() => vi.fn());
const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useNavigate: () => navigateMock,
}));

vi.mock('sonner', () => ({ toast: toastMock }));

vi.mock('@granit/react-ai', () => ({
  useAIWorkspaces: () => ({ data: dataMock.data, isLoading: dataMock.isLoading }),
  useDeleteAIWorkspace: () => ({ removeAsync: dataMock.removeAsync, isPending: false }),
}));

vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: () => dataMock.canManage, isLoading: false }),
}));

// Deterministic grid/list toggle: a single button that flips to the kanban view.
vi.mock('@granit/react-ui-kit', () => ({
  ViewSwitcher: ({ onViewChange }: { onViewChange: (view: 'list' | 'kanban') => void }) => (
    <button type="button" onClick={() => onViewChange('kanban')}>
      toggle-grid
    </button>
  ),
  ConfirmActionDialog: ({
    open,
    title,
    description,
    confirmLabel,
    onConfirm,
    isPending,
  }: {
    open: boolean;
    title: ReactNode;
    description?: ReactNode;
    confirmLabel: ReactNode;
    onConfirm: () => void;
    isPending?: boolean;
  }) =>
    open ? (
      <div role="alertdialog">
        <div>{title}</div>
        {description !== undefined && <div>{description}</div>}
        <button type="button" onClick={onConfirm} disabled={isPending}>
          {confirmLabel}
        </button>
      </div>
    ) : null,
}));

vi.mock('@granit/ai', () => ({
  AIPermissions: {
    Workspaces: { Read: 'AI.Workspaces.Read', Manage: 'AI.Workspaces.Manage' },
  },
  AI_WORKSPACE_KINDS: { SYSTEM: 'System', DYNAMIC: 'Dynamic' },
}));

describe('AIWorkspaceListPage', () => {
  beforeEach(() => {
    dataMock.data = { workspaces: [] };
    dataMock.isLoading = false;
    dataMock.canManage = true;
    dataMock.removeAsync.mockReset();
    dataMock.removeAsync.mockResolvedValue(undefined);
    navigateMock.mockReset();
    toastMock.success.mockReset();
  });

  it('renders the page title and create button', () => {
    renderWithProviders(<AIWorkspaceListPage />);
    expect(screen.getByText('AI Workspaces')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new workspace/i })).toBeInTheDocument();
  });

  it('has the data-slot attribute', () => {
    renderWithProviders(<AIWorkspaceListPage />);
    expect(document.querySelector('[data-slot="ai-workspace-list-page"]')).toBeInTheDocument();
  });

  it('shows a spinner while loading', () => {
    dataMock.isLoading = true;
    renderWithProviders(<AIWorkspaceListPage />);
    expect(document.querySelector('[data-slot="ai-workspace-list-page"]')).not.toBeInTheDocument();
  });

  it('hides the create button when the user cannot manage', () => {
    dataMock.canManage = false;
    renderWithProviders(<AIWorkspaceListPage />);
    expect(screen.queryByRole('button', { name: /new workspace/i })).not.toBeInTheDocument();
  });

  it('navigates to the create page from the create button', async () => {
    const { user } = renderWithProviders(<AIWorkspaceListPage />);
    await user.click(screen.getByRole('button', { name: /new workspace/i }));
    expect(navigateMock).toHaveBeenCalledWith('/ai/workspaces/new');
  });

  it('renders the table rows for each workspace', () => {
    dataMock.data = { workspaces: mockWorkspaces };
    renderWithProviders(<AIWorkspaceListPage />);
    expect(screen.getByText(mockWorkspaces[0]!.key)).toBeInTheDocument();
  });

  it('navigates to the detail page when a table row is clicked', async () => {
    dataMock.data = { workspaces: mockWorkspaces };
    const { user } = renderWithProviders(<AIWorkspaceListPage />);
    await user.click(screen.getByText(mockWorkspaces[0]!.key));
    expect(navigateMock).toHaveBeenCalledWith(`/ai/workspaces/${mockWorkspaces[0]!.key}`);
  });

  it('switches to the grid view and renders workspace cards', async () => {
    dataMock.data = { workspaces: mockWorkspaces };
    const { user } = renderWithProviders(<AIWorkspaceListPage />);
    await user.click(screen.getByRole('button', { name: 'toggle-grid' }));
    // The grid card view shows a "provider / model" caption per card.
    expect(
      screen.getByText(`${mockWorkspaces[0]!.provider} / ${mockWorkspaces[0]!.model}`)
    ).toBeInTheDocument();
  });

  it('navigates from a grid card click and stops propagation on its View button', async () => {
    const systemWs = mockWorkspaces.find((w) => w.kind === 'System')!;
    dataMock.data = { workspaces: [systemWs] };
    const { user } = renderWithProviders(<AIWorkspaceListPage />);
    await user.click(screen.getByRole('button', { name: 'toggle-grid' }));

    // System card exposes a View button (read-only) and a System badge.
    expect(screen.getByText('System')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'View' }));
    expect(navigateMock).toHaveBeenCalledWith(`/ai/workspaces/${systemWs.key}`);
  });

  it('opens the delete dialog from a grid card Delete button', async () => {
    const dynamicWs = mockWorkspaces.find((w) => w.kind === 'Dynamic')!;
    dataMock.data = { workspaces: [dynamicWs] };
    const { user } = renderWithProviders(<AIWorkspaceListPage />);
    await user.click(screen.getByRole('button', { name: 'toggle-grid' }));

    // Card exposes Edit + Delete for a manageable dynamic workspace.
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    // The card's Delete button stops propagation, so no navigation happens.
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('deletes a workspace via the delete dialog and shows a success toast', async () => {
    const dynamicWs = mockWorkspaces.find((w) => w.kind === 'Dynamic')!;
    dataMock.data = { workspaces: [dynamicWs] };
    const { user } = renderWithProviders(<AIWorkspaceListPage />);

    await user.click(screen.getByRole('button', { name: `Actions for ${dynamicWs.key}` }));
    await user.click(screen.getByText('Delete'));

    const confirmButtons = screen.getAllByRole('button', { name: 'Delete' });
    await user.click(confirmButtons[confirmButtons.length - 1]!);

    await waitFor(() => expect(dataMock.removeAsync).toHaveBeenCalledWith(dynamicWs.key));
    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith('Workspace deleted successfully')
    );
  });

  it('logs and keeps the dialog open when deletion fails', async () => {
    const dynamicWs = mockWorkspaces.find((w) => w.kind === 'Dynamic')!;
    dataMock.data = { workspaces: [dynamicWs] };
    dataMock.removeAsync.mockRejectedValue(new Error('boom'));
    const { user } = renderWithProviders(<AIWorkspaceListPage />);

    await user.click(screen.getByRole('button', { name: `Actions for ${dynamicWs.key}` }));
    await user.click(screen.getByText('Delete'));
    const confirmButtons = screen.getAllByRole('button', { name: 'Delete' });
    await user.click(confirmButtons[confirmButtons.length - 1]!);

    await waitFor(() => expect(dataMock.removeAsync).toHaveBeenCalled());
    expect(toastMock.success).not.toHaveBeenCalled();
  });
});
