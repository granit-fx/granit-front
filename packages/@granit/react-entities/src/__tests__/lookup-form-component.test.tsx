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

const TENANTS: LookupItemResponse[] = [
  { value: 't-1', label: 'Acme Corp', extra: null },
  { value: 't-2', label: 'Globex', extra: null },
];

function lookupField(
  propertyName: string,
  lookup: LookupDescriptor,
  overrides: Partial<EntityFormFieldManifest> = {}
): EntityFormFieldManifest {
  return {
    propertyName,
    clrTypeName: 'Guid',
    component: 'text', // type-derived; presence of `lookup` is what routes to the picker
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

/** Mock client: search → TENANTS (optionally filtered), resolve → matching item. */
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
  /** Sibling form values seeded into the form (for cascade scope resolution). */
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

describe('LookupFormComponent (entity-form lookup binding)', () => {
  it('routes a field with a lookup descriptor to the server-backed picker', async () => {
    const field = lookupField('TenantId', { name: 'tenants' });
    const { container } = render(<Harness field={field} client={tenantClient()} />);

    // Dispatch picked `lookup`, not the type-derived `text` component.
    const wrapper = container.querySelector('[data-granit-form-field]');
    expect(wrapper?.getAttribute('data-component')).toBe('lookup');
    expect(container.querySelector('[data-granit-lookup]')).not.toBeNull();

    await waitFor(() =>
      expect(container.querySelectorAll('[role="option"]').length).toBe(TENANTS.length)
    );
  });

  it('commits the selected option value to the form', async () => {
    const field = lookupField('TenantId', { name: 'tenants' });
    const onChangeSpy = vi.fn();
    const { container } = render(
      <Harness field={field} client={tenantClient()} onChangeSpy={onChangeSpy} />
    );

    await waitFor(() =>
      expect(container.querySelectorAll('[role="option"]').length).toBeGreaterThan(0)
    );
    const option = container.querySelector('[role="option"][data-value="t-2"]')!;
    fireEvent.click(option);

    expect(onChangeSpy).toHaveBeenLastCalledWith({ TenantId: 't-2' });
  });

  it('rehydrates the persisted value into its localized label', async () => {
    const field = lookupField('TenantId', { name: 'tenants' });
    const { container } = render(<Harness field={field} client={tenantClient()} initial="t-1" />);

    await waitFor(() =>
      expect(container.querySelector('[data-granit-lookup-selected]')?.textContent).toBe(
        'Acme Corp'
      )
    );
  });

  it('renders the resolved label as static text when read-only', async () => {
    const field = lookupField('TenantId', { name: 'tenants' }, { readOnly: true });
    const { container } = render(<Harness field={field} client={tenantClient()} initial="t-2" />);

    await waitFor(() =>
      expect(container.querySelector('[data-granit-lookup-readonly]')?.textContent).toBe('Globex')
    );
    expect(container.querySelector('input')).toBeNull();
  });

  it('shows the missing-scope placeholder and fires NO request when scope is incomplete', () => {
    const field = lookupField('MeterId', { name: 'meters', scopeKeys: ['tenantId'] });
    const client = tenantClient();
    const { container } = render(<Harness field={field} client={client} />);

    expect(
      container
        .querySelector('[data-granit-lookup-scope-missing]')
        ?.getAttribute('data-granit-lookup-scope-missing')
    ).toBe('tenantId');
    expect(client.get).not.toHaveBeenCalled();
  });

  it('resolves the cascade scope from sibling form values and fires the search', async () => {
    const field = lookupField('MeterId', { name: 'meters', scopeKeys: ['tenantId'] });
    const client = tenantClient();
    // A sibling `TenantId` value satisfies the camelCase `tenantId` scope key.
    const { container } = render(
      <Harness field={field} client={client} seedValues={{ TenantId: 't-1' }} />
    );

    expect(container.querySelector('[data-granit-lookup-scope-missing]')).toBeNull();
    await waitFor(() => expect(client.get).toHaveBeenCalled());
    const scopedCall = vi
      .mocked(client.get)
      .mock.calls.find((c) => !String(c[0]).includes('/resolve'));
    expect((scopedCall?.[1] as { params?: Record<string, unknown> }).params).toMatchObject({
      'scope.tenantId': 't-1',
    });
  });
});
