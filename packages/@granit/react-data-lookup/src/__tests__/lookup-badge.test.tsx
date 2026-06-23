import { createQueryWrapper } from '@granit/react-testing';
import { axiosResponse, createMockClient } from '@granit/testing';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { mockCountries } from '@granit/react-data-lookup/testing';

import { LookupBadge } from '../components/lookup-badge';

describe('<LookupBadge>', () => {
  it('renders resolved label in a default span', async () => {
    const client = createMockClient();
    const item = mockCountries[0]!;
    vi.mocked(client.get).mockResolvedValue(axiosResponse(item));

    render(
      <LookupBadge descriptor={{ name: 'ref-country' }} value={item.value} client={client} />,
      {
        wrapper: createQueryWrapper(),
      }
    );

    await waitFor(() => expect(screen.queryByText('Belgium')).not.toBeNull());
  });

  it('falls back to fallback prop while loading / on miss', () => {
    const client = createMockClient();
    vi.mocked(client.get).mockImplementation(
      () =>
        new Promise(() => {
          /* pending */
        })
    );

    render(
      <LookupBadge
        descriptor={{ name: 'ref-country' }}
        value="XX"
        client={client}
        fallback="Unknown"
      />,
      { wrapper: createQueryWrapper() }
    );

    expect(screen.queryByText('Unknown')).not.toBeNull();
  });

  it('falls back to String(value) when no fallback is provided', () => {
    const client = createMockClient();
    vi.mocked(client.get).mockImplementation(
      () =>
        new Promise(() => {
          /* pending */
        })
    );

    render(<LookupBadge descriptor={{ name: 'ref-country' }} value={42} client={client} />, {
      wrapper: createQueryWrapper(),
    });

    expect(screen.queryByText('42')).not.toBeNull();
  });

  it('uses custom render prop when provided', async () => {
    const client = createMockClient();
    const item = mockCountries[0]!;
    vi.mocked(client.get).mockResolvedValue(axiosResponse(item));

    render(
      <LookupBadge
        descriptor={{ name: 'ref-country' }}
        value={item.value}
        client={client}
        render={({ label, isLoading }) => (
          <span data-testid="custom">{isLoading ? 'loading' : label.toUpperCase()}</span>
        )}
      />,
      { wrapper: createQueryWrapper() }
    );

    await waitFor(() => expect(screen.getByTestId('custom').textContent).toBe('BELGIUM'));
  });

  it('renders empty string when value is null without fallback', () => {
    const client = createMockClient();

    const { container } = render(
      <LookupBadge descriptor={{ name: 'ref-country' }} value={null} client={client} />,
      { wrapper: createQueryWrapper() }
    );

    expect(container.querySelector('[data-lookup-badge]')!.textContent).toBe('');
    expect(client.get).not.toHaveBeenCalled();
  });
});
