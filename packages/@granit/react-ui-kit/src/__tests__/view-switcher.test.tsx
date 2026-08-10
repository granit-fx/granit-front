import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ViewSwitcher } from '../view-switcher/view-switcher';

import { renderWithI18n, setupI18n } from './test-utils';

beforeAll(setupI18n);

/**
 * Both buttons are icon-only, so neither carries an accessible name to query
 * by — they can only be told apart by document order. Throwing here keeps the
 * positional lookup honest: the tests below get non-optional elements, and a
 * component that stops rendering both buttons fails with a readable message
 * instead of an `undefined` further down.
 */
function getViewButtons() {
  const [list, kanban] = screen.getAllByRole('button');
  if (!list || !kanban) {
    throw new Error('expected ViewSwitcher to render both the list and kanban buttons');
  }
  return { list, kanban };
}

describe('ViewSwitcher', () => {
  it('marks the active view as pressed', () => {
    renderWithI18n(<ViewSwitcher view="list" onViewChange={vi.fn()} />);
    const { list, kanban } = getViewButtons();
    expect(list).toHaveAttribute('aria-pressed', 'true');
    expect(kanban).toHaveAttribute('aria-pressed', 'false');
  });

  it('emits the chosen view on click', async () => {
    const onViewChange = vi.fn();
    renderWithI18n(<ViewSwitcher view="list" onViewChange={onViewChange} />);
    const { kanban } = getViewButtons();
    await userEvent.click(kanban);
    expect(onViewChange).toHaveBeenCalledWith('kanban');
  });

  it('emits "list" when the list button is clicked from the kanban view', async () => {
    const onViewChange = vi.fn();
    renderWithI18n(<ViewSwitcher view="kanban" onViewChange={onViewChange} />);
    const { list, kanban } = getViewButtons();
    expect(kanban).toHaveAttribute('aria-pressed', 'true');
    expect(list).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(list);
    expect(onViewChange).toHaveBeenCalledWith('list');
  });
});
