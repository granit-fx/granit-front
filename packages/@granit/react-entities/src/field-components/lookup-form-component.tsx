import { LookupSelect } from '@granit/react-data-lookup';

import type { EntityFormComponent } from '../providers/component-catalog';
import type { LookupSelectRenderArgs } from '@granit/react-data-lookup';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Standard `lookup` form component (ADR-028 entity-form binding).
//
// Rendered for any field whose manifest carries a `lookup` descriptor — see the
// dispatch in <EntityForm>. Backed by <LookupSelect> from @granit/react-data-lookup:
// debounced server typeahead, label rehydration of the persisted foreign-key
// value (selectedItem), and the Empty Scope Trap for cascading pickers.
//
// Like the other standard components it is an intentionally unstyled, minimal
// combobox. Apps wanting a shadcn / Radix flavour override `components.form.lookup`
// via <EntityRendererProvider>. The Axios client + base path come from the
// surrounding <DataLookupProvider>.
// ---------------------------------------------------------------------------

/**
 * Resolves the lookup `scope` from sibling form values. Each scope key the
 * source declares is read from the form value of the same name (case-insensitive,
 * mirroring the camelCase scopeKey / PascalCase property convention), so a
 * cascading picker (e.g. a meter scoped to the selected tenant) wires up without
 * extra app code. Unknown values stay `undefined` → the picker suppresses the
 * request and shows the missing-scope placeholder.
 */
function coerceScopeValue(raw: unknown): string | undefined {
  if (raw === null || raw === undefined) return undefined;
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'number' || typeof raw === 'boolean' || typeof raw === 'bigint')
    return `${raw}`;
  return JSON.stringify(raw);
}

function deriveScopeFromValues(
  scopeKeys: readonly string[] | undefined,
  values: Readonly<Record<string, unknown>> | undefined
): Readonly<Record<string, string | undefined>> | undefined {
  if (!scopeKeys || scopeKeys.length === 0 || !values) return undefined;
  const lowerToValue = new Map<string, unknown>();
  for (const [key, val] of Object.entries(values)) lowerToValue.set(key.toLowerCase(), val);
  const scope: Record<string, string | undefined> = {};
  for (const key of scopeKeys) {
    scope[key] = coerceScopeValue(lowerToValue.get(key.toLowerCase()));
  }
  return scope;
}

/**
 * `lookup` catalog component. Reads the descriptor from `field.lookup`; renders a
 * misconfigured notice when absent (the dispatch only routes here when a lookup
 * is declared, so this is a defensive guard).
 *
 * `config.scope` (optional) may carry the full form values so cascading pickers
 * can resolve their scope keys; absent that, scoped lookups simply show the
 * missing-scope placeholder until the host wires a scope in.
 */
export const LookupFormComponent: EntityFormComponent = ({
  field,
  value,
  onChange,
  readOnly,
  errorMessage,
  formValues,
}) => {
  const descriptor = field.lookup;
  if (!descriptor) {
    return (
      <div data-granit-lookup-misconfigured="" data-property={field.propertyName}>
        Lookup component on {field.propertyName} requires a <code>lookup</code> descriptor on the
        field manifest.
      </div>
    );
  }

  const scope = deriveScopeFromValues(descriptor.scopeKeys, formValues);

  return (
    <LookupSelect
      descriptor={descriptor}
      value={value}
      onChange={onChange}
      scope={scope}
      render={(args) => (
        <LookupCombobox
          args={args}
          propertyName={field.propertyName}
          readOnly={readOnly}
          errorMessage={errorMessage}
        />
      )}
    />
  );
};

interface LookupComboboxProps {
  readonly args: LookupSelectRenderArgs;
  readonly propertyName: string;
  readonly readOnly: boolean;
  readonly errorMessage?: string;
}

/** Minimal unstyled WAI-ARIA combobox over the headless {@link LookupSelect} state. */
function LookupCombobox({
  args,
  propertyName,
  readOnly,
  errorMessage,
}: LookupComboboxProps): ReactNode {
  const { search, setSearch, value, onChange, selectedItem, items, isLoading, missingScopeKey } =
    args;
  const inputId = `field-${propertyName}`;
  const listboxId = `field-${propertyName}-listbox`;

  if (missingScopeKey) {
    return (
      <div
        data-granit-lookup-scope-missing={missingScopeKey}
        data-property={propertyName}
        aria-disabled="true"
      />
    );
  }

  // Read-only fields show the resolved label (or the raw value as a fallback).
  if (readOnly) {
    const label = selectedItem?.label ?? (value == null ? '' : String(value));
    return (
      <span data-granit-lookup-readonly="" data-property={propertyName}>
        {label}
      </span>
    );
  }

  const hasItems = items.length > 0;
  return (
    <div data-granit-lookup="" data-property={propertyName}>
      <input
        id={inputId}
        name={propertyName}
        type="text"
        role="combobox"
        aria-expanded={hasItems}
        aria-controls={listboxId}
        aria-invalid={errorMessage ? true : undefined}
        autoComplete="off"
        value={search}
        placeholder={selectedItem?.label}
        onChange={(e) => setSearch(e.target.value)}
      />
      {value != null && selectedItem ? (
        <span data-granit-lookup-selected="">{selectedItem.label}</span>
      ) : null}
      <ul id={listboxId} role="listbox" data-loading={isLoading ? '' : undefined}>
        {/* NOSONAR: custom combobox — native <select> cannot implement debounced typeahead with separate label/value */}
        {items.map((item) => (
          <li
            key={String(item.value)}
            role="option"
            aria-selected={item.value === value}
            data-value={String(item.value)}
            onClick={() => {
              onChange(item.value);
              setSearch('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onChange(item.value);
                setSearch('');
              }
            }}
          >
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
