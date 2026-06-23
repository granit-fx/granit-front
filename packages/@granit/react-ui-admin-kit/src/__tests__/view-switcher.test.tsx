import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ViewSwitcher } from '../view-switcher/view-switcher';

import { renderWithI18n, setupI18n } from './test-utils';

beforeAll(setupI18n);

describe('ViewSwitcher', () => {
  it('marks the active view as pressed', () => {
    renderWithI18n(<ViewSwitcher view="list" onViewChange={vi.fn()} />);
    const [list, kanban] = screen.getAllByRole('button');
    expect(list).toHaveAttribute('aria-pressed', 'true');
    expect(kanban).toHaveAttribute('aria-pressed', 'false');
  });

  it('emits the chosen view on click', async () => {
    const onViewChange = vi.fn();
    renderWithI18n(<ViewSwitcher view="list" onViewChange={onViewChange} />);
    const [, kanban] = screen.getAllByRole('button');
    await userEvent.click(kanban);
    expect(onViewChange).toHaveBeenCalledWith('kanban');
  });

  it('emits "list" when the list button is clicked from the kanban view', async () => {
    const onViewChange = vi.fn();
    renderWithI18n(<ViewSwitcher view="kanban" onViewChange={onViewChange} />);
    const [list, kanban] = screen.getAllByRole('button');
    expect(kanban).toHaveAttribute('aria-pressed', 'true');
    expect(list).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(list);
    expect(onViewChange).toHaveBeenCalledWith('list');
  });
});
