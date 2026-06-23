import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type CountryCode } from 'libphonenumber-js/min';
import { useState } from 'react';

import { PhoneInput } from '../inputs/phone-input';

import { renderWithI18n, setupI18n } from './test-utils';

beforeAll(setupI18n);

// A small, multi-continent country subset keeps the cmdk popover cheap to
// render while still exercising the continental grouping path.
const COUNTRIES: readonly CountryCode[] = ['BE', 'FR', 'US', 'JP', 'AU', 'ZA'];

function getNational(): HTMLInputElement {
  return document.querySelector('[data-slot="phone-input-national"]') as HTMLInputElement;
}

// Controlled wrapper: PhoneInput reconciles internal state against `value`, so
// realistic typing/selection tests must feed onChange back into the prop.
function ControlledPhone({
  initial = null,
  onChange,
  defaultCountry,
  countries = COUNTRIES,
}: {
  readonly initial?: string | null;
  readonly onChange: (v: string | null) => void;
  readonly defaultCountry?: CountryCode;
  readonly countries?: readonly CountryCode[];
}) {
  const [value, setValue] = useState<string | null>(initial);
  return (
    <PhoneInput
      value={value}
      defaultCountry={defaultCountry}
      countries={countries}
      onChange={(v) => {
        setValue(v);
        onChange(v);
      }}
    />
  );
}

describe('PhoneInput', () => {
  it('renders the country trigger and the national input', () => {
    renderWithI18n(<PhoneInput value={null} onChange={vi.fn()} countries={COUNTRIES} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(getNational()).toBeInTheDocument();
  });

  it('shows the default country calling code when no value is set', () => {
    renderWithI18n(
      <PhoneInput value={null} onChange={vi.fn()} defaultCountry="FR" countries={COUNTRIES} />
    );
    expect(screen.getByRole('combobox')).toHaveTextContent('+33');
    expect(getNational().value).toBe('');
  });

  it('parses an E.164 value into country and national parts', () => {
    renderWithI18n(<PhoneInput value="+32479123456" onChange={vi.fn()} countries={COUNTRIES} />);
    expect(screen.getByRole('combobox')).toHaveTextContent('+32');
    expect(getNational().value.length).toBeGreaterThan(0);
  });

  it('falls back to the default country for an unparseable value', () => {
    renderWithI18n(
      <PhoneInput value="garbage" onChange={vi.fn()} defaultCountry="US" countries={COUNTRIES} />
    );
    expect(screen.getByRole('combobox')).toHaveTextContent('+1');
    expect(getNational().value).toBe('garbage');
  });

  it('emits an E.164 number as the user types a national number', async () => {
    const onChange = vi.fn();
    renderWithI18n(<ControlledPhone onChange={onChange} defaultCountry="BE" />);
    await userEvent.type(getNational(), '479123456');
    expect(onChange).toHaveBeenCalled();
    const last = onChange.mock.calls.at(-1)?.[0] as string;
    expect(last.startsWith('+32')).toBe(true);
  });

  it('emits null when the national input is cleared', async () => {
    const onChange = vi.fn();
    renderWithI18n(<ControlledPhone initial="+32479123456" onChange={onChange} />);
    await userEvent.clear(getNational());
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('falls back to a digit-only E.164 when the number is not fully parseable', () => {
    const onChange = vi.fn();
    renderWithI18n(<ControlledPhone onChange={onChange} defaultCountry="BE" />);
    fireEvent.change(getNational(), { target: { value: '12' } });
    const last = onChange.mock.calls.at(-1)?.[0] as string;
    expect(last.startsWith('+32')).toBe(true);
    expect(last).toContain('12');
  });

  it('opens the country list and selects a country, re-emitting the value', async () => {
    const onChange = vi.fn();
    renderWithI18n(<ControlledPhone onChange={onChange} defaultCountry="BE" />);
    // Type a national number first so the country switch re-emits.
    await userEvent.type(getNational(), '612345678');
    onChange.mockClear();

    await userEvent.click(screen.getByRole('combobox'));
    const list = await screen.findByRole('listbox');
    const usOption = await within(list).findByText('United States');
    await userEvent.click(usOption);

    expect(screen.getByRole('combobox')).toHaveTextContent('+1');
    expect(onChange).toHaveBeenCalled();
  });

  it('selects a country without re-emitting when there is no national number', async () => {
    const onChange = vi.fn();
    renderWithI18n(<ControlledPhone onChange={onChange} defaultCountry="BE" />);
    await userEvent.click(screen.getByRole('combobox'));
    const list = await screen.findByRole('listbox');
    await userEvent.click(await within(list).findByText('Japan'));
    expect(screen.getByRole('combobox')).toHaveTextContent('+81');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('filters the country list on search', async () => {
    renderWithI18n(
      <PhoneInput
        value={null}
        onChange={vi.fn()}
        countries={COUNTRIES}
        searchPlaceholder="Search"
      />
    );
    await userEvent.click(screen.getByRole('combobox'));
    const search = await screen.findByPlaceholderText('Search');
    fireEvent.change(search, { target: { value: 'japan' } });
    const list = await screen.findByRole('listbox');
    expect(await within(list).findByText('Japan')).toBeInTheDocument();
    expect(within(list).queryByText('United States')).toBeNull();
  });

  it('shows the empty message when no country matches', async () => {
    renderWithI18n(
      <PhoneInput
        value={null}
        onChange={vi.fn()}
        countries={COUNTRIES}
        searchPlaceholder="Search"
        emptyText="No country found"
      />
    );
    await userEvent.click(screen.getByRole('combobox'));
    const search = await screen.findByPlaceholderText('Search');
    fireEvent.change(search, { target: { value: 'zzzznomatch' } });
    expect(await screen.findByText('No country found')).toBeInTheDocument();
  });

  it('groups countries under an "Other" heading when the continent is unknown', async () => {
    // AC (Ascension Island) is a valid libphonenumber territory with a calling
    // code but is absent from COUNTRY_TO_CONTINENT, driving the "Other" bucket.
    renderWithI18n(
      <PhoneInput value={null} onChange={vi.fn()} countries={['BE', 'AC'] as CountryCode[]} />
    );
    await userEvent.click(screen.getByRole('combobox'));
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
  });

  it('reconciles an external value change (form reset)', () => {
    const { rerender } = renderWithI18n(
      <PhoneInput value="+32479123456" onChange={vi.fn()} countries={COUNTRIES} />
    );
    expect(screen.getByRole('combobox')).toHaveTextContent('+32');
    rerender(<PhoneInput value="+33612345678" onChange={vi.fn()} countries={COUNTRIES} />);
    expect(screen.getByRole('combobox')).toHaveTextContent('+33');
  });

  it('renders disabled state and forwards id, name and aria-label', () => {
    renderWithI18n(
      <PhoneInput
        value={null}
        onChange={vi.fn()}
        countries={COUNTRIES}
        disabled
        id="phone"
        name="telephone"
        ariaLabelCountry="Pick country"
        placeholder="number"
      />
    );
    const country = screen.getByRole('combobox', { name: 'Pick country' });
    expect(country).toBeDisabled();
    const national = getNational();
    expect(national).toBeDisabled();
    expect(national.id).toBe('phone');
    expect(national.name).toBe('telephone');
    expect(screen.getByPlaceholderText('number')).toBeInTheDocument();
  });

  it('builds the full country list when no countries filter is given', async () => {
    // Exercises the getCountries() branch in buildCountryOptions.
    renderWithI18n(<PhoneInput value={null} onChange={vi.fn()} searchPlaceholder="Search" />);
    await userEvent.click(screen.getByRole('combobox'));
    const search = await screen.findByPlaceholderText('Search');
    fireEvent.change(search, { target: { value: 'belgium' } });
    await waitFor(async () => {
      const list = await screen.findByRole('listbox');
      expect(within(list).getByText('Belgium')).toBeInTheDocument();
    });
  });
});
