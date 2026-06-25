import { fireEvent, render } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { EntityForm } from '../components/entity-form';
import {
  EntityRendererProvider,
  type EntityFormComponent,
  type EntityComponentCatalog,
} from '../providers/index';

import type {
  EntityFormFieldManifest,
  EntityFormManifest,
  EntityFormSectionManifest,
} from '@granit/entities';
import type { ReactNode } from 'react';

const textWidget: EntityFormComponent = ({ field, value, onChange, readOnly }) => (
  <input
    data-testid={`component-${field.propertyName}`}
    value={typeof value === 'string' ? value : ''}
    onChange={(e) => onChange(e.target.value)}
    readOnly={readOnly}
  />
);

const catalog: EntityComponentCatalog = {
  form: { text: textWidget },
};

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
    lookup: null,
    ...overrides,
  };
}

function section(
  key: string,
  order: number,
  fields: EntityFormFieldManifest[],
  overrides: Partial<EntityFormSectionManifest> = {}
): EntityFormSectionManifest {
  return {
    key,
    labelKey: `Section.${key}.Label`,
    order,
    collapsedByDefault: false,
    fields,
    ...overrides,
  };
}

function manifest(...sections: EntityFormSectionManifest[]): EntityFormManifest {
  return { name: 'default', customizable: false, sections };
}

function withProvider(
  children: ReactNode,
  widgets: EntityComponentCatalog = catalog,
  resolveLabel?: (key: string, fallback?: string) => string
) {
  return (
    <EntityRendererProvider components={widgets} resolveLabel={resolveLabel}>
      {children}
    </EntityRendererProvider>
  );
}

describe('EntityForm', () => {
  it('renders sections sorted by order, fields sorted by order', () => {
    const variant = manifest(
      section('details', 20, [field('Email', 10), field('Name', 0)]),
      section('identity', 10, [field('Number', 0)])
    );
    const { container } = render(
      withProvider(<EntityForm variant={variant} values={{}} onChange={() => undefined} />)
    );
    const sectionEls = container.querySelectorAll('[data-granit-form-section]');
    expect(Array.from(sectionEls).map((el) => el.getAttribute('data-section-key'))).toEqual([
      'identity',
      'details',
    ]);
    const fieldEls = container.querySelectorAll(
      '[data-granit-form-section][data-section-key="details"] [data-granit-form-field]'
    );
    expect(Array.from(fieldEls).map((el) => el.getAttribute('data-property'))).toEqual([
      'Name',
      'Email',
    ]);
  });

  it('hides fields whose visibleIf evaluates false', () => {
    const variant = manifest(
      section('main', 0, [
        field('Status', 0),
        field('ClosureReason', 1, {
          visibleIf: { field: 'Status', op: 'Eq', value: 'Closed' },
        }),
      ])
    );
    const { queryByTestId, rerender } = render(
      withProvider(
        <EntityForm variant={variant} values={{ Status: 'Active' }} onChange={() => undefined} />
      )
    );
    expect(queryByTestId('component-ClosureReason')).toBeNull();

    rerender(
      withProvider(
        <EntityForm variant={variant} values={{ Status: 'Closed' }} onChange={() => undefined} />
      )
    );
    expect(queryByTestId('component-ClosureReason')).not.toBeNull();
  });

  it('renders MissingComponent when the catalog has no component for the id', () => {
    const variant = manifest(
      section('main', 0, [field('Number', 0, { component: 'unknown-component' })])
    );
    const { container } = render(
      withProvider(<EntityForm variant={variant} values={{}} onChange={() => undefined} />)
    );
    const missing = container.querySelector('[data-granit-missing-component]');
    expect(missing).not.toBeNull();
    expect(missing?.getAttribute('data-component')).toBe('unknown-component');
  });

  it('forwards readOnly to widgets (form prop OR field flag)', () => {
    const variant = manifest(
      section('main', 0, [field('Editable', 0), field('LockedByField', 1, { readOnly: true })])
    );
    const { getByTestId, rerender, unmount } = render(
      withProvider(<EntityForm variant={variant} values={{}} onChange={() => undefined} />)
    );
    expect((getByTestId('component-Editable') as HTMLInputElement).readOnly).toBe(false);
    expect((getByTestId('component-LockedByField') as HTMLInputElement).readOnly).toBe(true);

    rerender(
      withProvider(<EntityForm variant={variant} values={{}} onChange={() => undefined} readOnly />)
    );
    expect((getByTestId('component-Editable') as HTMLInputElement).readOnly).toBe(true);
    expect((getByTestId('component-LockedByField') as HTMLInputElement).readOnly).toBe(true);
    unmount();
  });

  it('forwards widget changes through onChange merged with prior values', () => {
    const variant = manifest(section('main', 0, [field('Name', 0)]));
    const onChange = vi.fn();
    const { getByTestId } = render(
      withProvider(
        <EntityForm variant={variant} values={{ Number: 'ACME-001' }} onChange={onChange} />
      )
    );
    fireEvent.change(getByTestId('component-Name'), { target: { value: 'ACME' } });
    expect(onChange).toHaveBeenCalledWith({ Number: 'ACME-001', Name: 'ACME' });
  });

  it('supports a controlled-state integration end to end', () => {
    const variant = manifest(section('main', 0, [field('Name', 0)]));
    function Host() {
      const [values, setValues] = useState<Readonly<Record<string, unknown>>>({});
      return <EntityForm variant={variant} values={values} onChange={setValues} />;
    }
    const { getByTestId } = render(withProvider(<Host />));
    const input = getByTestId('component-Name') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Smith' } });
    expect((getByTestId('component-Name') as HTMLInputElement).value).toBe('Smith');
  });

  it('resolves label keys via the provider resolver', () => {
    const variant = manifest(section('identity', 0, [field('Number', 0)]));
    const resolve = vi.fn((key: string) => `[${key}]`);
    const { container } = render(
      withProvider(
        <EntityForm variant={variant} values={{}} onChange={() => undefined} />,
        catalog,
        resolve
      )
    );
    expect(container.textContent).toContain('[Section.identity.Label]');
    expect(container.textContent).toContain('[Field.Number.Label]');
  });

  it('falls back to a humanized property name when a field has no labelKey', () => {
    const variant = manifest(
      section('identity', 0, [
        field('Kind', 0, { labelKey: null }),
        field('TaxId', 1, { labelKey: null }),
      ])
    );
    const { container } = render(
      withProvider(<EntityForm variant={variant} values={{}} onChange={() => undefined} />)
    );
    const labels = Array.from(
      container.querySelectorAll('[data-granit-field-label]'),
      (el) => el.textContent
    );
    expect(labels).toContain('Kind');
    expect(labels).toContain('Tax Id');
  });

  it('passes the humanized property name as the resolver fallback for null labelKey', () => {
    const variant = manifest(section('identity', 0, [field('TaxId', 0, { labelKey: null })]));
    const resolve = vi.fn((key: string, fallback?: string) => fallback ?? `[${key}]`);
    const { container } = render(
      withProvider(
        <EntityForm variant={variant} values={{}} onChange={() => undefined} />,
        catalog,
        resolve
      )
    );
    expect(resolve).toHaveBeenCalledWith('TaxId', 'Tax Id');
    const label = container.querySelector('[data-property="TaxId"] [data-granit-field-label]');
    expect(label?.textContent).toBe('Tax Id');
  });

  it('renders the error message when one is provided for a field', () => {
    const variant = manifest(section('main', 0, [field('Email', 0)]));
    const { container } = render(
      withProvider(
        <EntityForm
          variant={variant}
          values={{}}
          onChange={() => undefined}
          errors={{ Email: 'Required' }}
        />
      )
    );
    const error = container.querySelector('[data-granit-field-error]');
    expect(error?.textContent).toBe('Required');
    expect(error?.getAttribute('role')).toBe('alert');
  });
});
