import { mockEntityManifest } from '@granit/react-entities/testing';
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { UrlFormComponent } from './url-form-component';

import type { EntityFormFieldManifest } from '@granit/entities';

interface LeafMockProps {
  readonly id?: string;
  readonly name?: string;
  readonly value: string | null;
  readonly onChange: (next: string | null) => void;
  readonly disabled?: boolean;
}

vi.mock('@granit/react-ui-kit', () => ({
  UrlInput: ({ id, name, value, onChange, disabled }: LeafMockProps) => (
    <div
      data-testid="leaf"
      data-id={id}
      data-name={name}
      data-value={value ?? 'NULL'}
      data-disabled={String(Boolean(disabled))}
    >
      <button
        type="button"
        data-testid="emit-value"
        onClick={() => onChange('https://example.com')}
      />
      <button type="button" data-testid="emit-null" onClick={() => onChange(null)} />
    </div>
  ),
}));

const baseField = mockEntityManifest.forms![0]!.sections[0]!.fields[0]!;

function field(overrides: Partial<EntityFormFieldManifest> = {}): EntityFormFieldManifest {
  return { ...baseField, propertyName: 'Website', component: 'url', ...overrides };
}

describe('UrlFormComponent', () => {
  it('forwards a string value and the field id/name', () => {
    const { getByTestId } = render(
      <UrlFormComponent
        field={field()}
        value="https://example.com"
        onChange={vi.fn()}
        readOnly={false}
      />
    );
    const leaf = getByTestId('leaf');
    expect(leaf.getAttribute('data-value')).toBe('https://example.com');
    expect(leaf.getAttribute('data-id')).toBe('field-Website');
    expect(leaf.getAttribute('data-name')).toBe('Website');
    expect(leaf.getAttribute('data-disabled')).toBe('false');
  });

  it('passes null for a non-string value', () => {
    const { getByTestId } = render(
      <UrlFormComponent field={field()} value={{}} onChange={vi.fn()} readOnly={false} />
    );
    expect(getByTestId('leaf').getAttribute('data-value')).toBe('NULL');
  });

  it('forwards an emitted value', () => {
    const onChange = vi.fn();
    const { getByTestId } = render(
      <UrlFormComponent field={field()} value={null} onChange={onChange} readOnly={false} />
    );
    fireEvent.click(getByTestId('emit-value'));
    expect(onChange).toHaveBeenCalledWith('https://example.com');
  });

  it('coerces an emitted null through the nullish guard', () => {
    const onChange = vi.fn();
    const { getByTestId } = render(
      <UrlFormComponent
        field={field()}
        value="https://example.com"
        onChange={onChange}
        readOnly={false}
      />
    );
    fireEvent.click(getByTestId('emit-null'));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('disables the input when readOnly is set', () => {
    const { getByTestId } = render(
      <UrlFormComponent field={field()} value={null} onChange={vi.fn()} readOnly={true} />
    );
    expect(getByTestId('leaf').getAttribute('data-disabled')).toBe('true');
  });
});
