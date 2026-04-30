import type { EntityFormWidget, EntityWidgetCatalog } from '../provider/widget-catalog.js';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Standard widget catalog (ADR-041 minimum set).
//
// Ids match the defaults emitted by Granit.Entities.Abstractions.FieldBuilder
// .ChooseDefaultWidget(): text / integer / decimal / boolean / date / time /
// datetime / select. textarea is an explicit opt-in via .Widget("textarea")
// on the .NET side.
//
// Widgets are intentionally unstyled HTML inputs. Apps that want shadcn /
// Tailwind / Material flavour wrap or replace them via the catalog they
// pass to <EntityRendererProvider widgets={...} />.
// ---------------------------------------------------------------------------

function commonProps(field: { propertyName: string }, errorMessage?: string) {
  return {
    id: `field-${field.propertyName}`,
    name: field.propertyName,
    'aria-invalid': errorMessage ? true : undefined,
  } as const;
}

const TextWidget: EntityFormWidget = ({ field, value, onChange, readOnly, errorMessage }) => (
  <input
    type="text"
    {...commonProps(field, errorMessage)}
    value={typeof value === 'string' ? value : ''}
    readOnly={readOnly}
    onChange={(e) => onChange(e.target.value)}
  />
);

const TextareaWidget: EntityFormWidget = ({ field, value, onChange, readOnly, errorMessage }) => (
  <textarea
    {...commonProps(field, errorMessage)}
    value={typeof value === 'string' ? value : ''}
    readOnly={readOnly}
    onChange={(e) => onChange(e.target.value)}
  />
);

const IntegerWidget: EntityFormWidget = ({ field, value, onChange, readOnly, errorMessage }) => (
  <input
    type="number"
    step={1}
    {...commonProps(field, errorMessage)}
    value={typeof value === 'number' ? String(value) : ''}
    readOnly={readOnly}
    onChange={(e) => {
      const raw = e.target.value;
      if (raw === '') {
        onChange(null);
        return;
      }
      const parsed = Number.parseInt(raw, 10);
      onChange(Number.isNaN(parsed) ? null : parsed);
    }}
  />
);

const DecimalWidget: EntityFormWidget = ({ field, value, onChange, readOnly, errorMessage }) => (
  <input
    type="number"
    step="any"
    {...commonProps(field, errorMessage)}
    value={typeof value === 'number' ? String(value) : ''}
    readOnly={readOnly}
    onChange={(e) => {
      const raw = e.target.value;
      if (raw === '') {
        onChange(null);
        return;
      }
      const parsed = Number.parseFloat(raw);
      onChange(Number.isNaN(parsed) ? null : parsed);
    }}
  />
);

const BooleanWidget: EntityFormWidget = ({ field, value, onChange, readOnly, errorMessage }) => (
  <input
    type="checkbox"
    {...commonProps(field, errorMessage)}
    checked={value === true}
    disabled={readOnly}
    onChange={(e) => onChange(e.target.checked)}
  />
);

const DateWidget: EntityFormWidget = ({ field, value, onChange, readOnly, errorMessage }) => (
  <input
    type="date"
    {...commonProps(field, errorMessage)}
    value={typeof value === 'string' ? value : ''}
    readOnly={readOnly}
    onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
  />
);

const TimeWidget: EntityFormWidget = ({ field, value, onChange, readOnly, errorMessage }) => (
  <input
    type="time"
    {...commonProps(field, errorMessage)}
    value={typeof value === 'string' ? value : ''}
    readOnly={readOnly}
    onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
  />
);

const DatetimeWidget: EntityFormWidget = ({ field, value, onChange, readOnly, errorMessage }) => (
  <input
    type="datetime-local"
    {...commonProps(field, errorMessage)}
    value={typeof value === 'string' ? value : ''}
    readOnly={readOnly}
    onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
  />
);

/**
 * Option shape consumed by {@link SelectWidget}. The `config.options` array
 * on the field manifest must follow this shape; `value` is the wire value
 * sent back to the server, `labelKey` is the i18n key for the human
 * label (or `null` to fall back to `String(value)`).
 */
export interface SelectWidgetOption {
  readonly value: string | number | boolean | null;
  readonly labelKey: string | null;
}

const SelectWidget: EntityFormWidget = ({ field, value, onChange, readOnly, errorMessage }) => {
  const options = readOptions(field.config);
  if (!options) {
    return (
      <div data-granit-select-misconfigured="" data-property={field.propertyName}>
        Select widget on {field.propertyName} requires <code>config.options</code> with the
        documented shape.
      </div>
    );
  }
  const stringValue = value == null ? '' : String(value);
  return (
    <select
      {...commonProps(field, errorMessage)}
      value={stringValue}
      disabled={readOnly}
      onChange={(e) => {
        if (e.target.value === '') {
          onChange(null);
          return;
        }
        const next = options.find((o) => String(o.value) === e.target.value);
        onChange(next ? next.value : e.target.value);
      }}
    >
      <option value="">—</option>
      {options.map((option) => (
        <SelectOption key={String(option.value)} option={option} />
      ))}
    </select>
  );
};

function SelectOption({ option }: { readonly option: SelectWidgetOption }): ReactNode {
  // resolveLabel lookup happens here so each option is reactive to provider changes
  // without forcing a re-render of the parent widget.
  return <option value={String(option.value)}>{option.labelKey ?? String(option.value)}</option>;
}

function readOptions(
  config: Readonly<Record<string, unknown>> | null
): readonly SelectWidgetOption[] | null {
  if (!config) return null;
  const raw = config['options'];
  if (!Array.isArray(raw)) return null;
  const options: SelectWidgetOption[] = [];
  for (const entry of raw) {
    if (entry == null || typeof entry !== 'object') return null;
    const record = entry as Record<string, unknown>;
    const value = record['value'];
    if (
      value !== null &&
      typeof value !== 'string' &&
      typeof value !== 'number' &&
      typeof value !== 'boolean'
    ) {
      return null;
    }
    const labelKey = typeof record['labelKey'] === 'string' ? (record['labelKey'] as string) : null;
    options.push({ value, labelKey });
  }
  return options;
}

/**
 * Standard form-widget catalog (ADR-041 minimum set). Pass it to
 * `<EntityRendererProvider widgets={STANDARD_FORM_WIDGETS}>` to get
 * working unstyled HTML inputs out of the box. Apps that want richer UI
 * spread it and override the entries they care about:
 *
 * ```tsx
 * <EntityRendererProvider
 *   widgets={{
 *     form: { ...STANDARD_FORM_WIDGETS.form, text: MyShadcnTextWidget },
 *   }}
 * >
 * ```
 */
export const STANDARD_FORM_WIDGETS: EntityWidgetCatalog = Object.freeze({
  form: Object.freeze({
    text: TextWidget,
    textarea: TextareaWidget,
    integer: IntegerWidget,
    decimal: DecimalWidget,
    boolean: BooleanWidget,
    date: DateWidget,
    time: TimeWidget,
    datetime: DatetimeWidget,
    select: SelectWidget,
  }),
});
