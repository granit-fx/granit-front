import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CollectionSectionCard } from './collection-section-card';

import type {
  CollectionColumnManifest,
  EntityCollectionSectionManifest,
} from './manifest-extensions';

function section(
  overrides: Partial<EntityCollectionSectionManifest> = {}
): EntityCollectionSectionManifest {
  return {
    key: 'lineItems',
    labelKey: null,
    order: 0,
    propertyName: 'lineItems',
    columns: [{ propertyName: 'description', labelKey: null, align: 'left' }],
    ...overrides,
  };
}

const MONEY_COLUMNS: readonly CollectionColumnManifest[] = [
  { propertyName: 'description', labelKey: null, align: 'left' },
  { propertyName: 'quantity', labelKey: null, align: 'right' },
  { propertyName: 'total', labelKey: null, component: 'money', align: 'right' },
];

describe('CollectionSectionCard', () => {
  it('renders the empty placeholder when the source property is absent', () => {
    const { container } = render(
      <CollectionSectionCard section={section()} values={{}} locale="en-GB" />
    );
    const card = container.querySelector('[data-slot="collection-section-card"]');
    expect(card).not.toBeNull();
    expect(card?.getAttribute('data-section-key')).toBe('lineItems');
    // No table rendered in the empty branch.
    expect(container.querySelector('table')).toBeNull();
    expect(container.querySelector('p')).not.toBeNull();
  });

  it('renders the empty placeholder when the source array is empty', () => {
    const { container } = render(
      <CollectionSectionCard section={section()} values={{ lineItems: [] }} locale="en-GB" />
    );
    expect(container.querySelector('[data-slot="collection-section-card"]')).not.toBeNull();
    expect(container.querySelector('table')).toBeNull();
  });

  it('renders a populated table with a Sum footer and formats money via the currency property', () => {
    const s = section({
      currencyProperty: 'currency',
      columns: MONEY_COLUMNS,
      footer: { aggregate: 'Sum', propertyName: 'total', component: 'money', labelKey: null },
    });
    const values = {
      currency: 'EUR',
      lineItems: [
        { id: '1', description: 'A', quantity: 2, total: 12000 },
        { id: '2', description: 'B', quantity: 1, total: 8000 },
      ],
    };
    const { container } = render(
      <CollectionSectionCard section={s} values={values} locale="en-GB" />
    );
    expect(container.querySelectorAll('tbody tr')).toHaveLength(2);
    const bodyCells = container.querySelectorAll('tbody tr:first-child td');
    // money column: 12000 minor units / 100 → 120.00 in EUR
    expect(bodyCells[2]?.textContent).toContain('120');
    const footer = container.querySelector('tfoot');
    expect(footer).not.toBeNull();
    // colSpan spans all but the last column.
    expect(footer?.querySelector('td')?.getAttribute('colspan')).toBe('2');
    // Sum of 12000 + 8000 = 20000 → 200.00
    expect(footer?.querySelectorAll('td')[1]?.textContent).toContain('200');
  });

  it('resolves the footer label key to its last segment and falls back to EUR without a currency property', () => {
    const s = section({
      columns: MONEY_COLUMNS,
      footer: {
        aggregate: 'Sum',
        propertyName: 'total',
        component: 'money',
        labelKey: 'Invoice:Footer.Grand',
      },
    });
    const values = { lineItems: [{ id: '1', description: 'A', quantity: 1, total: 10000 }] };
    const { container } = render(
      <CollectionSectionCard section={s} values={values} locale="en-GB" />
    );
    const footerLabel = container.querySelector('tfoot td');
    expect(footerLabel?.textContent).toBe('Grand');
    // No currencyProperty → EUR symbol.
    expect(container.querySelector('tfoot')?.textContent).toContain('€');
  });

  it('falls back to EUR when the currency property is declared but missing from values', () => {
    const s = section({
      currencyProperty: 'currency',
      columns: MONEY_COLUMNS,
    });
    const values = { lineItems: [{ id: '1', description: 'A', quantity: 1, total: 10000 }] };
    const { container } = render(
      <CollectionSectionCard section={s} values={values} locale="en-GB" />
    );
    expect(container.querySelector('tbody')?.textContent).toContain('€');
  });

  it('omits the footer when the section declares none', () => {
    const s = section({ columns: MONEY_COLUMNS });
    const values = { lineItems: [{ id: '1', description: 'A', quantity: 1, total: 10000 }] };
    const { container } = render(
      <CollectionSectionCard section={s} values={values} locale="en-GB" />
    );
    expect(container.querySelector('tfoot')).toBeNull();
  });

  it('treats non-numeric footer values as zero when summing', () => {
    const s = section({
      columns: MONEY_COLUMNS,
      footer: { aggregate: 'Sum', propertyName: 'total', labelKey: null },
    });
    const values = {
      lineItems: [
        { id: '1', description: 'A', quantity: 1, total: 5000 },
        { id: '2', description: 'B', quantity: 1, total: 'n/a' },
      ],
    };
    const { container } = render(
      <CollectionSectionCard section={s} values={values} locale="en-GB" />
    );
    // No money component on the footer → plain String() of the raw sum 5000.
    const footerCells = container.querySelectorAll('tfoot td');
    expect(footerCells[1]?.textContent).toBe('5000');
  });

  it('renders email / tel / url link cells and rejects unsafe URL schemes', () => {
    const s = section({
      propertyName: 'contacts',
      columns: [
        { propertyName: 'email', labelKey: null, component: 'email' },
        { propertyName: 'phone', labelKey: null, component: 'tel' },
        { propertyName: 'external', labelKey: null, component: 'url' },
        { propertyName: 'internal', labelKey: null, component: 'url' },
        { propertyName: 'unsafe', labelKey: null, component: 'url' },
      ],
    });
    const values = {
      contacts: [
        {
          id: 'c1',
          email: 'ada@example.com',
          phone: '+32 (2) 555-0123',
          external: 'https://example.com',
          internal: '/parties/c1',
          unsafe: 'javascript:alert(1)',
        },
      ],
    };
    const { container } = render(
      <CollectionSectionCard section={s} values={values} locale="en-GB" />
    );
    const cells = container.querySelectorAll('tbody td');
    expect(cells[0]?.querySelector('a')?.getAttribute('href')).toBe('mailto:ada@example.com');
    // tel strips non-dial characters.
    expect(cells[1]?.querySelector('a')?.getAttribute('href')).toBe('tel:+3225550123');
    const external = cells[2]?.querySelector('a');
    expect(external?.getAttribute('href')).toBe('https://example.com');
    expect(external?.getAttribute('target')).toBe('_blank');
    expect(external?.getAttribute('rel')).toBe('noreferrer');
    const internal = cells[3]?.querySelector('a');
    expect(internal?.getAttribute('href')).toBe('/parties/c1');
    expect(internal?.hasAttribute('target')).toBe(false);
    // Unsafe scheme rendered as plain text, no anchor.
    expect(cells[4]?.querySelector('a')).toBeNull();
    expect(cells[4]?.textContent).toBe('javascript:alert(1)');
  });

  it('rejects protocol-relative URLs (leading //) as unsafe', () => {
    const s = section({
      propertyName: 'contacts',
      columns: [{ propertyName: 'site', labelKey: null, component: 'url' }],
    });
    const values = { contacts: [{ id: 'c1', site: '//evil.example.com' }] };
    const { container } = render(
      <CollectionSectionCard section={s} values={values} locale="en-GB" />
    );
    const cell = container.querySelector('tbody td');
    expect(cell?.querySelector('a')).toBeNull();
    expect(cell?.textContent).toBe('//evil.example.com');
  });

  it('formats scalar cell kinds: null, boolean, object, number and empty link value', () => {
    const s = section({
      propertyName: 'rows',
      columns: [
        { propertyName: 'missing', labelKey: null },
        { propertyName: 'flagTrue', labelKey: null },
        { propertyName: 'flagFalse', labelKey: null },
        { propertyName: 'meta', labelKey: null },
        { propertyName: 'count', labelKey: null },
        { propertyName: 'blankMail', labelKey: null, component: 'email' },
      ],
    });
    const values = {
      rows: [
        {
          id: 'r1',
          missing: null,
          flagTrue: true,
          flagFalse: false,
          meta: { a: 1 },
          count: 42,
          blankMail: '',
        },
      ],
    };
    const { container } = render(
      <CollectionSectionCard section={s} values={values} locale="en-GB" />
    );
    const cells = container.querySelectorAll('tbody td');
    expect(cells[0]?.textContent).toBe('—');
    expect(cells[1]?.textContent).toBe('✓');
    expect(cells[2]?.textContent).toBe('✗');
    expect(cells[3]?.textContent).toBe('{"a":1}');
    expect(cells[4]?.textContent).toBe('42');
    // Empty string with a link component falls through to String('').
    expect(cells[5]?.querySelector('a')).toBeNull();
    expect(cells[5]?.textContent).toBe('');
  });

  it('formats date and datetime components and auto-detects ISO strings without a component', () => {
    const s = section({
      propertyName: 'rows',
      columns: [
        { propertyName: 'd', labelKey: null, component: 'date' },
        { propertyName: 'dt', labelKey: null, component: 'datetime' },
        { propertyName: 'auto', labelKey: null },
        { propertyName: 'plain', labelKey: null },
      ],
    });
    const values = {
      rows: [
        {
          id: 'r1',
          d: '2024-03-12T09:00:00Z',
          dt: '2024-05-30T14:30:00Z',
          auto: '2024-07-01T00:00:00Z',
          plain: 'hello',
        },
      ],
    };
    const { container } = render(
      <CollectionSectionCard section={s} values={values} locale="en-GB" />
    );
    const cells = container.querySelectorAll('tbody td');
    // date-fns PPP format includes the year; raw ISO 'T' marker must be gone.
    expect(cells[0]?.textContent).toContain('2024');
    expect(cells[0]?.textContent).not.toContain('T09:00');
    expect(cells[1]?.textContent).toContain('2024');
    expect(cells[1]?.textContent).toContain(':');
    expect(cells[2]?.textContent).toContain('2024');
    expect(cells[2]?.textContent).not.toContain('T00:00');
    // A non-ISO plain string is passed through verbatim.
    expect(cells[3]?.textContent).toBe('hello');
  });

  it('returns the raw value when a date component receives an unparseable string', () => {
    const s = section({
      propertyName: 'rows',
      columns: [{ propertyName: 'when', labelKey: null, component: 'date' }],
    });
    const values = { rows: [{ id: 'r1', when: 'not-a-date' }] };
    const { container } = render(
      <CollectionSectionCard section={s} values={values} locale="en-GB" />
    );
    expect(container.querySelector('tbody td')?.textContent).toBe('not-a-date');
  });

  it('applies alignment classes and resolves column + section labels', () => {
    const s = section({
      key: 'contacts',
      labelKey: 'Party:Section.Contacts',
      propertyName: 'rows',
      columns: [
        { propertyName: 'left', labelKey: null, align: 'left' },
        { propertyName: 'center', labelKey: 'Col:Center', align: 'center' },
        { propertyName: 'right', labelKey: null, align: 'right' },
        { propertyName: 'default', labelKey: null },
      ],
    });
    const values = { rows: [{ id: 'r1', left: 'a', center: 'b', right: 'c', default: 'd' }] };
    const { container } = render(
      <CollectionSectionCard section={s} values={values} locale="en-GB" />
    );
    const heads = container.querySelectorAll('thead th');
    expect(heads[0]?.className).toContain('text-left');
    expect(heads[1]?.className).toContain('text-center');
    expect(heads[1]?.textContent).toBe('Center');
    expect(heads[2]?.className).toContain('text-right');
    // Undefined align → default left.
    expect(heads[3]?.className).toContain('text-left');
    // Section label resolved from its key path last segment.
    expect(container.querySelector('[data-slot="collection-section-card"]')?.textContent).toContain(
      'Contacts'
    );
  });

  it('falls back to the row index for the key when a row carries no id', () => {
    const s = section({
      propertyName: 'rows',
      columns: [{ propertyName: 'name', labelKey: null }],
    });
    const values = { rows: [{ name: 'first' }, { name: 'second' }] };
    const { container } = render(
      <CollectionSectionCard section={s} values={values} locale="en-GB" />
    );
    expect(container.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(container.querySelector('tbody')?.textContent).toContain('first');
  });

  it('uses the section key as the title when no label key is provided', () => {
    const { container } = render(
      <CollectionSectionCard
        section={section({ key: 'lineItems', labelKey: null })}
        values={{ lineItems: [] }}
        locale="en-GB"
      />
    );
    expect(container.querySelector('[data-slot="collection-section-card"]')?.textContent).toContain(
      'lineItems'
    );
  });
});
