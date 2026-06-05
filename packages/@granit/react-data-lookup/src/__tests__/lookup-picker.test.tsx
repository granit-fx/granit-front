import { createQueryWrapper } from '@granit/react-testing';
import { axiosResponse, createMockClient } from '@granit/testing';
import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LookupPicker } from '../components/lookup-picker';

import type { LookupPickerRenderArgs } from '../components/lookup-picker';
import type { LookupResult } from '@granit/data-lookup';

describe('<LookupPicker>', () => {
  it('delivers items and multi flag to the render prop', async () => {
    const client = createMockClient();
    const payload: LookupResult = {
      items: [{ value: 'g1', label: 'Acme', extra: null }],
      totalCount: 1,
      continuationToken: null,
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(payload));

    const renderSpy = vi.fn((_args: LookupPickerRenderArgs) => <span />);

    render(
      <LookupPicker
        descriptor={{ name: 'tenants' }}
        value={[]}
        onChange={vi.fn()}
        client={client}
        multi
        render={renderSpy}
      />,
      { wrapper: createQueryWrapper() }
    );

    await waitFor(() => {
      const lastCall = renderSpy.mock.calls.at(-1);
      expect(lastCall?.[0].items).toEqual(payload.items);
    });
    const args = renderSpy.mock.calls.at(-1)![0];
    expect(args.multi).toBe(true);
    expect(args.missingScopeKey).toBeNull();
  });

  it('defaults multi to false', () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse({ items: [], totalCount: 0, continuationToken: null } as LookupResult)
    );

    const renderSpy = vi.fn((_args: LookupPickerRenderArgs) => <span />);

    render(
      <LookupPicker
        descriptor={{ name: 'tenants' }}
        value={null}
        onChange={vi.fn()}
        client={client}
        render={renderSpy}
      />,
      { wrapper: createQueryWrapper() }
    );

    expect(renderSpy.mock.calls[0]![0].multi).toBe(false);
  });

  it('exposes missingScopeKey without firing the request', () => {
    const client = createMockClient();
    const renderSpy = vi.fn((_args: LookupPickerRenderArgs) => <span />);

    render(
      <LookupPicker
        descriptor={{ name: 'meters', scopeKeys: ['tenantId'] }}
        value={null}
        onChange={vi.fn()}
        client={client}
        scope={{ tenantId: '' }}
        render={renderSpy}
      />,
      { wrapper: createQueryWrapper() }
    );

    const args = renderSpy.mock.calls.at(-1)![0];
    expect(args.missingScopeKey).toBe('tenantId');
    expect(client.get).not.toHaveBeenCalled();
  });

  it('toggle adds and removes values in MULTI mode (In operator)', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse({
        items: [
          { value: 'a', label: 'A', extra: null },
          { value: 'b', label: 'B', extra: null },
        ],
        totalCount: 2,
        continuationToken: null,
      } as LookupResult)
    );
    const onChange = vi.fn();
    const renderSpy = vi.fn((_args: LookupPickerRenderArgs) => <span />);

    render(
      <LookupPicker
        descriptor={{ name: 't' }}
        value={['a']}
        onChange={onChange}
        client={client}
        multi
        render={renderSpy}
      />,
      { wrapper: createQueryWrapper() }
    );

    await waitFor(() => expect(renderSpy.mock.calls.at(-1)![0].items).toHaveLength(2));
    const args = renderSpy.mock.calls.at(-1)![0];

    expect(args.isSelected('a')).toBe(true);
    expect(args.isSelected('b')).toBe(false);

    args.toggle('b'); // add
    expect(onChange).toHaveBeenLastCalledWith(['a', 'b']);

    args.toggle('a'); // remove
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('toggle sets and clears a scalar value in SINGLE mode (Eq operator)', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse({
        items: [{ value: 'a', label: 'A', extra: null }],
        totalCount: 1,
        continuationToken: null,
      } as LookupResult)
    );
    const onChange = vi.fn();
    const renderSpy = vi.fn((_args: LookupPickerRenderArgs) => <span />);

    render(
      <LookupPicker
        descriptor={{ name: 't' }}
        value="a"
        onChange={onChange}
        client={client}
        render={renderSpy}
      />,
      { wrapper: createQueryWrapper() }
    );

    await waitFor(() => expect(renderSpy.mock.calls.at(-1)![0].items).toHaveLength(1));
    const args = renderSpy.mock.calls.at(-1)![0];

    expect(args.isSelected('a')).toBe(true);
    args.toggle('a'); // clears (already selected)
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});
