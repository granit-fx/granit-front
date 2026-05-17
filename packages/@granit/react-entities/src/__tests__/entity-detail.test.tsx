import { GranitClientProvider } from '@granit/react-api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import axios from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { EntityDetail } from '../components/entity-detail.js';
import {
  EntityRendererProvider,
  type EntitySidePanel,
  type EntityComponentCatalog,
} from '../providers/index.js';

import type {
  EntityDetailManifest,
  EntityFormFieldManifest,
  EntityFormManifest,
} from '@granit/entities';
import type { ReactNode } from 'react';

function field(
  propertyName: string,
  order: number,
  overrides: Partial<EntityFormFieldManifest> = {}
): EntityFormFieldManifest {
  return {
    propertyName,
    clrTypeName: 'String',
    component: 'text',
    config: null,
    labelKey: `Field.${propertyName}.Label`,
    helpKey: null,
    order,
    readOnly: false,
    visibleIf: null,
    ...overrides,
  };
}

function formVariant(
  name: string,
  sections: ReadonlyArray<{ key: string; order: number; fields: EntityFormFieldManifest[] }>
): EntityFormManifest {
  return {
    name,
    customizable: false,
    sections: sections.map((s) => ({
      key: s.key,
      labelKey: null,
      order: s.order,
      collapsedByDefault: false,
      fields: s.fields,
    })),
  };
}

function variant(overrides: Partial<EntityDetailManifest> = {}): EntityDetailManifest {
  return {
    name: 'default',
    sections: [],
    sidePanels: [],
    ...overrides,
  };
}

function withProvider(
  children: ReactNode,
  resolveLabel?: (key: string) => string,
  widgets?: EntityComponentCatalog
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const apiClient = axios.create({ baseURL: 'http://localhost' });
  return (
    <QueryClientProvider client={queryClient}>
      <GranitClientProvider client={apiClient}>
        <EntityRendererProvider resolveLabel={resolveLabel} components={widgets}>
          {children}
        </EntityRendererProvider>
      </GranitClientProvider>
    </QueryClientProvider>
  );
}

describe('EntityDetail', () => {
  it('renders sections sorted by order', () => {
    const v = variant({
      sections: [
        {
          key: 'b',
          labelKey: null,
          order: 20,
          inheritsFromFormVariant: null,
          fields: ['Two'],
        },
        {
          key: 'a',
          labelKey: null,
          order: 10,
          inheritsFromFormVariant: null,
          fields: ['One'],
        },
      ],
    });
    const { container } = render(withProvider(<EntityDetail variant={v} values={{}} />));
    const keys = Array.from(container.querySelectorAll('[data-granit-detail-section]')).map((el) =>
      el.getAttribute('data-section-key')
    );
    expect(keys).toEqual(['a', 'b']);
  });

  it('renders free-form fields as <dt>/<dd> rows with null collapsed to em-dash', () => {
    const v = variant({
      sections: [
        {
          key: 'main',
          labelKey: null,
          order: 0,
          inheritsFromFormVariant: null,
          fields: ['Name', 'IsActive', 'Missing'],
        },
      ],
    });
    const { container } = render(
      withProvider(<EntityDetail variant={v} values={{ Name: 'ACME', IsActive: true }} />)
    );
    const rows = container.querySelectorAll('[data-granit-detail-row]');
    expect(rows).toHaveLength(3);
    const byProperty = (property: string) =>
      Array.from(rows).find((r) => r.getAttribute('data-property') === property);
    expect(byProperty('Name')?.querySelector('dd')?.textContent).toBe('ACME');
    expect(byProperty('IsActive')?.querySelector('dd')?.textContent).toBe('✓');
    expect(byProperty('Missing')?.querySelector('dd')?.textContent).toBe('—');
  });

  it('emits a missing-variant marker when formVariants is not provided', () => {
    const v = variant({
      sections: [
        {
          key: 'identity',
          labelKey: null,
          order: 0,
          inheritsFromFormVariant: 'default',
          fields: null,
        },
      ],
    });
    const { container } = render(withProvider(<EntityDetail variant={v} values={{}} />));
    const marker = container.querySelector('[data-granit-detail-inherits-missing]');
    expect(marker).not.toBeNull();
    expect(marker?.getAttribute('data-form-variant')).toBe('default');
  });

  it('emits a missing-variant marker when the named variant is absent from formVariants', () => {
    const v = variant({
      sections: [
        {
          key: 'identity',
          labelKey: null,
          order: 0,
          inheritsFromFormVariant: 'wizard',
          fields: null,
        },
      ],
    });
    const { container } = render(
      withProvider(
        <EntityDetail variant={v} values={{}} formVariants={[formVariant('default', [])]} />
      )
    );
    expect(container.querySelector('[data-granit-detail-inherits-missing]')).not.toBeNull();
  });

  it('flattens inherited form variant fields in section order then field order', () => {
    const v = variant({
      sections: [
        {
          key: 'identity',
          labelKey: null,
          order: 0,
          inheritsFromFormVariant: 'default',
          fields: null,
        },
      ],
    });
    const variants = [
      formVariant('default', [
        { key: 'b', order: 20, fields: [field('Email', 10), field('Phone', 0)] },
        { key: 'a', order: 10, fields: [field('Number', 0), field('Name', 1)] },
      ]),
    ];
    const { container } = render(
      withProvider(
        <EntityDetail
          variant={v}
          values={{ Number: '001', Name: 'ACME', Phone: '555', Email: 'a@b' }}
          formVariants={variants}
        />
      )
    );
    const rows = Array.from(container.querySelectorAll('[data-granit-detail-row][data-inherited]'));
    expect(rows.map((r) => r.getAttribute('data-property'))).toEqual([
      'Number',
      'Name',
      'Phone',
      'Email',
    ]);
  });

  it('renders inherited field labels via the provider resolver and skips visibleIf=false', () => {
    const v = variant({
      sections: [
        {
          key: 'identity',
          labelKey: null,
          order: 0,
          inheritsFromFormVariant: 'default',
          fields: null,
        },
      ],
    });
    const variants = [
      formVariant('default', [
        {
          key: 'main',
          order: 0,
          fields: [
            field('Status', 0),
            field('ClosureReason', 1, {
              visibleIf: { field: 'Status', op: 'Eq', value: 'Closed' },
            }),
          ],
        },
      ]),
    ];
    const resolve = vi.fn((key: string) => `[${key}]`);
    const { container, rerender } = render(
      withProvider(
        <EntityDetail variant={v} values={{ Status: 'Active' }} formVariants={variants} />,
        resolve
      )
    );
    expect(container.textContent).toContain('[Field.Status.Label]');
    expect(container.querySelector('[data-property="ClosureReason"]')).toBeNull();

    rerender(
      withProvider(
        <EntityDetail variant={v} values={{ Status: 'Closed' }} formVariants={variants} />,
        resolve
      )
    );
    expect(container.querySelector('[data-property="ClosureReason"]')).not.toBeNull();
  });

  it('renders side-panel slots sorted by order with kind data attribute', () => {
    const v = variant({
      sidePanels: [
        { kind: 'Timeline', order: 20 },
        { kind: 'Audit', order: 10 },
      ],
    });
    const { container } = render(withProvider(<EntityDetail variant={v} values={{}} />));
    const slots = container.querySelectorAll('[data-granit-side-panel-slot]');
    expect(Array.from(slots).map((el) => el.getAttribute('data-kind'))).toEqual([
      'Audit',
      'Timeline',
    ]);
  });

  it('omits the rail when no side panels are declared', () => {
    const v = variant();
    const { container } = render(withProvider(<EntityDetail variant={v} values={{}} />));
    expect(container.querySelector('[data-granit-detail-rail]')).toBeNull();
  });

  it('mounts a registered side-panel renderer when entityName + entityId are supplied', () => {
    const v = variant({
      sidePanels: [
        { kind: 'Timeline', order: 20 },
        { kind: 'Audit', order: 10 },
      ],
    });
    const audit: EntitySidePanel = ({ entityName, entityId }) => (
      <div data-testid="audit-panel">
        {entityName}#{entityId}
      </div>
    );
    const widgets: EntityComponentCatalog = { form: {}, sidePanels: { Audit: audit } };
    const { container, getByTestId } = render(
      withProvider(
        <EntityDetail variant={v} values={{}} entityName="Granit.Parties.Party" entityId="42" />,
        undefined,
        widgets
      )
    );
    expect(getByTestId('audit-panel').textContent).toBe('Granit.Parties.Party#42');
    // Timeline has no registered renderer — slot stays empty but present.
    const timelineSlot = container.querySelector('[data-kind="Timeline"]');
    expect(timelineSlot).not.toBeNull();
    expect(timelineSlot?.children.length).toBe(0);
  });

  it('falls back to an empty slot when entityName / entityId are missing', () => {
    const v = variant({ sidePanels: [{ kind: 'Audit', order: 0 }] });
    const audit: EntitySidePanel = () => <div data-testid="audit-panel" />;
    const widgets: EntityComponentCatalog = { form: {}, sidePanels: { Audit: audit } };
    const { queryByTestId } = render(
      withProvider(<EntityDetail variant={v} values={{}} />, undefined, widgets)
    );
    expect(queryByTestId('audit-panel')).toBeNull();
  });

  it('resolves section label keys via the provider resolver', () => {
    const v = variant({
      sections: [
        {
          key: 'main',
          labelKey: 'Section.Main.Label',
          order: 0,
          inheritsFromFormVariant: null,
          fields: [],
        },
      ],
    });
    const resolve = vi.fn((key: string) => `[${key}]`);
    const { container } = render(withProvider(<EntityDetail variant={v} values={{}} />, resolve));
    expect(container.textContent).toContain('[Section.Main.Label]');
  });
});
