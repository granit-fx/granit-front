import { DataLookupProvider } from '@granit/react-data-lookup';
import { createTestQueryClient } from '@granit/react-testing';
import { axiosResponse, createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { EntityForm } from '../components/entity-form';
import { STANDARD_FORM_COMPONENTS } from '../field-components/index';
import { EntityRendererProvider } from '../providers/index';

import type { AxiosInstance } from '@granit/api-client';
import type { LookupDescriptor, LookupItemResponse } from '@granit/data-lookup';
import type { EntityFormFieldManifest, EntityFormManifest } from '@granit/entities';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Branch-coverage backfill for LookupFormComponent. The base suite covers the
// happy picker / rehydrate / read-only / cascade-scope paths. This file targets
// the defensive descriptor guard, the scope-coercion arms (string / number /
// object), the read-only raw-value fallback, the aria-invalid arm, and the
// keyboard-select branch of the listbox options.
// ---------------------------------------------------------------------------

const TENANTS: LookupItemResponse[] = [
  { value: 't-1', label: 'Acme Corp', extra: null },
  { value: 't-2', label: 'Globex', extra: null },
];

function lookupField(
  propertyName: string,
  lookup: LookupDescriptor | null,
  overrides: Partial<EntityFormFieldManifest> = {}
): EntityFormFieldManifest {
  return {
    propertyName,
    clrTypeName: 'Guid',
    component: 'lookup',
    config: null,
    labelKey: null,
    helpKey: null,
    order: 0,
    readOnly: false,
    visibleIf: null,
    lookup,
    ...overrides,
  };
}

function variantWith(field: EntityFormFieldManifest): EntityFormManifest {
  return {
    name: 'default',
    customizable: false,
    sections: [
      { key: 'main', labelKey: null, order: 0, collapsedByDefault: false, fields: [field] },
    ],
  };
}

function tenantClient(): AxiosInstance {
  const client = createMockClient();
  vi.mocked(client.get).mockImplementation((url, config) => {
    if (String(url).includes('/resolve')) {
      const v = (config as { params?: { value?: string } }).params?.value;
      return Promise.resolve(axiosResponse(TENANTS.find((t) => t.value === v) ?? null));
    }
    const search = (
      (config as { params?: { search?: string } }).params?.search ?? ''
    ).toLowerCase();
    const items = search ? TENANTS.filter((t) => t.label.toLowerCase().includes(search)) : TENANTS;
    return Promise.resolve(
      axiosResponse({ items, totalCount: items.length, continuationToken: null })
    );
  });
  return client;
}

function Harness({
  field,
  client,
  initial = null,
  seedValues,
  onChangeSpy,
}: {
  readonly field: EntityFormFieldManifest;
  readonly client: AxiosInstance;
  readonly initial?: unknown;
  readonly seedValues?: Readonly<Record<string, unknown>>;
  readonly onChangeSpy?: (values: Readonly<Record<string, unknown>>) => void;
}): ReactNode {
  const [values, setValues] = useState<Readonly<Record<string, unknown>>>({
    ...seedValues,
    ...(initial == null ? {} : { [field.propertyName]: initial }),
  });
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <DataLookupProvider config={{ client }}>
        <EntityRendererProvider components={STANDARD_FORM_COMPONENTS}>
          <EntityForm
            variant={variantWith(field)}
            values={values}
            onChange={(next) => {
              setValues(next);
              onChangeSpy?.(next);
            }}
          />
        </EntityRendererProvider>
      </DataLookupProvider>
    </QueryClientProvider>
  );
}

describe('LookupFormComponent — defensive descriptor guard', () => {
  it('renders the misconfigured notice when the field carries no lookup descriptor', () => {
    const field = lookupField('TenantId', null);
    const { container } = render(<Harness field={field} client={tenantClient()} />);
    const notice = container.querySelector('[data-granit-lookup-misconfigured]');
    expect(notice).not.toBeNull();
    expect(notice?.getAttribute('data-property')).toBe('TenantId');
  });
});

describe('LookupFormComponent — scope coercion arms', () => {
  it('coerces a numeric sibling value into the scope param (number arm)', async () => {
    const field = lookupField('MeterId', { name: 'meters', scopeKeys: ['tenantId'] });
    const client = tenantClient();
    render(<Harness field={field} client={client} seedValues={{ TenantId: 42 }} />);
    await waitFor(() => expect(client.get).toHaveBeenCalled());
    const scopedCall = vi
      .mocked(client.get)
      .mock.calls.find((c) => !String(c[0]).includes('/resolve'));
    expect((scopedCall?.[1] as { params?: Record<string, unknown> }).params).toMatchObject({
      'scope.tenantId': '42',
    });
  });

  it('JSON-stringifies a non-scalar sibling value into the scope param (object arm)', async () => {
    const field = lookupField('MeterId', { name: 'meters', scopeKeys: ['tenantId'] });
    const client = tenantClient();
    render(<Harness field={field} client={client} seedValues={{ TenantId: { id: 7 } }} />);
    await waitFor(() => expect(client.get).toHaveBeenCalled());
    const scopedCall = vi
      .mocked(client.get)
      .mock.calls.find((c) => !String(c[0]).includes('/resolve'));
    expect((scopedCall?.[1] as { params?: Record<string, unknown> }).params).toMatchObject({
      'scope.tenantId': JSON.stringify({ id: 7 }),
    });
  });
});

describe('LookupFormComponent — read-only raw-value fallback', () => {
  it('shows the raw stringified value when read-only and no item resolves', async () => {
    const field = lookupField('TenantId', { name: 'tenants' }, { readOnly: true });
    const client = tenantClient();
    // 'unknown-id' resolves to null → selectedItem is undefined → raw value fallback.
    vi.mocked(client.get).mockImplementation((url) => {
      if (String(url).includes('/resolve')) return Promise.resolve(axiosResponse(null));
      return Promise.resolve(
        axiosResponse({ items: TENANTS, totalCount: TENANTS.length, continuationToken: null })
      );
    });
    const { container } = render(<Harness field={field} client={client} initial="unknown-id" />);
    await waitFor(() =>
      expect(container.querySelector('[data-granit-lookup-readonly]')).not.toBeNull()
    );
    expect(container.querySelector('[data-granit-lookup-readonly]')?.textContent).toBe(
      'unknown-id'
    );
  });

  it('renders an empty read-only label when the value is null and nothing resolves', () => {
    const field = lookupField('TenantId', { name: 'tenants' }, { readOnly: true });
    const { container } = render(<Harness field={field} client={tenantClient()} initial={null} />);
    const ro = container.querySelector('[data-granit-lookup-readonly]');
    expect(ro).not.toBeNull();
    expect(ro?.textContent).toBe('');
  });
});

describe('LookupFormComponent — combobox arms', () => {
  it('sets aria-invalid on the input when an error message is present', async () => {
    const field = lookupField('TenantId', { name: 'tenants' });
    const { container } = render(
      <QueryClientProvider client={createTestQueryClient()}>
        <DataLookupProvider config={{ client: tenantClient() }}>
          <EntityRendererProvider components={STANDARD_FORM_COMPONENTS}>
            <EntityForm
              variant={variantWith(field)}
              values={{ TenantId: null }}
              onChange={() => undefined}
              errors={{ TenantId: 'Required' }}
            />
          </EntityRendererProvider>
        </DataLookupProvider>
      </QueryClientProvider>
    );
    await waitFor(() => expect(container.querySelector('[role="combobox"]')).not.toBeNull());
    expect(container.querySelector('[role="combobox"]')?.getAttribute('aria-invalid')).toBe('true');
  });

  it('commits an option via the keyboard (Enter) as well as click', async () => {
    const field = lookupField('TenantId', { name: 'tenants' });
    const onChangeSpy = vi.fn();
    const { container } = render(
      <Harness field={field} client={tenantClient()} onChangeSpy={onChangeSpy} />
    );
    await waitFor(() =>
      expect(container.querySelectorAll('[role="option"]').length).toBeGreaterThan(0)
    );
    const option = container.querySelector('[role="option"][data-value="t-2"]')!;
    fireEvent.keyDown(option, { key: 'Enter' });
    expect(onChangeSpy).toHaveBeenLastCalledWith({ TenantId: 't-2' });
  });

  it('ignores non-activation keys on an option', async () => {
    const field = lookupField('TenantId', { name: 'tenants' });
    const onChangeSpy = vi.fn();
    const { container } = render(
      <Harness field={field} client={tenantClient()} onChangeSpy={onChangeSpy} />
    );
    await waitFor(() =>
      expect(container.querySelectorAll('[role="option"]').length).toBeGreaterThan(0)
    );
    const option = container.querySelector('[role="option"][data-value="t-2"]')!;
    fireEvent.keyDown(option, { key: 'ArrowDown' });
    expect(onChangeSpy).not.toHaveBeenCalled();
  });
});
