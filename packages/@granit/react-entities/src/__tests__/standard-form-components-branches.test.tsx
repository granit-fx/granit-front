import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { EntityForm } from '../components/entity-form';
import { STANDARD_FORM_COMPONENTS } from '../field-components/index';
import { EntityRendererProvider } from '../providers/index';

import type { EntityFormFieldManifest, EntityFormManifest } from '@granit/entities';

// ---------------------------------------------------------------------------
// Branch-coverage backfill for STANDARD_FORM_COMPONENTS. The base test suite
// drives the happy paths (correct value type, empty → null). This file targets
// the *defensive* branches: a value whose runtime type does not match the
// component's expectation (the `typeof value === X ? … : ''` false arm), the
// NaN parse fallbacks, and the `readOptions` validation guards.
// ---------------------------------------------------------------------------

function singleFieldVariant(field: EntityFormFieldManifest): EntityFormManifest {
  return {
    name: 'default',
    customizable: false,
    sections: [
      { key: 'main', labelKey: null, order: 0, collapsedByDefault: false, fields: [field] },
    ],
  };
}

function field(
  component: string,
  overrides: Partial<EntityFormFieldManifest> = {}
): EntityFormFieldManifest {
  return {
    propertyName: 'X',
    clrTypeName: 'String',
    component,
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

function harness(variant: EntityFormManifest, value: unknown) {
  const onChange = vi.fn();
  const utils = render(
    <EntityRendererProvider components={STANDARD_FORM_COMPONENTS}>
      <EntityForm variant={variant} values={{ X: value }} onChange={onChange} />
    </EntityRendererProvider>
  );
  return { ...utils, onChange };
}

describe('STANDARD_FORM_COMPONENTS — defensive value-type branches', () => {
  it('text — falls back to empty string when value is not a string', () => {
    const { container } = harness(singleFieldVariant(field('text')), 42);
    expect((container.querySelector('input[type="text"]') as HTMLInputElement).value).toBe('');
  });

  it('textarea — falls back to empty string when value is not a string', () => {
    const { container } = harness(singleFieldVariant(field('textarea')), { not: 'a string' });
    expect((container.querySelector('textarea') as HTMLTextAreaElement).value).toBe('');
  });

  it('integer — empty input when value is not a number, and a parsed integer forwards', () => {
    const { container, onChange } = harness(singleFieldVariant(field('integer')), 'not-a-number');
    const input = container.querySelector('input[type="number"]') as HTMLInputElement;
    // typeof value !== 'number' → the false arm renders ''.
    expect(input.value).toBe('');
    fireEvent.change(input, { target: { value: '7' } });
    expect(onChange).toHaveBeenLastCalledWith({ X: 7 });
  });

  it('decimal — empty input when value is not a number, and a parsed float forwards', () => {
    const { container, onChange } = harness(singleFieldVariant(field('decimal')), null);
    const input = container.querySelector('input[type="number"]') as HTMLInputElement;
    expect(input.value).toBe('');
    fireEvent.change(input, { target: { value: '2.5' } });
    expect(onChange).toHaveBeenLastCalledWith({ X: 2.5 });
  });

  it('boolean — unchecked when value is anything other than the literal true', () => {
    const { container } = harness(singleFieldVariant(field('boolean')), 'true');
    // value === true is the only truthy gate; the string 'true' must NOT check it.
    expect((container.querySelector('input[type="checkbox"]') as HTMLInputElement).checked).toBe(
      false
    );
  });

  it.each([
    { component: 'date', seed: '2026-01-01', next: '2026-04-30' },
    { component: 'time', seed: '01:00', next: '12:30' },
    { component: 'datetime', seed: '2026-01-01T01:00', next: '2026-04-30T12:30' },
  ])(
    '$component — empty value when not a string, and a non-empty change forwards the raw value',
    ({ component, seed, next }) => {
      // First render with a non-string value to exercise the `typeof === 'string'` false arm.
      const empty = harness(singleFieldVariant(field(component)), 99);
      expect((empty.container.querySelector('input') as HTMLInputElement).value).toBe('');
      empty.unmount();

      // Then a string-seeded field drives the non-empty `=== '' ? null : value` false arm.
      const { container, onChange } = harness(singleFieldVariant(field(component)), seed);
      const input = container.querySelector('input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: next } });
      expect(onChange).toHaveBeenLastCalledWith({ X: next });
    }
  );

  it('select — renders option labelKey when present, else the stringified value', () => {
    const variant = singleFieldVariant(
      field('select', {
        config: {
          options: [
            { value: 'A', labelKey: 'Label.A' },
            { value: 2, labelKey: null },
          ],
        },
      })
    );
    const { container } = harness(variant, null);
    const labels = Array.from(container.querySelectorAll('option')).map((o) => o.textContent);
    expect(labels).toContain('Label.A');
    expect(labels).toContain('2');
  });

  it('select — boolean value coerced to its string form for the controlled <select>', () => {
    const variant = singleFieldVariant(
      field('select', { config: { options: [{ value: true, labelKey: null }] } })
    );
    const { container } = harness(variant, true);
    expect((container.querySelector('select') as HTMLSelectElement).value).toBe('true');
  });

  it('select — misconfigured when config is non-null but options is not an array', () => {
    const variant = singleFieldVariant(field('select', { config: { options: 'nope' } }));
    const { container } = harness(variant, null);
    expect(container.querySelector('[data-granit-select-misconfigured]')).not.toBeNull();
  });

  it('select — misconfigured when an option entry is not an object', () => {
    const variant = singleFieldVariant(field('select', { config: { options: ['x', 'y'] } }));
    const { container } = harness(variant, null);
    expect(container.querySelector('[data-granit-select-misconfigured]')).not.toBeNull();
  });

  it('select — misconfigured when an option value is an unsupported type', () => {
    const variant = singleFieldVariant(
      field('select', { config: { options: [{ value: { nested: true }, labelKey: null }] } })
    );
    const { container } = harness(variant, null);
    expect(container.querySelector('[data-granit-select-misconfigured]')).not.toBeNull();
  });

  it('select — tolerates a null option value (allowed) and a non-string labelKey (→ null)', () => {
    const variant = singleFieldVariant(
      field('select', { config: { options: [{ value: null, labelKey: 123 }] } })
    );
    const { container } = harness(variant, null);
    // Not misconfigured: null value is permitted; the numeric labelKey is dropped so
    // the option falls back to String(value) === 'null'.
    expect(container.querySelector('[data-granit-select-misconfigured]')).toBeNull();
    const labels = Array.from(container.querySelectorAll('option')).map((o) => o.textContent);
    expect(labels).toContain('null');
  });
});
