import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { UrlInput } from '../inputs/url-input';

import { renderWithI18n, setupI18n } from './test-utils';

beforeAll(setupI18n);

function getRest(): HTMLInputElement {
  return document.querySelector('[data-slot="url-input-rest"]') as HTMLInputElement;
}

// Controlled wrapper: the component reconciles internal state against the
// `value` prop, so realistic interaction tests must feed onChange back in.
function ControlledUrl({
  initial = null,
  onChange,
  protocols,
  defaultProtocol,
}: {
  readonly initial?: string | null;
  readonly onChange: (v: string | null) => void;
  readonly protocols?: readonly string[];
  readonly defaultProtocol?: string;
}) {
  const [value, setValue] = useState<string | null>(initial);
  return (
    <UrlInput
      value={value}
      protocols={protocols}
      defaultProtocol={defaultProtocol}
      onChange={(v) => {
        setValue(v);
        onChange(v);
      }}
    />
  );
}

describe('UrlInput', () => {
  it('renders the protocol trigger and the rest input', () => {
    renderWithI18n(<UrlInput value={null} onChange={vi.fn()} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(getRest()).toBeInTheDocument();
  });

  it('splits an existing value into protocol and rest', () => {
    renderWithI18n(<UrlInput value="https://example.com/path" onChange={vi.fn()} />);
    expect(getRest().value).toBe('example.com/path');
    expect(screen.getByRole('combobox')).toHaveTextContent('https');
  });

  it('falls back to the default protocol for an unknown scheme', () => {
    renderWithI18n(<UrlInput value="ftp://files.example.com" onChange={vi.fn()} />);
    // ftp is not in the default protocols list, so the recognised scheme is
    // stripped and the fallback protocol (https) is selected.
    expect(getRest().value).toBe('files.example.com');
    expect(screen.getByRole('combobox')).toHaveTextContent('https');
  });

  it('keeps a recognised non-default protocol from the value', () => {
    renderWithI18n(<UrlInput value="http://example.com" onChange={vi.fn()} />);
    expect(screen.getByRole('combobox')).toHaveTextContent('http');
    expect(getRest().value).toBe('example.com');
  });

  it('emits a joined URL when the rest changes', async () => {
    const onChange = vi.fn();
    renderWithI18n(<ControlledUrl onChange={onChange} />);
    await userEvent.type(getRest(), 'example.org');
    expect(onChange).toHaveBeenLastCalledWith('https://example.org');
  });

  it('emits null when the rest is cleared', async () => {
    const onChange = vi.fn();
    renderWithI18n(<ControlledUrl initial="https://example.com" onChange={onChange} />);
    await userEvent.clear(getRest());
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('re-splits a pasted full URL and updates the protocol dropdown', () => {
    const onChange = vi.fn();
    renderWithI18n(<ControlledUrl onChange={onChange} />);
    fireEvent.change(getRest(), { target: { value: 'http://pasted.example.com/x' } });
    expect(onChange).toHaveBeenLastCalledWith('http://pasted.example.com/x');
    expect(screen.getByRole('combobox')).toHaveTextContent('http');
    expect(getRest().value).toBe('pasted.example.com/x');
  });

  it('keeps the current protocol when a pasted scheme is unknown', () => {
    const onChange = vi.fn();
    renderWithI18n(<ControlledUrl initial="http://start.example.com" onChange={onChange} />);
    fireEvent.change(getRest(), { target: { value: 'ws://other.example.com' } });
    // ws is not in the protocol list; rest keeps the raw value, protocol unchanged.
    expect(screen.getByRole('combobox')).toHaveTextContent('http');
  });

  it('changes the protocol via the select and re-emits', async () => {
    const onChange = vi.fn();
    renderWithI18n(<ControlledUrl initial="https://example.com" onChange={onChange} />);
    await userEvent.click(screen.getByRole('combobox'));
    const listbox = await screen.findByRole('listbox');
    await userEvent.click(within(listbox).getByText('http://'));
    expect(onChange).toHaveBeenLastCalledWith('http://example.com');
  });

  it('supports a custom protocol list and default protocol', () => {
    renderWithI18n(
      <UrlInput
        value={null}
        onChange={vi.fn()}
        protocols={['mailto', 'tel']}
        defaultProtocol="tel"
      />
    );
    expect(screen.getByRole('combobox')).toHaveTextContent('tel');
  });

  it('reconciles an external value change (form reset)', () => {
    const { rerender } = renderWithI18n(<UrlInput value="https://a.example" onChange={vi.fn()} />);
    expect(getRest().value).toBe('a.example');
    rerender(<UrlInput value="http://b.example" onChange={vi.fn()} />);
    expect(getRest().value).toBe('b.example');
    expect(screen.getByRole('combobox')).toHaveTextContent('http');
  });

  it('treats an empty string value as null without resetting protocol choice', () => {
    const { rerender } = renderWithI18n(<UrlInput value="http://x.example" onChange={vi.fn()} />);
    expect(screen.getByRole('combobox')).toHaveTextContent('http');
    rerender(<UrlInput value="" onChange={vi.fn()} />);
    // empty string normalises to null; the synced value does not change so the
    // protocol choice is preserved.
    expect(screen.getByRole('combobox')).toHaveTextContent('http');
  });

  it('renders disabled state and a custom protocol aria-label and placeholder', () => {
    renderWithI18n(
      <UrlInput
        value={null}
        onChange={vi.fn()}
        disabled
        ariaLabelProtocol="Scheme"
        placeholder="type here"
      />
    );
    expect(screen.getByRole('combobox', { name: 'Scheme' })).toBeDisabled();
    expect(getRest()).toBeDisabled();
    expect(screen.getByPlaceholderText('type here')).toBeInTheDocument();
  });

  it('forwards id and name to the rest input', () => {
    renderWithI18n(<UrlInput value={null} onChange={vi.fn()} id="site" name="website" />);
    const rest = getRest();
    expect(rest.id).toBe('site');
    expect(rest.name).toBe('website');
  });
});
