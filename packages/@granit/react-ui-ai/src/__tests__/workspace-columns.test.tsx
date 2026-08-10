import { mockWorkspaces } from '@granit/react-ai/testing';
import { render, screen } from '@testing-library/react';

import { createWorkspaceColumns } from '../components/workspace-columns';

import { renderWithProviders, testI18n } from './test-utils';

import type { AIWorkspaceResponse } from '@granit/ai';
import type { useTranslation } from '@granit/react-localization';
import type { DataTableCellContext, DataTableColumnDef } from '@granit/react-ui-kit';

vi.mock('@granit/ai', () => ({
  AI_WORKSPACE_KINDS: { SYSTEM: 'System', DYNAMIC: 'Dynamic' },
}));

const t = ((key: string) => testI18n.t(key)) as ReturnType<typeof useTranslation>['t'];

function makeColumns(overrides?: {
  onView?: (ws: AIWorkspaceResponse) => void;
  onEdit?: (ws: AIWorkspaceResponse) => void;
  onDelete?: (ws: AIWorkspaceResponse) => void;
  canManage?: boolean;
}) {
  return createWorkspaceColumns({
    t,
    onView: overrides?.onView ?? vi.fn(),
    onEdit: overrides?.onEdit ?? vi.fn(),
    onDelete: overrides?.onDelete ?? vi.fn(),
    canManage: overrides?.canManage ?? true,
  });
}

function getCol(columns: DataTableColumnDef<AIWorkspaceResponse, unknown>[], id: string) {
  const col = columns.find((c) => c.id === id);
  if (!col) throw new Error(`column ${id} not found`);
  return col;
}

function renderCell(
  columns: DataTableColumnDef<AIWorkspaceResponse, unknown>[],
  id: string,
  ws: AIWorkspaceResponse
) {
  const col = getCol(columns, id);
  const cell = col.cell as (
    ctx: DataTableCellContext<AIWorkspaceResponse, unknown>
  ) => React.ReactNode;
  return renderWithProviders(<>{cell({ row: { original: ws } } as never)}</>);
}

describe('createWorkspaceColumns', () => {
  const systemWs = mockWorkspaces.find((w) => w.kind === 'System')!;
  const dynamicWs = mockWorkspaces.find((w) => w.kind === 'Dynamic' && w.activated)!;
  const inactiveWs = mockWorkspaces.find((w) => !w.activated)!;

  it('exposes the expected column ids', () => {
    const ids = makeColumns().map((c) => c.id);
    expect(ids).toEqual(['key', 'provider', 'model', 'kind', 'activated', 'actions']);
  });

  it('renders the name cell with the workspace name', () => {
    renderCell(makeColumns(), 'key', dynamicWs);
    expect(screen.getByText(dynamicWs.key)).toBeInTheDocument();
  });

  it('renders the model cell with the model id', () => {
    renderCell(makeColumns(), 'model', dynamicWs);
    expect(screen.getByText(dynamicWs.model)).toBeInTheDocument();
  });

  it('renders the System badge for a system workspace', () => {
    renderCell(makeColumns(), 'kind', systemWs);
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('renders the Dynamic badge for a dynamic workspace', () => {
    renderCell(makeColumns(), 'kind', dynamicWs);
    expect(screen.getByText('Dynamic')).toBeInTheDocument();
  });

  it('renders the Enabled status badge when activated', () => {
    renderCell(makeColumns(), 'activated', dynamicWs);
    expect(screen.getByText('Enabled')).toBeInTheDocument();
  });

  it('renders the Disabled status badge when not activated', () => {
    renderCell(makeColumns(), 'activated', inactiveWs);
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('offers Edit and Delete for a manageable dynamic workspace', async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const { user } = renderCell(makeColumns({ onEdit, onDelete }), 'actions', dynamicWs);

    await user.click(screen.getByRole('button', { name: `Actions for ${dynamicWs.key}` }));
    await user.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledWith(dynamicWs);

    await user.click(screen.getByRole('button', { name: `Actions for ${dynamicWs.key}` }));
    await user.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledWith(dynamicWs);
  });

  it('offers only View for a system workspace', async () => {
    const onView = vi.fn();
    const { user } = renderCell(makeColumns({ onView }), 'actions', systemWs);

    await user.click(screen.getByRole('button', { name: `Actions for ${systemWs.key}` }));
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    await user.click(screen.getByText('View'));
    expect(onView).toHaveBeenCalledWith(systemWs);
  });

  it('offers only View when the user cannot manage', async () => {
    const onView = vi.fn();
    const { user } = renderCell(makeColumns({ onView, canManage: false }), 'actions', dynamicWs);

    await user.click(screen.getByRole('button', { name: `Actions for ${dynamicWs.key}` }));
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    await user.click(screen.getByText('View'));
    expect(onView).toHaveBeenCalledWith(dynamicWs);
  });

  it('renders header strings via the translate fn', () => {
    const columns = makeColumns();
    render(<>{getCol(columns, 'key').header as string}</>);
    expect(screen.getByText('Unique key')).toBeInTheDocument();
  });
});
