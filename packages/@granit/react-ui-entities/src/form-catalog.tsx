import type { EntityComponentCatalog, EntityFormComponent } from '@granit/react-entities';
import { STANDARD_FORM_COMPONENTS } from '@granit/react-entities';
import { PhoneInput, TimezonePicker, UrlInput } from '@granit/react-ui-kit';
import { Mail } from 'lucide-react';

// ---------------------------------------------------------------------------
// Phone
// ---------------------------------------------------------------------------

export const PhoneFormComponent: EntityFormComponent = ({ field, value, onChange, readOnly }) => (
  <PhoneInput
    id={`field-${field.propertyName}`}
    name={field.propertyName}
    value={typeof value === 'string' ? value : null}
    onChange={(next) => onChange(next ?? null)}
    disabled={readOnly}
  />
);

// ---------------------------------------------------------------------------
// URL
// ---------------------------------------------------------------------------

export const UrlFormComponent: EntityFormComponent = ({ field, value, onChange, readOnly }) => (
  <UrlInput
    id={`field-${field.propertyName}`}
    name={field.propertyName}
    value={typeof value === 'string' ? value : null}
    onChange={(next) => onChange(next ?? null)}
    disabled={readOnly}
  />
);

// ---------------------------------------------------------------------------
// Timezone
// ---------------------------------------------------------------------------

export const TimezoneFormComponent: EntityFormComponent = ({
  field,
  value,
  onChange,
  readOnly,
}) => (
  <TimezonePicker
    id={`field-${field.propertyName}`}
    name={field.propertyName}
    value={typeof value === 'string' ? value : null}
    onChange={(next) => onChange(next ?? null)}
    disabled={readOnly}
    clearable
  />
);

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------

export const EmailFormComponent: EntityFormComponent = ({
  field,
  value,
  onChange,
  readOnly,
  errorMessage,
}) => (
  <div className="relative">
    <Mail className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    <input
      id={`field-${field.propertyName}`}
      name={field.propertyName}
      type="email"
      value={typeof value === 'string' ? value : ''}
      readOnly={readOnly}
      aria-invalid={errorMessage ? true : undefined}
      onChange={(e) => onChange(e.target.value || null)}
      className="!pl-8"
    />
  </div>
);

// ---------------------------------------------------------------------------
// Money  (wire = Int64 minor units / cents, display = decimal)
// ---------------------------------------------------------------------------

interface MoneyConfig {
  readonly currencyCode?: string;
  readonly currencyProperty?: string;
}

export const MoneyFormComponent: EntityFormComponent = ({
  field,
  value,
  onChange,
  readOnly,
  errorMessage,
}) => {
  const config = (field.config ?? {}) as MoneyConfig;
  const currencyHint = config.currencyCode ?? config.currencyProperty ?? '';
  const minorUnits = typeof value === 'number' ? value : null;
  const display = minorUnits === null ? '' : (minorUnits / 100).toFixed(2);
  return (
    <div className="flex items-center gap-2">
      <input
        id={`field-${field.propertyName}`}
        name={field.propertyName}
        type="number"
        step="0.01"
        inputMode="decimal"
        value={display}
        readOnly={readOnly}
        aria-invalid={errorMessage ? true : undefined}
        onChange={(e) => {
          const next = e.target.value;
          if (next === '') {
            onChange(null);
            return;
          }
          const parsed = Number.parseFloat(next);
          onChange(Number.isFinite(parsed) ? Math.round(parsed * 100) : null);
        }}
        className="flex-1"
      />
      {currencyHint && (
        <span
          className="rounded-md border bg-muted px-2 py-1 text-xs uppercase text-muted-foreground"
          aria-label="currency"
        >
          {currencyHint}
        </span>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Composed catalog — extends the standard unstyled baseline
// ---------------------------------------------------------------------------

/**
 * Extends {@link STANDARD_FORM_COMPONENTS} with styled inputs for the most
 * common field types. Pass to `<EntityRendererProvider components={...} />`
 * and spread app-specific entries on top:
 *
 * ```tsx
 * <EntityRendererProvider
 *   components={{
 *     form: {
 *       ...GRANIT_UI_FORM_COMPONENTS.form,
 *       'currency-code': CurrencyCodeFormComponent,
 *     },
 *   }}
 * />
 * ```
 */
export const GRANIT_UI_FORM_COMPONENTS: EntityComponentCatalog = Object.freeze({
  form: Object.freeze({
    ...STANDARD_FORM_COMPONENTS.form,
    phone: PhoneFormComponent,
    url: UrlFormComponent,
    timezone: TimezoneFormComponent,
    email: EmailFormComponent,
    money: MoneyFormComponent,
  }),
});
