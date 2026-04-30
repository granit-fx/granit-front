import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { EntityDetail } from '../components/entity-detail.js';
import { EntityRendererProvider } from '../provider/index.js';

import type { EntityDetailManifest } from '@granit/entities';
import type { ReactNode } from 'react';

function variant(overrides: Partial<EntityDetailManifest> = {}): EntityDetailManifest {
  return {
    name: 'default',
    sections: [],
    sidePanels: [],
    ...overrides,
  };
}

function withProvider(children: ReactNode, resolveLabel?: (key: string) => string) {
  return <EntityRendererProvider resolveLabel={resolveLabel}>{children}</EntityRendererProvider>;
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

  it('emits the inherits-from-form placeholder when inheritsFromFormVariant is set', () => {
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
    const marker = container.querySelector('[data-granit-detail-inherits]');
    expect(marker).not.toBeNull();
    expect(marker?.getAttribute('data-form-variant')).toBe('default');
    expect(container.querySelector('[data-granit-detail-fields]')).toBeNull();
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
