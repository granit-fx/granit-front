import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TimezonePicker } from '../timezone-picker/timezone-picker';

import { renderWithI18n, setupI18n } from './test-utils';

// `useTimezone` resolves the user's preferred zone with a browser fallback and
// never throws outside a TimezoneProvider, so these render without one.

beforeAll(setupI18n);

describe('TimezonePicker', () => {
  it('defaults to the user timezone on mount when no value is set', async () => {
    const onChange = vi.fn();
    renderWithI18n(<TimezonePicker value={null} onChange={onChange} />);

    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    const [tz] = onChange.mock.calls[0] as [string];
    expect(typeof tz).toBe('string');
    expect(tz.length).toBeGreaterThan(0);
  });

  it('does not override an explicitly provided value', () => {
    const onChange = vi.fn();
    renderWithI18n(<TimezonePicker value="America/New_York" onChange={onChange} />);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders a combobox trigger', () => {
    renderWithI18n(<TimezonePicker value="UTC" onChange={vi.fn()} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('clears the selection via the clear affordance when clearable and a value is set', async () => {
    const onChange = vi.fn();
    renderWithI18n(
      <TimezonePicker value="Europe/Paris" onChange={onChange} clearable clearLabel="Clear" />
    );
    const clear = screen.getByRole('button', { name: 'Clear' });
    await userEvent.click(clear);
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('clears the selection with the keyboard (Enter / Space)', async () => {
    const onChange = vi.fn();
    renderWithI18n(
      <TimezonePicker value="Europe/Paris" onChange={onChange} clearable clearLabel="Clear" />
    );
    const clear = screen.getByRole('button', { name: 'Clear' });
    clear.focus();
    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith(null);
    onChange.mockClear();
    await userEvent.keyboard(' ');
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('does not render the clear affordance when clearable is false', () => {
    renderWithI18n(
      <TimezonePicker
        value="Europe/Paris"
        onChange={vi.fn()}
        clearable={false}
        clearLabel="Clear"
      />
    );
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
  });

  describe('with the option list open', () => {
    // The real IANA list has 400+ zones; cmdk renders every item before
    // filtering, which is expensive under load. Stub the source to a handful so
    // the popover (and its filter / onSelect paths) render cheaply.
    const original = Intl.supportedValuesOf;
    beforeEach(() => {
      vi.spyOn(Intl, 'supportedValuesOf').mockImplementation(((input: string) =>
        input === 'timeZone'
          ? ['UTC', 'Europe/Brussels', 'Europe/Paris', 'America/New_York']
          : original(input as never)) as typeof Intl.supportedValuesOf);
    });
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('emits the picked timezone and filters the list on search', async () => {
      const onChange = vi.fn();
      renderWithI18n(
        <TimezonePicker value="Europe/Paris" onChange={onChange} searchPlaceholder="Search" />
      );
      await userEvent.click(screen.getByRole('combobox'));

      const search = await screen.findByPlaceholderText('Search');
      fireEvent.change(search, { target: { value: 'Brussels' } });

      const listbox = await screen.findByRole('listbox');
      const option = await within(listbox).findByText('Brussels');
      await userEvent.click(option);
      expect(onChange).toHaveBeenCalledWith('Europe/Brussels');
    });

    it('shows the empty message when the search matches no timezone', async () => {
      renderWithI18n(
        <TimezonePicker
          value="Europe/Paris"
          onChange={vi.fn()}
          searchPlaceholder="Search"
          emptyText="No timezone found"
        />
      );
      await userEvent.click(screen.getByRole('combobox'));
      const search = await screen.findByPlaceholderText('Search');
      fireEvent.change(search, { target: { value: 'zzzzznomatch' } });
      expect(await screen.findByText('No timezone found')).toBeInTheDocument();
    });
  });
});
