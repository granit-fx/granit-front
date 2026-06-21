import { Table, TableBody } from '@granit/react-ui';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { GroupByRows } from '../querying/group-by-rows';

import { renderWithI18n, setupI18n } from './test-utils';

import type { GroupEntry } from '@granit/query-engine';
import type { ReactElement } from 'react';

interface Patient {
  readonly id: number;
  readonly name: string;
}

const groups: GroupEntry<Patient>[] = [
  {
    field: 'status',
    value: 'Active',
    label: 'Active',
    count: 2,
    items: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ],
  },
  {
    field: 'status',
    value: 'Archived',
    label: 'Archived',
    count: 1,
    items: [{ id: 3, name: 'Carol' }],
  },
];

function renderRows(ui: ReactElement) {
  return renderWithI18n(
    <Table>
      <TableBody>{ui}</TableBody>
    </Table>
  );
}

beforeAll(setupI18n);

describe('GroupByRows', () => {
  it('renders one row per group with its label and count', () => {
    renderRows(<GroupByRows groups={groups} colSpan={3} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Archived')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('does not render group items until expanded', () => {
    renderRows(
      <GroupByRows
        groups={groups}
        colSpan={3}
        renderItem={(item) => (
          <tr key={item.id}>
            <td>{item.name}</td>
          </tr>
        )}
      />
    );
    expect(screen.queryByText('Alice')).toBeNull();
  });

  it('expands a group, renders its items and calls onExpand once', async () => {
    const onExpand = vi.fn();
    renderRows(
      <GroupByRows
        groups={groups}
        colSpan={3}
        onExpand={onExpand}
        renderItem={(item) => (
          <tr key={item.id}>
            <td>{item.name}</td>
          </tr>
        )}
      />
    );

    await userEvent.click(screen.getByText('Active'));
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.queryByText('Carol')).toBeNull();
    expect(onExpand).toHaveBeenCalledTimes(1);
    expect(onExpand).toHaveBeenCalledWith(groups[0]);
  });

  it('collapses an expanded group and does not fire onExpand again', async () => {
    const onExpand = vi.fn();
    renderRows(
      <GroupByRows
        groups={groups}
        colSpan={3}
        onExpand={onExpand}
        renderItem={(item) => (
          <tr key={item.id}>
            <td>{item.name}</td>
          </tr>
        )}
      />
    );

    const groupCell = screen.getByText('Active');
    await userEvent.click(groupCell);
    expect(screen.getByText('Alice')).toBeInTheDocument();

    await userEvent.click(groupCell);
    expect(screen.queryByText('Alice')).toBeNull();
    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  it('reflects expanded state on the row data attribute', async () => {
    const { container } = renderRows(<GroupByRows groups={groups} colSpan={3} />);
    const firstRow = container.querySelector<HTMLElement>('[data-slot="group-by-row"]');
    expect(firstRow).not.toBeNull();
    expect(firstRow).toHaveAttribute('data-expanded', 'false');

    await userEvent.click(within(firstRow!).getByText('Active'));
    expect(firstRow).toHaveAttribute('data-expanded', 'true');
  });
});
