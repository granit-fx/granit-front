import type { EntityFormComponent } from '@granit/react-entities';

interface MoneyConfig {
  readonly currencyCode?: string;
  readonly currencyProperty?: string;
}

// Values stay on the wire as Int64 minor units (cents) — the user
// enters decimal, we round-trip through 100×.
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
