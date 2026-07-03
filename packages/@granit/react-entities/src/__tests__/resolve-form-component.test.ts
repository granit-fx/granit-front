import { describe, expect, it } from 'vitest';

import {
  resolveFormComponentId,
  VALUE_KIND_FORM_COMPONENTS,
} from '../field-components/resolve-form-component';

import type { EntityFormComponent } from '../providers/component-catalog';
import type { EntityFormFieldManifest } from '@granit/entities';

const noop: EntityFormComponent = () => null;

// A catalog that registers the richer inputs the valueKind map targets.
const RICH_CATALOG: Readonly<Record<string, EntityFormComponent>> = {
  text: noop,
  decimal: noop,
  money: noop,
  url: noop,
  email: noop,
  phone: noop,
  lookup: noop,
};

// The minimal standard catalog — none of the richer inputs are registered.
const STANDARD_CATALOG: Readonly<Record<string, EntityFormComponent>> = {
  text: noop,
  decimal: noop,
  lookup: noop,
};

function makeField(overrides: Partial<EntityFormFieldManifest> = {}): EntityFormFieldManifest {
  return {
    propertyName: 'Field',
    clrTypeName: 'String',
    component: 'text',
    config: null,
    labelKey: null,
    helpKey: null,
    order: 0,
    readOnly: false,
    visibleIf: null,
    lookup: null,
    provenance: null,
    ...overrides,
  };
}

describe('resolveFormComponentId', () => {
  it('upgrades a CLR-default component from valueKind when the input is registered', () => {
    const field = makeField({ component: 'decimal', valueKind: 'Currency' });
    expect(resolveFormComponentId(field, RICH_CATALOG)).toBe('money');
  });

  it('upgrades text → url / email / phone', () => {
    expect(resolveFormComponentId(makeField({ valueKind: 'Url' }), RICH_CATALOG)).toBe('url');
    expect(resolveFormComponentId(makeField({ valueKind: 'Email' }), RICH_CATALOG)).toBe('email');
    expect(resolveFormComponentId(makeField({ valueKind: 'Phone' }), RICH_CATALOG)).toBe('phone');
  });

  it('keeps an explicit (non-CLR-default) component even when valueKind is set', () => {
    // component=money is an explicit choice, not a CLR default → no override.
    const field = makeField({ component: 'money', valueKind: 'Currency' });
    expect(resolveFormComponentId(field, RICH_CATALOG)).toBe('money');
    // textarea is an explicit opt-in, never a CLR default.
    const notes = makeField({ component: 'textarea', valueKind: 'Url' });
    expect(resolveFormComponentId(notes, RICH_CATALOG)).toBe('textarea');
  });

  it('falls back to the base component when the mapped input is not registered', () => {
    const field = makeField({ component: 'decimal', valueKind: 'Currency' });
    expect(resolveFormComponentId(field, STANDARD_CATALOG)).toBe('decimal');
  });

  it('keeps the base component for a valueKind with no form-component mapping', () => {
    // Bytes edits as a raw number — no entry in the input map.
    const field = makeField({ component: 'decimal', valueKind: 'Bytes' });
    expect(resolveFormComponentId(field, RICH_CATALOG)).toBe('decimal');
    expect(VALUE_KIND_FORM_COMPONENTS['Bytes']).toBeUndefined();
  });

  it('keeps the base component when no valueKind is present', () => {
    expect(resolveFormComponentId(makeField({ component: 'text' }), RICH_CATALOG)).toBe('text');
    expect(resolveFormComponentId(makeField({ valueKind: null }), RICH_CATALOG)).toBe('text');
  });

  it('lets a declared lookup win over everything', () => {
    const field = makeField({
      component: 'text',
      valueKind: 'Url',
      lookup: { source: 'parties' } as unknown as EntityFormFieldManifest['lookup'],
    });
    expect(resolveFormComponentId(field, RICH_CATALOG)).toBe('lookup');
  });
});
