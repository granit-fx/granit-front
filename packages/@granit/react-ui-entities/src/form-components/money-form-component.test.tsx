import { mockEntityManifest } from '@granit/react-entities/testing';
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MoneyFormComponent } from './money-form-component';

import type { EntityFormFieldManifest } from '@granit/entities';

const baseField = mockEntityManifest.forms![0]!.sections[0]!.fields[0]!;

function field(overrides: Partial<EntityFormFieldManifest> = {}): EntityFormFieldManifest {
  return {
    ...baseField,
    propertyName: 'Amount',
    component: 'currency',
    config: null,
    ...overrides,
  };
}

function getInput(container: HTMLElement): HTMLInputElement {
  const el = container.querySelector('input');
  if (!el) throw new Error('input not found');
  return el;
}

describe('MoneyFormComponent', () => {
  it('renders minor units as a two-decimal major-unit string and shows the currencyCode hint', () => {
    const { container } = render(
      <MoneyFormComponent
        field={field({ config: { currencyCode: 'EUR' } })}
        value={1234}
        onChange={vi.fn()}
        readOnly={false}
      />
    );
    expect(getInput(container).value).toBe('12.34');
    const hint = container.querySelector('[aria-label="currency"]');
    expect(hint?.textContent).toBe('EUR');
    expect(getInput(container).getAttribute('aria-invalid')).toBeNull();
  });

  it('collapses a non-number value to an empty display and omits the hint when config is null', () => {
    const { container } = render(
      <MoneyFormComponent field={field()} value={null} onChange={vi.fn()} readOnly={false} />
    );
    expect(getInput(container).value).toBe('');
    expect(container.querySelector('[aria-label="currency"]')).toBeNull();
  });

  it('falls back to currencyProperty when currencyCode is absent', () => {
    const { container } = render(
      <MoneyFormComponent
        field={field({ config: { currencyProperty: 'PriceCurrency' } })}
        value={0}
        onChange={vi.fn()}
        readOnly={false}
      />
    );
    expect(container.querySelector('[aria-label="currency"]')?.textContent).toBe('PriceCurrency');
    expect(getInput(container).value).toBe('0.00');
  });

  it('omits the hint when config carries neither currency key', () => {
    const { container } = render(
      <MoneyFormComponent
        field={field({ config: {} })}
        value={500}
        onChange={vi.fn()}
        readOnly={false}
      />
    );
    expect(container.querySelector('[aria-label="currency"]')).toBeNull();
  });

  it('marks the input aria-invalid when an error message is present', () => {
    const { container } = render(
      <MoneyFormComponent
        field={field()}
        value={100}
        onChange={vi.fn()}
        readOnly={false}
        errorMessage="Required"
      />
    );
    expect(getInput(container).getAttribute('aria-invalid')).toBe('true');
  });

  it('emits null when cleared to an empty string', () => {
    const onChange = vi.fn();
    const { container } = render(
      <MoneyFormComponent field={field()} value={1234} onChange={onChange} readOnly={false} />
    );
    fireEvent.change(getInput(container), { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('rounds a decimal entry to Int64 minor units', () => {
    const onChange = vi.fn();
    const { container } = render(
      <MoneyFormComponent field={field()} value={null} onChange={onChange} readOnly={false} />
    );
    fireEvent.change(getInput(container), { target: { value: '10.5' } });
    expect(onChange).toHaveBeenCalledWith(1050);
  });

  it('renders read-only when readOnly is set', () => {
    const { container } = render(
      <MoneyFormComponent field={field()} value={100} onChange={vi.fn()} readOnly={true} />
    );
    expect(getInput(container).readOnly).toBe(true);
  });
});
