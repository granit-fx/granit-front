import { sampleParties, toListItem } from '@granit/react-parties/testing';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createPartyColumns } from '../components/party-columns';

import { renderWithProviders } from './test-utils';

import type { PartyId, PartyListItemResponse } from '@granit/parties';
import type { DataTableCellContext } from '@granit/react-ui-kit';

const t = ((key: string) => key) as never;

function cellFor(id: string, row: PartyListItemResponse) {
  const columns = createPartyColumns({ t, onViewDetail: vi.fn() });
  const column = columns.find((c) => c.id === id)!;
  const cell = column.cell as (
    ctx: DataTableCellContext<PartyListItemResponse, unknown>
  ) => unknown;
  return cell({ row: { original: row } } as never);
}

describe('createPartyColumns', () => {
  const item = toListItem(sampleParties[0]!);

  it('exposes the expected column ids', () => {
    const ids = createPartyColumns({ t, onViewDetail: vi.fn() }).map((c) => c.id);
    expect(ids).toEqual(['name', 'kind', 'roles', 'status', 'currency', 'primaryEmail', 'actions']);
  });

  it('renders the name cell', () => {
    renderWithProviders(<>{cellFor('name', item) as never}</>);
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('renders the roles, status and kind cells', () => {
    renderWithProviders(
      <>
        {cellFor('kind', item) as never}
        {cellFor('roles', item) as never}
        {cellFor('status', item) as never}
        {cellFor('currency', item) as never}
      </>
    );
    expect(screen.getByText('Customer')).toBeInTheDocument();
    expect(screen.getByText('EUR')).toBeInTheDocument();
  });

  it('renders an em dash when there is no primary email', () => {
    renderWithProviders(<>{cellFor('primaryEmail', { ...item, primaryEmail: null }) as never}</>);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('fires onViewDetail from the actions cell', async () => {
    const onViewDetail = vi.fn();
    const columns = createPartyColumns({ t, onViewDetail });
    const actions = columns.find((c) => c.id === 'actions')!;
    const cell = actions.cell as (
      ctx: DataTableCellContext<PartyListItemResponse, unknown>
    ) => unknown;
    renderWithProviders(<>{cell({ row: { original: item } } as never) as never}</>);
    await userEvent.setup({ delay: null }).click(screen.getByRole('button'));
    expect(onViewDetail).toHaveBeenCalledWith(item.id as PartyId);
  });
});
