import { mockEntityManifest } from '@granit/react-entities/testing';
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TimezoneFormComponent } from './timezone-form-component';

import type { EntityFormFieldManifest } from '@granit/entities';

interface LeafMockProps {
  readonly id?: string;
  readonly name?: string;
  readonly value: string | null;
  readonly onChange: (next: string | null) => void;
  readonly disabled?: boolean;
  readonly clearable?: boolean;
}

vi.mock('@granit/react-ui-kit', () => ({
  TimezonePicker: ({ id, name, value, onChange, disabled, clearable }: LeafMockProps) => (
    <div
      data-testid="leaf"
      data-id={id}
      data-name={name}
      data-value={value ?? 'NULL'}
      data-disabled={String(Boolean(disabled))}
      data-clearable={String(Boolean(clearable))}
    >
      <button type="button" data-testid="emit-value" onClick={() => onChange('Europe/Brussels')} />
      <button type="button" data-testid="emit-null" onClick={() => onChange(null)} />
    </div>
  ),
}));

const baseField = mockEntityManifest.forms![0]!.sections[0]!.fields[0]!;

function field(overrides: Partial<EntityFormFieldManifest> = {}): EntityFormFieldManifest {
  return { ...baseField, propertyName: 'Timezone', component: 'timezone', ...overrides };
}

describe('TimezoneFormComponent', () => {
  it('forwards a string value, field id/name and the clearable flag', () => {
    const { getByTestId } = render(
      <TimezoneFormComponent
        field={field()}
        value="Europe/Brussels"
        onChange={vi.fn()}
        readOnly={false}
      />
    );
    const leaf = getByTestId('leaf');
    expect(leaf.getAttribute('data-value')).toBe('Europe/Brussels');
    expect(leaf.getAttribute('data-id')).toBe('field-Timezone');
    expect(leaf.getAttribute('data-name')).toBe('Timezone');
    expect(leaf.getAttribute('data-clearable')).toBe('true');
    expect(leaf.getAttribute('data-disabled')).toBe('false');
  });

  it('passes null for a non-string value', () => {
    const { getByTestId } = render(
      <TimezoneFormComponent field={field()} value={0} onChange={vi.fn()} readOnly={false} />
    );
    expect(getByTestId('leaf').getAttribute('data-value')).toBe('NULL');
  });

  it('forwards an emitted value', () => {
    const onChange = vi.fn();
    const { getByTestId } = render(
      <TimezoneFormComponent field={field()} value={null} onChange={onChange} readOnly={false} />
    );
    fireEvent.click(getByTestId('emit-value'));
    expect(onChange).toHaveBeenCalledWith('Europe/Brussels');
  });

  it('coerces an emitted null through the nullish guard', () => {
    const onChange = vi.fn();
    const { getByTestId } = render(
      <TimezoneFormComponent
        field={field()}
        value="Europe/Brussels"
        onChange={onChange}
        readOnly={false}
      />
    );
    fireEvent.click(getByTestId('emit-null'));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('disables the picker when readOnly is set', () => {
    const { getByTestId } = render(
      <TimezoneFormComponent field={field()} value={null} onChange={vi.fn()} readOnly={true} />
    );
    expect(getByTestId('leaf').getAttribute('data-disabled')).toBe('true');
  });
});
