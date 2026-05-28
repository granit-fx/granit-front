import { resolveWinner } from '@granit/entity-merge';

import type { FieldConflict, MergeFieldChoices, WinnerSide } from '@granit/entity-merge';

/** Localized labels for {@link FieldConflictTable}. */
export interface FieldConflictTableLabels {
  /** Column / radio label for the survivor side. */
  readonly survivor: string;
  /** Column / radio label for the loser side. */
  readonly loser: string;
  /** Shown when there are no conflicts. */
  readonly empty: string;
  /** Shown while the preview is loading. */
  readonly loading: string;
  /** Shown when the preview request failed. */
  readonly error: string;
  /** Placeholder for a `null` field value. */
  readonly valueEmpty: string;
}

export interface FieldConflictTableProps {
  readonly conflicts: readonly FieldConflict[];
  readonly choices: MergeFieldChoices;
  readonly onChoiceChange: (fieldPath: string, winner: WinnerSide) => void;
  readonly labels: FieldConflictTableLabels;
  /** Map a raw field path to a human label. Defaults to the path itself. */
  readonly translateFieldPath?: (fieldPath: string) => string;
  readonly isLoading?: boolean;
  readonly isError?: boolean;
  readonly disabled?: boolean;
}

/**
 * Headless, label-driven table of per-field merge conflicts. One radio group
 * per conflict (Survivor / Loser), pre-selecting the recommended default unless
 * overridden in `choices`. Carries minimal Tailwind utility classes; wrap and
 * theme it freely.
 */
export function FieldConflictTable({
  conflicts,
  choices,
  onChoiceChange,
  labels,
  translateFieldPath = (fieldPath) => fieldPath,
  isLoading = false,
  isError = false,
  disabled = false,
}: Readonly<FieldConflictTableProps>) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{labels.loading}</p>;
  }
  if (isError) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {labels.error}
      </p>
    );
  }
  if (conflicts.length === 0) {
    return <p className="text-sm text-muted-foreground">{labels.empty}</p>;
  }
  return (
    <ul data-slot="field-conflict-table" className="space-y-2">
      {conflicts.map((conflict) => (
        <ConflictRow
          key={conflict.fieldPath}
          conflict={conflict}
          selected={resolveWinner(conflict, choices)}
          onChange={onChoiceChange}
          survivorLabel={labels.survivor}
          loserLabel={labels.loser}
          emptyLabel={labels.valueEmpty}
          fieldLabel={translateFieldPath(conflict.fieldPath)}
          disabled={disabled}
        />
      ))}
    </ul>
  );
}

interface ConflictRowProps {
  readonly conflict: FieldConflict;
  readonly selected: WinnerSide;
  readonly onChange: (fieldPath: string, winner: WinnerSide) => void;
  readonly survivorLabel: string;
  readonly loserLabel: string;
  readonly emptyLabel: string;
  readonly fieldLabel: string;
  readonly disabled: boolean;
}

function ConflictRow({
  conflict,
  selected,
  onChange,
  survivorLabel,
  loserLabel,
  emptyLabel,
  fieldLabel,
  disabled,
}: Readonly<ConflictRowProps>) {
  const groupName = `merge-choice-${conflict.fieldPath}`;
  return (
    <li
      data-slot="conflict-row"
      data-field-path={conflict.fieldPath}
      className="rounded-md border p-3"
    >
      <div className="mb-2 text-sm font-medium">{fieldLabel}</div>
      <div role="radiogroup" aria-label={fieldLabel} className="grid gap-2 md:grid-cols-2">
        <ChoiceRadio
          name={groupName}
          value="Survivor"
          checked={selected === 'Survivor'}
          onChange={() => onChange(conflict.fieldPath, 'Survivor')}
          label={survivorLabel}
          displayValue={conflict.survivorValue ?? emptyLabel}
          disabled={disabled}
        />
        <ChoiceRadio
          name={groupName}
          value="Loser"
          checked={selected === 'Loser'}
          onChange={() => onChange(conflict.fieldPath, 'Loser')}
          label={loserLabel}
          displayValue={conflict.loserValue ?? emptyLabel}
          disabled={disabled}
        />
      </div>
    </li>
  );
}

interface ChoiceRadioProps {
  readonly name: string;
  readonly value: WinnerSide;
  readonly checked: boolean;
  readonly onChange: () => void;
  readonly label: string;
  readonly displayValue: string;
  readonly disabled: boolean;
}

function ChoiceRadio({
  name,
  value,
  checked,
  onChange,
  label,
  displayValue,
  disabled,
}: Readonly<ChoiceRadioProps>) {
  return (
    <label
      data-slot="choice-radio"
      data-checked={checked || undefined}
      aria-label={`${label}: ${displayValue}`}
      className="flex cursor-pointer items-start gap-2 rounded-md border bg-background p-2 text-sm has-checked:border-primary"
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="mt-1"
      />
      <span className="flex flex-col">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="break-all">{displayValue}</span>
      </span>
    </label>
  );
}
