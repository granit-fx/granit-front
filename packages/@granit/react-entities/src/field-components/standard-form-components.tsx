import type { EntityComponentCatalog, EntityFormComponent } from '../providers/component-catalog.js';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Standard form-component catalog (ADR-041 minimum set).
//
// Ids match the defaults emitted by Granit.Entities.Abstractions.FieldBuilder
// .ChooseDefaultComponent(): text / integer / decimal / boolean / date /
// time / datetime / select. textarea is an explicit opt-in via
// .Component("textarea") on the .NET side.
//
// Components are intentionally unstyled HTML inputs. Apps that want
// shadcn / Tailwind / Material flavour wrap or replace them via the
// catalog they pass to <EntityRendererProvider components={...} />.
// ---------------------------------------------------------------------------

function commonProps(field: { propertyName: string }, errorMessage?: string) {
  return {
    id: `field-${field.propertyName}`,
    name: field.propertyName,
    'aria-invalid': errorMessage ? true : undefined,
  } as const;
}

const TextComponent: EntityFormComponent = ({ field, value, onChange, readOnly, errorMessage }) => (
  <input
    type="text"
    {...commonProps(field, errorMessage)}
    value={typeof value === 'string' ? value : ''}
    readOnly={readOnly}
    onChange={(e) => onChange(e.target.value)}
  />
);

const TextareaComponent: EntityFormComponent = ({
  field,
  value,
  onChange,
  readOnly,
  errorMessage,
}) => (
  <textarea
    {...commonProps(field, errorMessage)}
    value={typeof value === 'string' ? value : ''}
    readOnly={readOnly}
    onChange={(e) => onChange(e.target.value)}
  />
);

const IntegerComponent: EntityFormComponent = ({
  field,
  value,
  onChange,
  readOnly,
  errorMessage,
}) => (
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

const DecimalComponent: EntityFormComponent = ({
  field,
  value,
  onChange,
  readOnly,
  errorMessage,
}) => (
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

const BooleanComponent: EntityFormComponent = ({
  field,
  value,
  onChange,
  readOnly,
  errorMessage,
}) => (
  <input
    type="checkbox"
    {...commonProps(field, errorMessage)}
    checked={value === true}
    disabled={readOnly}
    onChange={(e) => onChange(e.target.checked)}
  />
);

const DateComponent: EntityFormComponent = ({ field, value, onChange, readOnly, errorMessage }) => (
  <input
    type="date"
    {...commonProps(field, errorMessage)}
    value={typeof value === 'string' ? value : ''}
    readOnly={readOnly}
    onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
  />
);

const TimeComponent: EntityFormComponent = ({ field, value, onChange, readOnly, errorMessage }) => (
  <input
    type="time"
    {...commonProps(field, errorMessage)}
    value={typeof value === 'string' ? value : ''}
    readOnly={readOnly}
    onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
  />
);

const DatetimeComponent: EntityFormComponent = ({
  field,
  value,
  onChange,
  readOnly,
  errorMessage,
}) => (
  <input
    type="datetime-local"
    {...commonProps(field, errorMessage)}
    value={typeof value === 'string' ? value : ''}
    readOnly={readOnly}
    onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
  />
);

/**
 * Option shape consumed by {@link SelectComponent}. The `config.options`
 * array on the field manifest must follow this shape; `value` is the
 * wire value sent back to the server, `labelKey` is the i18n key for
 * the human label (or `null` to fall back to `String(value)`).
 */
export interface SelectComponentOption {
  readonly value: string | number | boolean | null;
  readonly labelKey: string | null;
}

const SelectComponent: EntityFormComponent = ({
  field,
  value,
  onChange,
  readOnly,
  errorMessage,
}) => {
  const options = readOptions(field.config);
  if (!options) {
    return (
      <div data-granit-select-misconfigured="" data-property={field.propertyName}>
        Select component on {field.propertyName} requires <code>config.options</code> with the
        documented shape.
      </div>
    );
  }
  const stringValue = stringifySelectValue(value);
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

function SelectOption({ option }: { readonly option: SelectComponentOption }): ReactNode {
  return <option value={String(option.value)}>{option.labelKey ?? String(option.value)}</option>;
}

function readOptions(
  config: Readonly<Record<string, unknown>> | null
): readonly SelectComponentOption[] | null {
  if (!config) return null;
  const raw = config['options'];
  if (!Array.isArray(raw)) return null;
  const options: SelectComponentOption[] = [];
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
    const rawLabelKey = record['labelKey'];
    const labelKey = typeof rawLabelKey === 'string' ? rawLabelKey : null;
    options.push({ value, labelKey });
  }
  return options;
}

function stringifySelectValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  return '';
}

/**
 * Standard form-component catalog (ADR-041 minimum set). Pass it to
 * `<EntityRendererProvider components={STANDARD_FORM_COMPONENTS}>` to
 * get working unstyled HTML inputs out of the box. Apps that want
 * richer UI spread it and override the entries they care about:
 *
 * ```tsx
 * <EntityRendererProvider
 *   components={{
 *     form: { ...STANDARD_FORM_COMPONENTS.form, text: MyShadcnTextComponent },
 *   }}
 * >
 * ```
 */
export const STANDARD_FORM_COMPONENTS: EntityComponentCatalog = Object.freeze({
  form: Object.freeze({
    text: TextComponent,
    textarea: TextareaComponent,
    integer: IntegerComponent,
    decimal: DecimalComponent,
    boolean: BooleanComponent,
    date: DateComponent,
    time: TimeComponent,
    datetime: DatetimeComponent,
    select: SelectComponent,
  }),
});
