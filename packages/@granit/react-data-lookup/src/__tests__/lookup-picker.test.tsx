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
    const payload: LookupResult = { items: [{ value: 'g1', label: 'Acme' }] };
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
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ items: [] } as LookupResult));

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
});
