import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FieldConflictTable } from '../components/field-conflict-table.js';

import type { FieldConflictTableLabels } from '../components/field-conflict-table.js';
import type { FieldConflict } from '@granit/entity-merge';

const labels: FieldConflictTableLabels = {
  survivor: 'Survivor',
  loser: 'Loser',
  empty: 'No conflicts',
  loading: 'Loading…',
  error: 'Preview failed',
  valueEmpty: '(empty)',
};

const conflicts: readonly FieldConflict[] = [
  { fieldPath: 'Name', survivorValue: 'A', loserValue: 'B', default: 'Survivor' },
  { fieldPath: 'Tax', survivorValue: null, loserValue: 'X', default: 'Loser' },
];

const noop = () => {};

describe('FieldConflictTable', () => {
  it('renders the loading state', () => {
    render(
      <FieldConflictTable
        conflicts={[]}
        choices={{}}
        onChoiceChange={noop}
        labels={labels}
        isLoading
      />
    );
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('renders the error state as an alert', () => {
    render(
      <FieldConflictTable
        conflicts={[]}
        choices={{}}
        onChoiceChange={noop}
        labels={labels}
        isError
      />
    );
    expect(screen.getByRole('alert').textContent).toBe('Preview failed');
  });

  it('renders the empty state', () => {
    render(
      <FieldConflictTable conflicts={[]} choices={{}} onChoiceChange={noop} labels={labels} />
    );
    expect(screen.getByText('No conflicts')).toBeInTheDocument();
  });

  it('renders one radio group per conflict with the default winner pre-checked', () => {
    render(
      <FieldConflictTable
        conflicts={conflicts}
        choices={{}}
        onChoiceChange={noop}
        labels={labels}
        translateFieldPath={(fp) => (fp === 'Tax' ? 'Tax status' : fp)}
      />
    );
    expect(screen.getAllByRole('radiogroup')).toHaveLength(2);

    const nameRadios = within(screen.getByRole('radiogroup', { name: 'Name' })).getAllByRole(
      'radio'
    ) as HTMLInputElement[];
    expect(nameRadios[0]!.checked).toBe(true);
    expect(nameRadios[1]!.checked).toBe(false);

    const taxRadios = within(screen.getByRole('radiogroup', { name: 'Tax status' })).getAllByRole(
      'radio'
    ) as HTMLInputElement[];
    expect(taxRadios[0]!.checked).toBe(false);
    expect(taxRadios[1]!.checked).toBe(true);
  });

  it('shows the empty-value placeholder for null sides', () => {
    render(
      <FieldConflictTable
        conflicts={conflicts}
        choices={{}}
        onChoiceChange={noop}
        labels={labels}
      />
    );
    // Tax survivorValue is null → placeholder used in the Survivor radio aria-label
    expect(screen.getByLabelText('Survivor: (empty)')).toBeInTheDocument();
  });

  it('fires onChoiceChange with the picked side', () => {
    const onChoiceChange = vi.fn();
    render(
      <FieldConflictTable
        conflicts={conflicts}
        choices={{}}
        onChoiceChange={onChoiceChange}
        labels={labels}
      />
    );
    const nameLoser = within(screen.getByRole('radiogroup', { name: 'Name' })).getAllByRole(
      'radio'
    )[1]!;
    fireEvent.click(nameLoser);
    expect(onChoiceChange).toHaveBeenCalledWith('Name', 'Loser');
  });

  it('disables every radio when disabled', () => {
    render(
      <FieldConflictTable
        conflicts={conflicts}
        choices={{}}
        onChoiceChange={noop}
        labels={labels}
        disabled
      />
    );
    for (const radio of screen.getAllByRole('radio') as HTMLInputElement[]) {
      expect(radio.disabled).toBe(true);
    }
  });
});
