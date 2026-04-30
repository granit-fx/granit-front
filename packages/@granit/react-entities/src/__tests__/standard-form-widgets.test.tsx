import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { EntityForm } from '../components/entity-form.js';
import { EntityRendererProvider } from '../provider/index.js';
import { STANDARD_FORM_WIDGETS } from '../widgets/index.js';

import type { EntityFormFieldManifest, EntityFormManifest } from '@granit/entities';

function singleFieldVariant(field: EntityFormFieldManifest): EntityFormManifest {
  return {
    name: 'default',
    customizable: false,
    sections: [
      {
        key: 'main',
        labelKey: null,
        order: 0,
        collapsedByDefault: false,
        fields: [field],
      },
    ],
  };
}

function field(
  widget: string,
  overrides: Partial<EntityFormFieldManifest> = {}
): EntityFormFieldManifest {
  return {
    propertyName: 'X',
    clrTypeName: 'String',
    widget,
    config: null,
    labelKey: null,
    helpKey: null,
    order: 0,
    readOnly: false,
    visibleIf: null,
    ...overrides,
  };
}

function harness(variant: EntityFormManifest, value: unknown) {
  const onChange = vi.fn();
  const utils = render(
    <EntityRendererProvider widgets={STANDARD_FORM_WIDGETS}>
      <EntityForm variant={variant} values={{ X: value }} onChange={onChange} />
    </EntityRendererProvider>
  );
  return { ...utils, onChange };
}

describe('STANDARD_FORM_WIDGETS', () => {
  it('text — renders a text input and forwards value', () => {
    const { container, onChange } = harness(singleFieldVariant(field('text')), 'hello');
    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    expect(input.value).toBe('hello');
    fireEvent.change(input, { target: { value: 'world' } });
    expect(onChange).toHaveBeenCalledWith({ X: 'world' });
  });

  it('textarea — multi-line input', () => {
    const { container, onChange } = harness(singleFieldVariant(field('textarea')), 'line 1');
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe('line 1');
    fireEvent.change(textarea, { target: { value: 'line 1\nline 2' } });
    expect(onChange).toHaveBeenCalledWith({ X: 'line 1\nline 2' });
  });

  it('integer — parses to int, empty becomes null', () => {
    const { container, onChange } = harness(singleFieldVariant(field('integer')), 42);
    const input = container.querySelector('input[type="number"]') as HTMLInputElement;
    expect(input.value).toBe('42');
    fireEvent.change(input, { target: { value: '7' } });
    expect(onChange).toHaveBeenLastCalledWith({ X: 7 });
    fireEvent.change(input, { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith({ X: null });
  });

  it('decimal — parses to float, empty becomes null', () => {
    const { container, onChange } = harness(singleFieldVariant(field('decimal')), 3.14);
    const input = container.querySelector('input[type="number"]') as HTMLInputElement;
    expect(input.getAttribute('step')).toBe('any');
    fireEvent.change(input, { target: { value: '2.5' } });
    expect(onChange).toHaveBeenLastCalledWith({ X: 2.5 });
    fireEvent.change(input, { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith({ X: null });
  });

  it('boolean — renders a checkbox driven by `value === true`', () => {
    const { container, onChange } = harness(singleFieldVariant(field('boolean')), false);
    const input = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(input.checked).toBe(false);
    fireEvent.click(input);
    expect(onChange).toHaveBeenCalledWith({ X: true });
  });

  it('date / time / datetime — corresponding input types, empty becomes null', () => {
    const cases: ReadonlyArray<{
      readonly widget: string;
      readonly inputType: string;
      readonly seed: string;
    }> = [
      { widget: 'date', inputType: 'date', seed: '2026-04-30' },
      { widget: 'time', inputType: 'time', seed: '12:30' },
      { widget: 'datetime', inputType: 'datetime-local', seed: '2026-04-30T12:30' },
    ];
    for (const { widget, inputType, seed } of cases) {
      const { container, onChange, unmount } = harness(singleFieldVariant(field(widget)), seed);
      const input = container.querySelector(`input[type="${inputType}"]`) as HTMLInputElement;
      expect(input).not.toBeNull();
      fireEvent.change(input, { target: { value: '' } });
      expect(onChange).toHaveBeenLastCalledWith({ X: null });
      unmount();
    }
  });

  it('select — renders options from config and emits the selected value with the original type', () => {
    const variant = singleFieldVariant(
      field('select', {
        config: {
          options: [
            { value: 'A', labelKey: null },
            { value: 'B', labelKey: 'Option.B.Label' },
          ],
        },
      })
    );
    const { container, onChange } = harness(variant, 'A');
    const select = container.querySelector('select') as HTMLSelectElement;
    expect(select.value).toBe('A');
    fireEvent.change(select, { target: { value: 'B' } });
    expect(onChange).toHaveBeenCalledWith({ X: 'B' });
  });

  it('select — preserves the original value type (number / boolean) on selection', () => {
    const variant = singleFieldVariant(
      field('select', {
        config: {
          options: [
            { value: 1, labelKey: null },
            { value: 2, labelKey: null },
          ],
        },
      })
    );
    const { container, onChange } = harness(variant, 1);
    const select = container.querySelector('select') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: '2' } });
    expect(onChange).toHaveBeenCalledWith({ X: 2 });
  });

  it('select — emits null when the empty option is picked', () => {
    const variant = singleFieldVariant(
      field('select', {
        config: { options: [{ value: 'A', labelKey: null }] },
      })
    );
    const { container, onChange } = harness(variant, 'A');
    const select = container.querySelector('select') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith({ X: null });
  });

  it('select — surfaces a misconfiguration marker when config.options is missing', () => {
    const { container } = harness(singleFieldVariant(field('select')), null);
    expect(container.querySelector('[data-granit-select-misconfigured]')).not.toBeNull();
  });

  it('readOnly — text/textarea expose readOnly, boolean/select expose disabled', () => {
    function renderRO(widget: string) {
      const { container, unmount } = render(
        <EntityRendererProvider widgets={STANDARD_FORM_WIDGETS}>
          <EntityForm
            variant={singleFieldVariant(
              field(widget, {
                config: widget === 'select' ? { options: [{ value: 'A', labelKey: null }] } : null,
              })
            )}
            values={{ X: widget === 'select' ? 'A' : '' }}
            onChange={() => undefined}
            readOnly
          />
        </EntityRendererProvider>
      );
      return { container, unmount };
    }

    const text = renderRO('text');
    expect((text.container.querySelector('input') as HTMLInputElement).readOnly).toBe(true);
    text.unmount();
    const textarea = renderRO('textarea');
    expect((textarea.container.querySelector('textarea') as HTMLTextAreaElement).readOnly).toBe(
      true
    );
    textarea.unmount();
    const checkbox = renderRO('boolean');
    expect(
      (checkbox.container.querySelector('input[type="checkbox"]') as HTMLInputElement).disabled
    ).toBe(true);
    checkbox.unmount();
    const select = renderRO('select');
    expect((select.container.querySelector('select') as HTMLSelectElement).disabled).toBe(true);
    select.unmount();
  });

  it('aria-invalid — set when an errorMessage is provided', () => {
    const variant = singleFieldVariant(field('text'));
    const { container } = render(
      <EntityRendererProvider widgets={STANDARD_FORM_WIDGETS}>
        <EntityForm
          variant={variant}
          values={{ X: '' }}
          onChange={() => undefined}
          errors={{ X: 'Required' }}
        />
      </EntityRendererProvider>
    );
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });
});
