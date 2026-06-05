import { render, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  EMPTY_COMPONENT_CATALOG,
  EntityRendererProvider,
  useEntityRenderer,
  type EntityFormComponent,
  type EntityComponentCatalog,
} from '../providers/index';

import type { EntityFormFieldManifest } from '@granit/entities';
import type { ReactNode } from 'react';

const dummyField: EntityFormFieldManifest = {
  propertyName: 'Number',
  clrTypeName: 'String',
  component: 'text',
  config: null,
  labelKey: 'Granit.Parties.Party.Number.Label',
  helpKey: null,
  order: 0,
  readOnly: false,
  visibleIf: null,
  lookup: null,
};

const textWidget: EntityFormComponent = ({ value }) => <span>{String(value)}</span>;

const catalog: EntityComponentCatalog = {
  form: { text: textWidget },
};

describe('EntityRendererProvider', () => {
  it('throws when useEntityRenderer is called outside a provider', () => {
    expect(() => renderHook(() => useEntityRenderer())).toThrow(
      /must be called inside an <EntityRendererProvider>/
    );
  });

  it('exposes the catalog and resolver supplied by the provider', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <EntityRendererProvider components={catalog} resolveLabel={(_, fallback) => fallback ?? 'X'}>
        {children}
      </EntityRendererProvider>
    );
    const { result } = renderHook(() => useEntityRenderer(), { wrapper });

    expect(result.current.components).toBe(catalog);
    expect(result.current.resolveLabel('any.key', 'fallback')).toBe('fallback');
    expect(result.current.resolveLabel('any.key')).toBe('X');
  });

  it('defaults to an empty catalog and identity resolver', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <EntityRendererProvider>{children}</EntityRendererProvider>
    );
    const { result } = renderHook(() => useEntityRenderer(), { wrapper });

    expect(result.current.components).toBe(EMPTY_COMPONENT_CATALOG);
    expect(result.current.resolveLabel('Granit.Foo.Bar')).toBe('Granit.Foo.Bar');
    expect(result.current.resolveLabel('Granit.Foo.Bar', 'Bar label')).toBe('Bar label');
  });

  it('lets a child component look up a registered widget and render it', () => {
    function Sample() {
      const { components } = useEntityRenderer();
      const Widget = components.form[dummyField.component];
      return Widget ? (
        <Widget field={dummyField} value="ACME-001" onChange={() => undefined} readOnly={false} />
      ) : null;
    }

    const { container } = render(
      <EntityRendererProvider components={catalog}>
        <Sample />
      </EntityRendererProvider>
    );

    expect(container.textContent).toBe('ACME-001');
  });
});
