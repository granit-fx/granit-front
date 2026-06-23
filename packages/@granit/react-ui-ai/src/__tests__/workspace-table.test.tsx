import { mockWorkspaces } from '@granit/react-ai/testing';
import { screen } from '@testing-library/react';

import { WorkspaceTable } from '../components/workspace-table';

import { renderWithProviders } from './test-utils';

import type { AIWorkspaceResponse } from '@granit/ai';
import type { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<AIWorkspaceResponse, unknown>[] = [
  { id: 'name', accessorKey: 'name', header: 'Name', cell: ({ row }) => row.original.name },
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
    expect(screen.getByText('Name')).toBeInTheDocument();
    for (const ws of mockWorkspaces) {
      expect(screen.getByText(ws.name)).toBeInTheDocument();
    }
  });

  it('invokes onRowClick with the clicked workspace', async () => {
    const onRowClick = vi.fn();
    const { user } = renderWithProviders(
      <WorkspaceTable data={mockWorkspaces} columns={columns} onRowClick={onRowClick} />
    );
    await user.click(screen.getByText(mockWorkspaces[0]!.name));
    expect(onRowClick).toHaveBeenCalledWith(mockWorkspaces[0]);
  });

  it('renders without a click handler', () => {
    renderWithProviders(<WorkspaceTable data={mockWorkspaces} columns={columns} />);
    expect(document.querySelector('[data-slot="workspace-table"]')).toBeInTheDocument();
  });
});
