import { mockTenants } from '@granit/react-multi-tenancy/testing';
import { screen, within } from '@testing-library/react';

import { createTenantColumns } from '../components/tenant-columns';

import { renderWithProviders } from './test-utils';

import type { TenantQueryItem } from '../components/types';
import type { DataTableCellContext, DataTableColumnDef } from '@granit/react-ui-kit';
import type { ReactElement } from 'react';

const handlers = {
  onEdit: vi.fn(),
  onToggleStatus: vi.fn(),
};

const baseTenant: TenantQueryItem = mockTenants[0];

function makeTenant(overrides: Partial<TenantQueryItem> = {}): TenantQueryItem {
  return {
    ...baseTenant,
    ...overrides,
  };
}

function buildColumns(
  options: { canUpdate?: boolean; canManage?: boolean } = {}
): DataTableColumnDef<TenantQueryItem, unknown>[] {
  const { canUpdate = true, canManage = true } = options;
  return createTenantColumns({
    t: ((key: string) => key) as never,
    formatDate: () => 'FORMATTED_DATE',
    onEdit: handlers.onEdit,
    onToggleStatus: handlers.onToggleStatus,
    canUpdate,
    canManage,
  });
}

function getCell(
  columns: DataTableColumnDef<TenantQueryItem, unknown>[],
  columnId: string,
  tenant: TenantQueryItem
): ReactElement | null {
  const column = columns.find((c) => c.id === columnId);
  if (!column?.cell || typeof column.cell !== 'function') {
    throw new Error(`Column ${columnId} has no cell renderer`);
  }
  const ctx = { row: { original: tenant } } as unknown as DataTableCellContext<
    TenantQueryItem,
    unknown
  >;
  return column.cell(ctx) as ReactElement | null;
}

function renderCell(
  columns: DataTableColumnDef<TenantQueryItem, unknown>[],
  columnId: string,
  tenant: TenantQueryItem
) {
  return renderWithProviders(<>{getCell(columns, columnId, tenant)}</>);
}

beforeEach(() => {
  handlers.onEdit.mockClear();
  handlers.onToggleStatus.mockClear();
});

describe('createTenantColumns', () => {
  it('produces a column per field plus an actions column', () => {
    const ids = buildColumns()
      .map((c) => c.id)
      .filter(Boolean);
    expect(ids).toEqual([
      'name',
      'identifier',
      'contactEmail',
      'jurisdiction',
      'activated',
      'createdAt',
      'actions',
    ]);
  });

  it('renders the identifier cell in monospace', () => {
    renderCell(buildColumns(), 'identifier', makeTenant({ identifier: 'globex' }));
    expect(screen.getByText('globex')).toBeInTheDocument();
  });

  it('renders the contact email when present', () => {
    renderCell(buildColumns(), 'contactEmail', makeTenant({ contactEmail: 'hi@x.com' }));
    expect(screen.getByText('hi@x.com')).toBeInTheDocument();
  });

  it('renders a dash when contact email is null', () => {
    const node = getCell(buildColumns(), 'contactEmail', makeTenant({ contactEmail: null }));
    expect(node).toBe('—');
  });

  it('renders the jurisdiction when present', () => {
    renderCell(buildColumns(), 'jurisdiction', makeTenant({ jurisdiction: 'FR' }));
    expect(screen.getByText('FR')).toBeInTheDocument();
  });

  it('renders a dash when jurisdiction is null', () => {
    renderCell(buildColumns(), 'jurisdiction', makeTenant({ jurisdiction: null }));
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('status cell: Active badge for an activated tenant', () => {
    renderCell(buildColumns(), 'activated', makeTenant({ activated: true }));
    expect(screen.getByText('Tenants.Status.Active')).toBeInTheDocument();
  });

  it('status cell: Inactive badge for a deactivated tenant', () => {
    renderCell(buildColumns(), 'activated', makeTenant({ activated: false }));
    expect(screen.getByText('Tenants.Status.Inactive')).toBeInTheDocument();
  });

  it('createdAt cell: uses the formatDate callback', () => {
    renderCell(buildColumns(), 'createdAt', makeTenant());
    expect(screen.getByText('FORMATTED_DATE')).toBeInTheDocument();
  });

  it('actions cell: null when the user has no permissions', () => {
    const node = getCell(
      buildColumns({ canUpdate: false, canManage: false }),
      'actions',
      makeTenant()
    );
    expect(node).toBeNull();
  });

  it('actions cell: edit calls onEdit', async () => {
    const { user } = renderCell(buildColumns(), 'actions', makeTenant({ id: 'tnt_42' }));
    await user.click(screen.getByRole('button'));
    await user.click(await screen.findByText('Tenants.Actions.Edit'));
    expect(handlers.onEdit).toHaveBeenCalledWith('tnt_42');
  });

  it('actions cell: deactivate calls onToggleStatus for an active tenant', async () => {
    const tenant = makeTenant({ activated: true });
    const { user } = renderCell(buildColumns(), 'actions', tenant);
    await user.click(screen.getByRole('button'));
    await user.click(await screen.findByText('Tenants.Actions.Deactivate'));
    expect(handlers.onToggleStatus).toHaveBeenCalledWith(tenant);
  });

  it('actions cell: activate label for an inactive tenant', async () => {
    const { user } = renderCell(buildColumns(), 'actions', makeTenant({ activated: false }));
    await user.click(screen.getByRole('button'));
    expect(await screen.findByText('Tenants.Actions.Activate')).toBeInTheDocument();
  });

  it('actions cell: only the edit item when the user can update but not manage', async () => {
    const { user } = renderCell(
      buildColumns({ canUpdate: true, canManage: false }),
      'actions',
      makeTenant()
    );
    await user.click(screen.getByRole('button'));
    const menu = await screen.findByRole('menu');
    const items = within(menu).getAllByRole('menuitem');
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent('Tenants.Actions.Edit');
  });

  it('actions cell: only the status item when the user can manage but not update', async () => {
    const { user } = renderCell(
      buildColumns({ canUpdate: false, canManage: true }),
      'actions',
      makeTenant({ activated: true })
    );
    await user.click(screen.getByRole('button'));
    const menu = await screen.findByRole('menu');
    const items = within(menu).getAllByRole('menuitem');
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent('Tenants.Actions.Deactivate');
  });
});
