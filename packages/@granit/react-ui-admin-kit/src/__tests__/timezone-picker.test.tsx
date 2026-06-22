import { screen, waitFor } from '@testing-library/react';

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
});
