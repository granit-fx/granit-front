import { GranitClientProvider } from '@granit/react-api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import axios from 'axios';
import { describe, expect, it } from 'vitest';

import { EntityDetail } from '../components/entity-detail';
import {
  STANDARD_DETAIL_COMPONENTS,
  defaultDetailFormat,
} from '../field-components/standard-detail-components';
import { EntityRendererProvider } from '../providers/index';

import type { EntityDetailManifest } from '@granit/entities';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Branch-coverage backfill for STANDARD_DETAIL_COMPONENTS. The base catalog
// suite covers the url / email / tel happy paths. This file targets the
// boolean formatter arms, the unsafe-URL rejection, the formatText type
// switch (boolean / object / number / fallback), and the readScalarString
// number→string coercion + null fallback.
// ---------------------------------------------------------------------------

function withProvider(children: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const apiClient = axios.create({ baseURL: 'http://localhost' });
  return (
    <QueryClientProvider client={queryClient}>
      <GranitClientProvider client={apiClient}>
        <EntityRendererProvider
          components={{ form: {}, detail: STANDARD_DETAIL_COMPONENTS.detail }}
        >
          {children}
        </EntityRendererProvider>
      </GranitClientProvider>
    </QueryClientProvider>
  );
}

function freeForm(...fields: string[]): EntityDetailManifest {
  return {
    name: 'default',
    sections: [{ key: 'main', labelKey: null, order: 0, inheritsFromFormVariant: null, fields }],
    sidePanels: [],
  };
}

function renderDetail(property: string, component: string, value: unknown) {
  const { container } = render(
    withProvider(
      <EntityDetail
        variant={freeForm(property)}
        values={{ [property]: value }}
        propertyComponents={{ [property]: component }}
      />
    )
  );
  return container.querySelector(`[data-property="${property}"] dd`);
}

describe('STANDARD_DETAIL_COMPONENTS — boolean formatter', () => {
  it('renders a check for true', () => {
    expect(renderDetail('Active', 'boolean', true)?.textContent).toBe('✓');
  });

  it('renders a cross for false', () => {
    expect(renderDetail('Active', 'boolean', false)?.textContent).toBe('✗');
  });

  it('renders an em-dash for null', () => {
    expect(renderDetail('Active', 'boolean', null)?.textContent).toBe('—');
  });

  it('renders an em-dash for undefined (missing value)', () => {
    const { container } = render(
      withProvider(
        <EntityDetail
          variant={freeForm('Active')}
          values={{}}
          propertyComponents={{ Active: 'boolean' }}
        />
      )
    );
    expect(container.querySelector('[data-property="Active"] dd')?.textContent).toBe('—');
  });
});

describe('STANDARD_DETAIL_COMPONENTS — url rejection', () => {
  it('renders an unsafe scheme as plain text marked data-invalid-url', () => {
    const { container } = render(
      withProvider(
        <EntityDetail
          variant={freeForm('Website')}
          values={{ Website: 'javascript:alert(1)' }}
          propertyComponents={{ Website: 'url' }}
        />
      )
    );
    const span = container.querySelector('[data-property="Website"] [data-invalid-url]');
    expect(span).not.toBeNull();
    expect(span?.tagName).toBe('SPAN');
    expect(container.querySelector('[data-property="Website"] a')).toBeNull();
  });

  it('coerces a numeric url value to a string before validating (renders the digits)', () => {
    const dd = renderDetail('Website', 'url', 12345);
    // readScalarString turns the number into '12345', a relative path → safe → <a>.
    expect(dd?.querySelector('a')?.getAttribute('href')).toBe('12345');
  });
});

describe('STANDARD_DETAIL_COMPONENTS — email / tel null arms', () => {
  it('email renders em-dash for a null value', () => {
    expect(renderDetail('Email', 'email', null)?.textContent).toBe('—');
  });

  it('email renders em-dash for an empty string', () => {
    expect(renderDetail('Email', 'email', '')?.textContent).toBe('—');
  });

  it('tel renders em-dash for a null value', () => {
    expect(renderDetail('Phone', 'tel', null)?.textContent).toBe('—');
  });

  it('tel coerces a numeric value to a string href', () => {
    const dd = renderDetail('Phone', 'tel', 3204712345);
    expect(dd?.querySelector('a')?.getAttribute('href')).toBe('tel:3204712345');
  });
});

describe('STANDARD_DETAIL_COMPONENTS — text formatter type switch', () => {
  it('renders a check/cross for a boolean value through the text formatter', () => {
    expect(renderDetail('Flag', 'text', true)?.textContent).toBe('✓');
    expect(renderDetail('Flag', 'text', false)?.textContent).toBe('✗');
  });

  it('JSON-stringifies an object value', () => {
    expect(renderDetail('Meta', 'text', { a: 1 })?.textContent).toBe('{"a":1}');
  });

  it('stringifies a numeric value', () => {
    expect(renderDetail('Count', 'integer', 7)?.textContent).toBe('7');
  });

  it('em-dash for a null value', () => {
    expect(renderDetail('Notes', 'text', null)?.textContent).toBe('—');
  });
});

describe('defaultDetailFormat (exported fallback)', () => {
  it('formats primitives and falls back to em-dash for unsupported types', () => {
    expect(defaultDetailFormat('hello')).toBe('hello');
    expect(defaultDetailFormat(42)).toBe('42');
    expect(defaultDetailFormat(true)).toBe('✓');
    expect(defaultDetailFormat(null)).toBe('—');
    // A symbol hits neither string/number/object/boolean → final em-dash arm.
    expect(defaultDetailFormat(Symbol('x'))).toBe('—');
  });
});
