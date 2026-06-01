import {
  applyDeltas,
  moveFieldDown,
  moveFieldUp,
  setFieldGroup,
  toggleFieldHidden,
  type SchemaField,
} from '../layout/apply-deltas';

import type { LayoutDelta } from '@granit/entities-customization';
import type { ReactNode } from 'react';

export interface LayoutEditorLabels {
  readonly moveUp?: string;
  readonly moveDown?: string;
  readonly hide?: string;
  readonly show?: string;
  readonly groupSelectAriaLabel?: (fieldName: string) => string;
  readonly noGroup?: string;
}

const DEFAULT_LABELS: Required<LayoutEditorLabels> = {
  moveUp: 'Move up',
  moveDown: 'Move down',
  hide: 'Hide',
  show: 'Show',
  groupSelectAriaLabel: (fieldName) => `Group for ${fieldName}`,
  noGroup: '— no group —',
};

export interface FormLayoutEditorProps {
  readonly fields: readonly SchemaField[];
  readonly deltas: readonly LayoutDelta[];
  readonly onChange: (next: readonly LayoutDelta[]) => void;
  /** Available group keys to assign — shown as a `<select>` per row. */
  readonly availableGroups?: readonly { readonly key: string; readonly label?: string }[];
  readonly labels?: LayoutEditorLabels;
  readonly className?: string;
  /**
   * Read-only mode: pass `onChange` undefined-equivalent by passing
   * `readOnly`. Buttons render disabled and the select is disabled.
   * Apps gate edit access by the `EntitiesCustomization.Forms.Manage`
   * permission via this flag.
   */
  readonly readOnly?: boolean;
}

/**
 * Headless form-layout editor. Renders one row per field with three
 * controls — move up, move down, hide/show — plus an optional group
 * `<select>`. No design-system chrome; apps style via the
 * `data-granit-form-layout-editor*` markers.
 *
 * The editor is fully controlled: the parent owns `deltas` state and
 * decides when to PUT them via `usePutFormCustomization()`. This keeps
 * the editor unit-testable without React Query and lets apps add
 * undo/redo on top of the delta list freely.
 */
export function FormLayoutEditor({
  fields,
  deltas,
  onChange,
  availableGroups,
  labels,
  className,
  readOnly,
}: FormLayoutEditorProps): ReactNode {
  const merged = { ...DEFAULT_LABELS, ...labels };
  const effective = applyDeltas(fields, deltas);
  const disabled = readOnly === true;

  return (
    <ol
      data-granit-form-layout-editor=""
      data-readonly={disabled ? '' : undefined}
      className={className}
    >
      {effective.map((field, idx) => (
        <li
          key={field.name}
          data-granit-form-layout-editor-row=""
          data-field-name={field.name}
          data-hidden={field.hidden ? '' : undefined}
          data-group={field.group ?? undefined}
        >
          <span data-granit-form-layout-editor-label="">{field.label ?? field.name}</span>
          <button
            type="button"
            data-granit-form-layout-editor-move-up=""
            aria-label={merged.moveUp}
            disabled={disabled || idx === 0}
            onClick={() => onChange(moveFieldUp(fields, deltas, field.name))}
          >
            {merged.moveUp}
          </button>
          <button
            type="button"
            data-granit-form-layout-editor-move-down=""
            aria-label={merged.moveDown}
            disabled={disabled || idx === effective.length - 1}
            onClick={() => onChange(moveFieldDown(fields, deltas, field.name))}
          >
            {merged.moveDown}
          </button>
          <button
            type="button"
            data-granit-form-layout-editor-toggle-hidden=""
            aria-pressed={field.hidden}
            disabled={disabled}
            onClick={() => onChange(toggleFieldHidden(fields, deltas, field.name))}
          >
            {field.hidden ? merged.show : merged.hide}
          </button>
          {availableGroups === undefined ? null : (
            <select
              data-granit-form-layout-editor-group=""
              aria-label={merged.groupSelectAriaLabel(field.name)}
              value={field.group ?? ''}
              disabled={disabled}
              onChange={(event) => onChange(setFieldGroup(deltas, field.name, event.target.value))}
            >
              <option value="">{merged.noGroup}</option>
              {availableGroups.map((g) => (
                <option key={g.key} value={g.key}>
                  {g.label ?? g.key}
                </option>
              ))}
            </select>
          )}
        </li>
      ))}
    </ol>
  );
}
