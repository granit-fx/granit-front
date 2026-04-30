import { render, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  EMPTY_WIDGET_CATALOG,
  EntityRendererProvider,
  useEntityRenderer,
  type EntityFormWidget,
  type EntityWidgetCatalog,
} from '../provider/index.js';

import type { EntityFormFieldManifest } from '@granit/entities';
import type { ReactNode } from 'react';

const dummyField: EntityFormFieldManifest = {
  propertyName: 'Number',
  clrTypeName: 'String',
  widget: 'text',
  config: null,
  labelKey: 'Granit.Parties.Party.Number.Label',
  helpKey: null,
  order: 0,
  readOnly: false,
  visibleIf: null,
};

const textWidget: EntityFormWidget = ({ value }) => <span>{String(value)}</span>;

const catalog: EntityWidgetCatalog = {
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
      <EntityRendererProvider widgets={catalog} resolveLabel={(_, fallback) => fallback ?? 'X'}>
        {children}
      </EntityRendererProvider>
    );
    const { result } = renderHook(() => useEntityRenderer(), { wrapper });

    expect(result.current.widgets).toBe(catalog);
    expect(result.current.resolveLabel('any.key', 'fallback')).toBe('fallback');
    expect(result.current.resolveLabel('any.key')).toBe('X');
  });

  it('defaults to an empty catalog and identity resolver', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <EntityRendererProvider>{children}</EntityRendererProvider>
    );
    const { result } = renderHook(() => useEntityRenderer(), { wrapper });

    expect(result.current.widgets).toBe(EMPTY_WIDGET_CATALOG);
    expect(result.current.resolveLabel('Granit.Foo.Bar')).toBe('Granit.Foo.Bar');
    expect(result.current.resolveLabel('Granit.Foo.Bar', 'Bar label')).toBe('Bar label');
  });

  it('lets a child component look up a registered widget and render it', () => {
    function Sample() {
      const { widgets } = useEntityRenderer();
      const Widget = widgets.form[dummyField.widget];
      return Widget ? (
        <Widget field={dummyField} value="ACME-001" onChange={() => undefined} readOnly={false} />
      ) : null;
    }

    const { container } = render(
      <EntityRendererProvider widgets={catalog}>
        <Sample />
      </EntityRendererProvider>
    );

    expect(container.textContent).toBe('ACME-001');
  });
});
