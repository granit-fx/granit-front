import { mockWorkspaces } from '@granit/react-ai/testing';
import { screen } from '@testing-library/react';

import { WorkspaceTable } from '../components/workspace-table';

import { renderWithProviders } from './test-utils';

import type { AIWorkspaceResponse } from '@granit/ai';
import type { DataTableColumnDef } from '@granit/react-ui-kit';

const columns: DataTableColumnDef<AIWorkspaceResponse, unknown>[] = [
  { id: 'key', accessorKey: 'key', header: 'Key', cell: ({ row }) => row.original.key },
  {
    id: 'provider',
    accessorKey: 'provider',
    header: 'Provider',
    cell: ({ row }) => row.original.provider,
  },
];

describe('WorkspaceTable', () => {
  it('renders a header row and a body row per workspace', () => {
    renderWithProviders(<WorkspaceTable data={mockWorkspaces} columns={columns} />);
    expect(screen.getByText('Key')).toBeInTheDocument();
    for (const ws of mockWorkspaces) {
      expect(screen.getByText(ws.key)).toBeInTheDocument();
    }
  });

  it('invokes onRowClick with the clicked workspace', async () => {
    const onRowClick = vi.fn();
    const { user } = renderWithProviders(
      <WorkspaceTable data={mockWorkspaces} columns={columns} onRowClick={onRowClick} />
    );
    await user.click(screen.getByText(mockWorkspaces[0]!.key));
    expect(onRowClick).toHaveBeenCalledWith(mockWorkspaces[0]);
  });

  it('renders without a click handler', () => {
    renderWithProviders(<WorkspaceTable data={mockWorkspaces} columns={columns} />);
    expect(document.querySelector('[data-slot="workspace-table"]')).toBeInTheDocument();
  });
});
