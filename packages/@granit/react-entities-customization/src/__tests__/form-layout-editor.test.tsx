import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { FormLayoutEditor } from '../components/form-layout-editor.js';

import type { SchemaField } from '../layout/apply-deltas.js';
import type { LayoutDelta } from '@granit/entities-customization';

const fields: readonly SchemaField[] = [
  { name: 'name', label: 'Name', defaultGroup: 'general' },
  { name: 'amount', label: 'Amount', defaultGroup: 'pricing' },
  { name: 'currency', label: 'Currency', defaultGroup: 'pricing' },
];

interface HarnessProps {
  readonly onChange: (next: readonly LayoutDelta[]) => void;
  readonly initial?: readonly LayoutDelta[];
  readonly readOnly?: boolean;
}

function Harness({ onChange, initial = [], readOnly }: HarnessProps) {
  const [deltas, setDeltas] = useState<readonly LayoutDelta[]>(initial);
  return (
    <FormLayoutEditor
      fields={fields}
      deltas={deltas}
      onChange={(next) => {
        setDeltas(next);
        onChange(next);
      }}
      availableGroups={[
        { key: 'general', label: 'General' },
        { key: 'pricing', label: 'Pricing' },
      ]}
      readOnly={readOnly}
    />
  );
}

describe('FormLayoutEditor', () => {
  it('renders one row per field with field-name markers', () => {
    render(<Harness onChange={() => {}} />);
    expect(document.querySelectorAll('[data-granit-form-layout-editor-row]').length).toBe(3);
    expect(document.querySelector('[data-field-name="amount"]')).not.toBeNull();
  });

  it('disables Move up on the first row and Move down on the last', () => {
    render(<Harness onChange={() => {}} />);
    const rows = document.querySelectorAll<HTMLElement>('[data-granit-form-layout-editor-row]');
    const firstUp = rows[0]?.querySelector<HTMLButtonElement>(
      '[data-granit-form-layout-editor-move-up]'
    );
    const lastDown = rows[2]?.querySelector<HTMLButtonElement>(
      '[data-granit-form-layout-editor-move-down]'
    );
    expect(firstUp?.disabled).toBe(true);
    expect(lastDown?.disabled).toBe(true);
  });

  it('moves a field down via Move down and reflects the new order', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    const amountRow = document.querySelector<HTMLElement>('[data-field-name="amount"]')!;
    const down = amountRow.querySelector<HTMLButtonElement>(
      '[data-granit-form-layout-editor-move-down]'
    )!;
    fireEvent.click(down);

    expect(onChange).toHaveBeenCalledWith([
      { kind: 'Reorder', fieldName: 'amount', afterFieldName: 'currency' },
    ]);
    const rows = document.querySelectorAll<HTMLElement>('[data-granit-form-layout-editor-row]');
    expect([...rows].map((r) => r.dataset.fieldName)).toEqual(['name', 'currency', 'amount']);
  });

  it('toggles hidden state via the Hide button', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    const row = document.querySelector<HTMLElement>('[data-field-name="amount"]')!;
    const toggle = row.querySelector<HTMLButtonElement>(
      '[data-granit-form-layout-editor-toggle-hidden]'
    )!;
    fireEvent.click(toggle);

    expect(onChange).toHaveBeenCalledWith([{ kind: 'Hide', fieldName: 'amount' }]);
    expect(row.dataset.hidden).toBe('');
  });

  it('emits Regroup deltas when the group select changes', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    const row = document.querySelector<HTMLElement>('[data-field-name="amount"]')!;
    const select = row.querySelector<HTMLSelectElement>('[data-granit-form-layout-editor-group]')!;
    fireEvent.change(select, { target: { value: 'general' } });

    expect(onChange).toHaveBeenCalledWith([
      { kind: 'Regroup', fieldName: 'amount', groupKey: 'general' },
    ]);
  });

  it('disables every control in readOnly mode', () => {
    render(<Harness onChange={() => {}} readOnly />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.every((b) => (b as HTMLButtonElement).disabled)).toBe(true);
    const select = document.querySelector<HTMLSelectElement>(
      '[data-granit-form-layout-editor-group]'
    );
    expect(select?.disabled).toBe(true);
  });
});
