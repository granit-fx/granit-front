import { mockEntityManifest } from '@granit/react-entities/testing';
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { EmailFormComponent } from './email-form-component';

import type { EntityFormFieldManifest } from '@granit/entities';

const baseField = mockEntityManifest.forms![0]!.sections[0]!.fields[0]!;

function field(overrides: Partial<EntityFormFieldManifest> = {}): EntityFormFieldManifest {
  return { ...baseField, propertyName: 'Email', component: 'email', ...overrides };
}

function getInput(container: HTMLElement): HTMLInputElement {
  const el = container.querySelector('input');
  if (!el) throw new Error('input not found');
  return el;
}

describe('EmailFormComponent', () => {
  it('binds a string value and wires the field id/name', () => {
    const { container } = render(
      <EmailFormComponent field={field()} value="a@b.com" onChange={vi.fn()} readOnly={false} />
    );
    const input = getInput(container);
    expect(input.value).toBe('a@b.com');
    expect(input.id).toBe('field-Email');
    expect(input.getAttribute('name')).toBe('Email');
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });

  it('renders an empty string for a non-string value', () => {
    const { container } = render(
      <EmailFormComponent field={field()} value={42} onChange={vi.fn()} readOnly={false} />
    );
    expect(getInput(container).value).toBe('');
  });

  it('marks the input aria-invalid when an error message is present', () => {
    const { container } = render(
      <EmailFormComponent
        field={field()}
        value=""
        onChange={vi.fn()}
        readOnly={false}
        errorMessage="Bad email"
      />
    );
    expect(getInput(container).getAttribute('aria-invalid')).toBe('true');
  });

  it('emits the typed value on change', () => {
    const onChange = vi.fn();
    const { container } = render(
      <EmailFormComponent field={field()} value="" onChange={onChange} readOnly={false} />
    );
    fireEvent.change(getInput(container), { target: { value: 'x@y.com' } });
    expect(onChange).toHaveBeenCalledWith('x@y.com');
  });

  it('emits null when cleared to an empty string', () => {
    const onChange = vi.fn();
    const { container } = render(
      <EmailFormComponent field={field()} value="x@y.com" onChange={onChange} readOnly={false} />
    );
    fireEvent.change(getInput(container), { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('renders read-only when readOnly is set', () => {
    const { container } = render(
      <EmailFormComponent field={field()} value="a@b.com" onChange={vi.fn()} readOnly={true} />
    );
    expect(getInput(container).readOnly).toBe(true);
  });
});
