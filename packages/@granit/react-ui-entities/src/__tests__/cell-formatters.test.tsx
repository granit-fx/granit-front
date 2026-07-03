import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { formatCell } from '../cell-formatters';

import type { CellFormatterContext } from '../cell-formatters';
import type { ColumnDefinition } from '@granit/query-engine';

function makeColumn(overrides: Partial<ColumnDefinition> = {}): ColumnDefinition {
  return {
    name: 'value',
    label: 'Value',
    type: 'String',
    order: 0,
    isSortable: false,
    isFilterable: false,
    isVisible: true,
    ...overrides,
  };
}

function makeCtx(
  column: ColumnDefinition,
  row: Readonly<Record<string, unknown>>,
  overrides: Partial<CellFormatterContext> = {}
): CellFormatterContext {
  return {
    row,
    column,
    component: undefined,
    currencyResolver: () => 'EUR',
    locale: 'en-US',
    formatDate: (d) => `D:${String(d)}`,
    formatDateTime: (d) => `DT:${String(d)}`,
    ...overrides,
  };
}

/** Renders the node returned by formatCell and yields its DOM container. */
function renderCell(ctx: CellFormatterContext): HTMLElement {
  const { container } = render(<>{formatCell(ctx)}</>);
  return container;
}

function textOf(ctx: CellFormatterContext): string {
  return renderCell(ctx).textContent ?? '';
}

describe('formatCell — empty & fallback', () => {
  it('renders an em dash for null / undefined', () => {
    const col = makeColumn({ valueKind: 'Number' });
    expect(textOf(makeCtx(col, { value: null }))).toBe('—');
    expect(textOf(makeCtx(col, {}))).toBe('—');
  });

  it('falls back to text for an unmapped valueKind', () => {
    const col = makeColumn({ valueKind: 'Json' });
    expect(textOf(makeCtx(col, { value: 'raw-payload' }))).toBe('raw-payload');
  });

  it('falls through to text when a mapped formatter cannot render the value type', () => {
    // Currency expects a number; a string cannot be rendered as money.
    const col = makeColumn({ valueKind: 'Currency' });
    expect(textOf(makeCtx(col, { value: 'N/A' }))).toBe('N/A');
  });
});

describe('formatCell — resolution priority', () => {
  it('lets valueKind win over the manifest component', () => {
    // component=money would render €1.00; valueKind=Number must win → "100".
    const col = makeColumn({ valueKind: 'Number' });
    expect(textOf(makeCtx(col, { value: 100 }, { component: 'money' }))).toBe('100');
  });

  it('keeps the legacy money component path when valueKind is absent', () => {
    const col = makeColumn();
    const text = textOf(makeCtx(col, { value: 12345 }, { component: 'money' }));
    expect(text).toContain('123.45');
    expect(text).toContain('€');
  });
});

describe('formatCell — Currency valueKind', () => {
  it('formats with a fixed currencyCode (design-time constant)', () => {
    const col = makeColumn({ valueKind: 'Currency', currencyCode: 'GBP' });
    const text = textOf(makeCtx(col, { value: 12345 }));
    expect(text).toContain('123.45');
    expect(text).toContain('£');
  });

  it('reads the per-row code from currencyCodeField (multi-currency)', () => {
    const col = makeColumn({ valueKind: 'Currency', currencyCodeField: 'currency' });
    const usd = textOf(makeCtx(col, { value: 12345, currency: 'USD' }));
    const eur = textOf(makeCtx(col, { value: 12345, currency: 'EUR' }));
    expect(usd).toContain('$');
    expect(eur).toContain('€');
    expect(usd).not.toBe(eur);
  });

  it('prefers a fixed currencyCode over the per-row field', () => {
    const col = makeColumn({
      valueKind: 'Currency',
      currencyCode: 'GBP',
      currencyCodeField: 'currency',
    });
    const text = textOf(makeCtx(col, { value: 12345, currency: 'USD' }));
    expect(text).toContain('£');
    expect(text).not.toContain('$');
  });

  it('falls back to a plain locale number when no code resolves', () => {
    const col = makeColumn({ valueKind: 'Currency' });
    const text = textOf(makeCtx(col, { value: 12345 }));
    expect(text).toBe('123.45');
  });

  it('falls back to a plain number when the referenced field is missing', () => {
    const col = makeColumn({ valueKind: 'Currency', currencyCodeField: 'currency' });
    const text = textOf(makeCtx(col, { value: 12345 }));
    expect(text).toBe('123.45');
  });
});

describe('formatCell — numeric & measure valueKinds', () => {
  it('formats Number / Count with locale grouping', () => {
    expect(textOf(makeCtx(makeColumn({ valueKind: 'Number' }), { value: 1234567 }))).toBe(
      '1,234,567'
    );
    expect(textOf(makeCtx(makeColumn({ valueKind: 'Count' }), { value: 42 }))).toBe('42');
  });

  it('formats Percentage as xx%', () => {
    expect(textOf(makeCtx(makeColumn({ valueKind: 'Percentage' }), { value: 42.5 }))).toBe('42.5%');
  });

  it('humanizes Bytes', () => {
    expect(textOf(makeCtx(makeColumn({ valueKind: 'Bytes' }), { value: 500 }))).toBe('500 B');
    expect(textOf(makeCtx(makeColumn({ valueKind: 'Bytes' }), { value: 1536 }))).toBe('1.5 KB');
    expect(textOf(makeCtx(makeColumn({ valueKind: 'Bytes' }), { value: 5 * 1024 * 1024 }))).toBe(
      '5 MB'
    );
  });

  it('humanizes Duration (seconds)', () => {
    expect(textOf(makeCtx(makeColumn({ valueKind: 'Duration' }), { value: 3660 }))).toBe('1h 01m');
    expect(textOf(makeCtx(makeColumn({ valueKind: 'Duration' }), { value: 125 }))).toBe('2m 05s');
    expect(textOf(makeCtx(makeColumn({ valueKind: 'Duration' }), { value: 45 }))).toBe('45s');
  });
});

describe('formatCell — link valueKinds', () => {
  it('renders Url as an anchor', () => {
    const a = renderCell(
      makeCtx(makeColumn({ valueKind: 'Url' }), { value: 'https://example.com' })
    ).querySelector('a');
    expect(a?.getAttribute('href')).toBe('https://example.com');
    expect(a?.getAttribute('target')).toBe('_blank');
    expect(a?.textContent).toBe('https://example.com');
  });

  it('renders Email as a mailto anchor', () => {
    const a = renderCell(
      makeCtx(makeColumn({ valueKind: 'Email' }), { value: 'jane@example.com' })
    ).querySelector('a');
    expect(a?.getAttribute('href')).toBe('mailto:jane@example.com');
  });

  it('renders Phone as a tel anchor', () => {
    const a = renderCell(
      makeCtx(makeColumn({ valueKind: 'Phone' }), { value: '+3225550100' })
    ).querySelector('a');
    expect(a?.getAttribute('href')).toBe('tel:+3225550100');
  });
});

describe('formatCell — temporal valueKinds', () => {
  it('formats Date with the date-only formatter', () => {
    expect(
      textOf(makeCtx(makeColumn({ valueKind: 'Date' }), { value: '2026-07-03T10:00:00Z' }))
    ).toBe('D:2026-07-03T10:00:00Z');
  });

  it('formats DateTime / Time / RelativeTime with the datetime formatter', () => {
    for (const kind of ['DateTime', 'Time', 'RelativeTime']) {
      expect(
        textOf(makeCtx(makeColumn({ valueKind: kind }), { value: '2026-07-03T10:00:00Z' }))
      ).toBe('DT:2026-07-03T10:00:00Z');
    }
  });
});

describe('formatCell — other valueKinds', () => {
  it('renders Boolean as a check / cross', () => {
    expect(textOf(makeCtx(makeColumn({ valueKind: 'Boolean' }), { value: true }))).toBe('✓');
    expect(textOf(makeCtx(makeColumn({ valueKind: 'Boolean' }), { value: false }))).toBe('✗');
  });

  it('renders Identifier in a monospace element', () => {
    const code = renderCell(
      makeCtx(makeColumn({ valueKind: 'Identifier' }), { value: 'ORD-2026-001' })
    ).querySelector('code');
    expect(code?.textContent).toBe('ORD-2026-001');
    expect(code?.className).toContain('font-mono');
  });
});
