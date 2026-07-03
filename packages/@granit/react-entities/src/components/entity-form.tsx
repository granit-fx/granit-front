import { evaluateVisibility } from '@granit/entities';
import { useCallback, useMemo, type ReactNode } from 'react';

import { resolveFormComponentId } from '../field-components/resolve-form-component';
import { useEntityRenderer } from '../providers/entity-renderer-provider';

import { MissingComponent } from './missing-component';

import type {
  EntityFormFieldManifest,
  EntityFormManifest,
  EntityFormSectionManifest,
} from '@granit/entities';

export interface EntityFormProps {
  /** Form variant from the manifest (one of `manifest.forms`). */
  readonly variant: EntityFormManifest;
  /** Current form values keyed by PascalCase property name. */
  readonly values: Readonly<Record<string, unknown>>;
  /** Called whenever a component changes its field — receives the next full values bag. */
  readonly onChange: (next: Readonly<Record<string, unknown>>) => void;
  /** When `true`, every component renders read-only regardless of `field.readOnly`. */
  readonly readOnly?: boolean;
  /** First validation message keyed by property name, when any. */
  readonly errors?: Readonly<Record<string, string | undefined>>;
  /** Optional class for the root form element. */
  readonly className?: string;
}

/**
 * Generic form renderer driven by an `EntityFormManifest`. Reads the
 * component catalog + i18n bridge from `<EntityRendererProvider>`, sorts
 * sections / fields by their declared `order`, evaluates `visibleIf`
 * against the current values to gate fields, and forwards `readOnly` to
 * every component (a field is read-only if either the form prop or the
 * manifest field declares it).
 *
 * The component is **fully controlled** — it owns no state. The host
 * wires React Hook Form, Zod validation, autosave, etc. above it. That
 * keeps the renderer pure and testable, and lets a parent reuse the same
 * `<EntityForm />` against different state strategies.
 *
 * Sections render unconditionally — `collapsedByDefault` surfaces as a
 * `data-collapsed-by-default` attribute so a wrapping component or
 * stylesheet can layer collapsibility without forking the renderer.
 */
export function EntityForm({
  variant,
  values,
  onChange,
  readOnly = false,
  errors,
  className,
}: EntityFormProps): ReactNode {
  const sortedSections = useMemo(
    () => [...variant.sections].sort((a, b) => a.order - b.order),
    [variant.sections]
  );

  const handleFieldChange = useCallback(
    (property: string, next: unknown) => {
      onChange({ ...values, [property]: next });
    },
    [values, onChange]
  );

  return (
    <div data-granit-entity-form="" data-variant={variant.name} className={className}>
      {sortedSections.map((section) => (
        <EntityFormSection
          key={section.key}
          section={section}
          values={values}
          onFieldChange={handleFieldChange}
          readOnly={readOnly}
          errors={errors}
        />
      ))}
    </div>
  );
}

interface EntityFormSectionProps {
  readonly section: EntityFormSectionManifest;
  readonly values: Readonly<Record<string, unknown>>;
  readonly onFieldChange: (property: string, next: unknown) => void;
  readonly readOnly: boolean;
  readonly errors: Readonly<Record<string, string | undefined>> | undefined;
}

function EntityFormSection({
  section,
  values,
  onFieldChange,
  readOnly,
  errors,
}: EntityFormSectionProps): ReactNode {
  const { resolveLabel } = useEntityRenderer();
  const sortedFields = useMemo(
    () => [...section.fields].sort((a, b) => a.order - b.order),
    [section.fields]
  );

  return (
    <section
      data-granit-form-section=""
      data-section-key={section.key}
      data-collapsed-by-default={section.collapsedByDefault ? '' : undefined}
    >
      {section.labelKey ? (
        <header data-granit-section-header="">{resolveLabel(section.labelKey)}</header>
      ) : null}
      {sortedFields.map((field) => (
        <EntityFormField
          key={field.propertyName}
          field={field}
          values={values}
          onFieldChange={onFieldChange}
          readOnly={readOnly}
          errorMessage={errors?.[field.propertyName]}
        />
      ))}
    </section>
  );
}

interface EntityFormFieldProps {
  readonly field: EntityFormFieldManifest;
  readonly values: Readonly<Record<string, unknown>>;
  readonly onFieldChange: (property: string, next: unknown) => void;
  readonly readOnly: boolean;
  readonly errorMessage: string | undefined;
}

function EntityFormField({
  field,
  values,
  onFieldChange,
  readOnly,
  errorMessage,
}: EntityFormFieldProps): ReactNode {
  const { components, resolveLabel } = useEntityRenderer();

  if (field.visibleIf && !evaluateVisibility(field.visibleIf, values)) {
    return null;
  }

  // Resolve the component id: a declared lookup wins, else a `valueKind` hint
  // may upgrade a CLR-default component to a richer input (money / url / …)
  // when that input is registered, else the manifest `component` is used as-is.
  const componentId = resolveFormComponentId(field, components.form);
  const Component = components.form[componentId];

  // Always render a label: fields whose entity definition never called
  // `.Label(...)` arrive with `labelKey: null`, and without a fallback they'd
  // render no label at all. Route the humanized property name through
  // `resolveLabel` so apps can still localize by property name and the i18n
  // bridge's `defaultValue` path keeps working.
  const labelText = field.labelKey
    ? resolveLabel(field.labelKey)
    : resolveLabel(field.propertyName, humanizePropertyName(field.propertyName));

  return (
    <div data-granit-form-field="" data-property={field.propertyName} data-component={componentId}>
      <label data-granit-field-label="">{labelText}</label>
      {Component ? (
        <Component
          field={field}
          value={values[field.propertyName]}
          onChange={(next) => onFieldChange(field.propertyName, next)}
          readOnly={readOnly || field.readOnly}
          errorMessage={errorMessage}
          formValues={values}
        />
      ) : (
        <MissingComponent field={field} />
      )}
      {field.helpKey ? (
        <small data-granit-field-help="">{resolveLabel(field.helpKey)}</small>
      ) : null}
      {errorMessage ? (
        <p data-granit-field-error="" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Turns a PascalCase property name into spaced words for use as a fallback
 * label when the manifest carries no `labelKey` (`"TaxId"` → `"Tax Id"`,
 * `"DefaultCurrency"` → `"Default Currency"`, `"Kind"` → `"Kind"`).
 */
function humanizePropertyName(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z])(?=[A-Z][a-z])/g, '$1 ');
}
