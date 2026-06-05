import { act, fireEvent, render, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { EntityForm } from '../components/entity-form';
import { useEntityForm } from '../hooks/use-entity-form';
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

const textWidget: EntityFormComponent = ({ field, value, onChange }) => (
  <input
    data-testid={`component-${field.propertyName}`}
    value={value == null ? '' : String(value)}
    onChange={(e) => onChange(e.target.value)}
  />
);

const catalog: EntityComponentCatalog = { form: { text: textWidget, integer: textWidget } };

function field(
  propertyName: string,
  clrTypeName: string,
  overrides: Partial<EntityFormFieldManifest> = {}
): EntityFormFieldManifest {
  return {
    propertyName,
    clrTypeName,
    component: clrTypeName === 'Int32' ? 'integer' : 'text',
    config: null,
    labelKey: null,
    helpKey: null,
    order: 0,
    readOnly: false,
    visibleIf: null,
    lookup: null,
    ...overrides,
  };
}

function section(
  fields: EntityFormFieldManifest[],
  overrides: Partial<EntityFormSectionManifest> = {}
): EntityFormSectionManifest {
  return {
    key: 'main',
    labelKey: null,
    order: 0,
    collapsedByDefault: false,
    fields,
    ...overrides,
  };
}

function manifest(...sections: EntityFormSectionManifest[]): EntityFormManifest {
  return { name: 'default', customizable: false, sections };
}

function withProvider(children: ReactNode) {
  return <EntityRendererProvider components={catalog}>{children}</EntityRendererProvider>;
}

describe('useEntityForm', () => {
  it('derives type-appropriate defaults from each field', () => {
    const variant = manifest(
      section([
        field('Name', 'String'),
        field('Age', 'Int32'),
        field('IsActive', 'Boolean'),
        field('BirthDate', 'DateOnly'),
      ])
    );
    const { result } = renderHook(() => useEntityForm(variant));
    expect(result.current.formProps.values).toEqual({
      Name: '',
      Age: null,
      IsActive: false,
      BirthDate: null,
    });
  });

  it('overlays user-supplied defaultValues on top of type defaults', () => {
    const variant = manifest(section([field('Name', 'String'), field('Age', 'Int32')]));
    const { result } = renderHook(() =>
      useEntityForm(variant, { defaultValues: { Name: 'ACME' } })
    );
    expect(result.current.formProps.values).toEqual({ Name: 'ACME', Age: null });
  });

  it('flips isDirty after a value change and reverts on reset', () => {
    const variant = manifest(section([field('Name', 'String')]));
    const { result } = renderHook(() => useEntityForm(variant));

    expect(result.current.isDirty).toBe(false);
    act(() => result.current.formProps.onChange({ Name: 'ACME' }));
    expect(result.current.formProps.values.Name).toBe('ACME');
    expect(result.current.isDirty).toBe(true);

    act(() => result.current.reset());
    expect(result.current.formProps.values.Name).toBe('');
    expect(result.current.isDirty).toBe(false);
  });

  it('plugs into <EntityForm /> for an end-to-end controlled flow', () => {
    const variant = manifest(section([field('Name', 'String')]));
    function Host() {
      const { formProps } = useEntityForm(variant);
      return <EntityForm variant={variant} {...formProps} />;
    }
    const { getByTestId } = render(withProvider(<Host />));
    const input = getByTestId('component-Name') as HTMLInputElement;
    expect(input.value).toBe('');
    fireEvent.change(input, { target: { value: 'Smith' } });
    expect((getByTestId('component-Name') as HTMLInputElement).value).toBe('Smith');
  });

  it('handleSubmit invokes the callback with current values when valid', async () => {
    const variant = manifest(section([field('Name', 'String')]));
    const { result } = renderHook(() => useEntityForm(variant));
    const onValid = vi.fn();

    act(() => result.current.formProps.onChange({ Name: 'ACME' }));
    await act(async () => {
      await result.current.handleSubmit(onValid)();
    });

    expect(onValid).toHaveBeenCalledTimes(1);
    expect(onValid.mock.calls[0]?.[0]).toMatchObject({ Name: 'ACME' });
  });
});
