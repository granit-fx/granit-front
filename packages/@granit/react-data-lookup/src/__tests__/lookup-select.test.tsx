import { createQueryWrapper } from '@granit/react-testing';
import { axiosResponse, createMockClient } from '@granit/testing';
import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LookupSelect } from '../components/lookup-select';

import type { LookupSelectRenderArgs } from '../components/lookup-select';
import type { LookupDescriptor, LookupItem, LookupResult } from '@granit/data-lookup';

describe('<LookupSelect>', () => {
  it('renders with resolved items and selected item', async () => {
    const client = createMockClient();
    const searchPayload: LookupResult = {
      items: [{ value: 'BE', label: 'Belgique', extra: null }],
      totalCount: 1,
      continuationToken: null,
    };
    const resolvedItem: LookupItem = { value: 'BE', label: 'Belgique', extra: null };

    vi.mocked(client.get).mockImplementation((url) => {
      return url.includes('/resolve')
        ? Promise.resolve(axiosResponse(resolvedItem))
        : Promise.resolve(axiosResponse(searchPayload));
    });

    const renderSpy = vi.fn((_args: LookupSelectRenderArgs) => <span data-testid="picker" />);

    render(
      <LookupSelect
        descriptor={{ name: 'ref-country' }}
        value="BE"
        onChange={vi.fn()}
        client={client}
        culture="fr"
        render={renderSpy}
      />,
      { wrapper: createQueryWrapper() }
    );

    await waitFor(() => {
      const lastCall = renderSpy.mock.calls.at(-1);
      expect(lastCall?.[0].selectedItem).toEqual(resolvedItem);
    });
    const lastArgs = renderSpy.mock.calls.at(-1)![0];
    expect(lastArgs.items).toEqual(searchPayload.items);
    expect(lastArgs.missingScopeKey).toBeNull();
  });

  it('surfaces missingScopeKey when scope is incomplete', () => {
    const client = createMockClient();
    const descriptor: LookupDescriptor = { name: 'meters', scopeKeys: ['tenantId'] };
    const renderSpy = vi.fn((_args: LookupSelectRenderArgs) => <span />);

    render(
      <LookupSelect
        descriptor={descriptor}
        value={null}
        onChange={vi.fn()}
        client={client}
        scope={{}}
        render={renderSpy}
      />,
      { wrapper: createQueryWrapper() }
    );

    const args = renderSpy.mock.calls.at(-1)![0];
    expect(args.missingScopeKey).toBe('tenantId');
    expect(client.get).not.toHaveBeenCalled();
  });

  it('exposes empty items array initially', () => {
    const client = createMockClient();
    vi.mocked(client.get).mockImplementation(
      () =>
        new Promise(() => {
          /* never resolves */
        })
    );

    const renderSpy = vi.fn((_args: LookupSelectRenderArgs) => <span />);

    render(
      <LookupSelect
        descriptor={{ name: 'tenants' }}
        value={null}
        onChange={vi.fn()}
        client={client}
        render={renderSpy}
      />,
      { wrapper: createQueryWrapper() }
    );

    const firstArgs = renderSpy.mock.calls[0]![0];
    expect(firstArgs.items).toEqual([]);
    expect(firstArgs.isLoading).toBe(true);
  });
});
