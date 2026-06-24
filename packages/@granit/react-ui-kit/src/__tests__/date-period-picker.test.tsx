import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DatePeriodPicker } from '../querying/date-period-picker';

import { renderWithI18n, setupI18n } from './test-utils';

import type { DateFilterMeta } from '@granit/query-engine';

const dateFilter: DateFilterMeta = {
  name: 'createdAt',
  defaultPeriod: 'ThisMonth',
  availablePeriods: ['Today', 'ThisWeek', 'ThisMonth', 'Custom'],
};

beforeAll(setupI18n);

describe('DatePeriodPicker', () => {
  it('falls back to the default period when no value is given', () => {
    renderWithI18n(<DatePeriodPicker dateFilter={dateFilter} onValueChange={vi.fn()} />);
    // ThisMonth resolves to its i18n key (no resources loaded).
    expect(screen.getByText('Components.Querying.DatePeriod.ThisMonth')).toBeInTheDocument();
  });

  it('shows the controlled value over the default', () => {
    renderWithI18n(
      <DatePeriodPicker dateFilter={dateFilter} value="Today" onValueChange={vi.fn()} />
    );
    expect(screen.getByText('Components.Querying.DatePeriod.Today')).toBeInTheDocument();
  });

  it('lists every available period and emits the chosen one', async () => {
    const onValueChange = vi.fn();
    renderWithI18n(
      <DatePeriodPicker dateFilter={dateFilter} value="Today" onValueChange={onValueChange} />
    );

    await userEvent.click(screen.getByRole('combobox'));

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(dateFilter.availablePeriods.length);

    await userEvent.click(
      screen.getByRole('option', { name: 'Components.Querying.DatePeriod.ThisWeek' })
    );
    expect(onValueChange).toHaveBeenCalledWith('ThisWeek');
  });

  it('forwards the className to the trigger', () => {
    renderWithI18n(
      <DatePeriodPicker
        dateFilter={dateFilter}
        value="Today"
        onValueChange={vi.fn()}
        className="custom-class"
      />
    );
    expect(screen.getByRole('combobox')).toHaveClass('custom-class');
  });
});
