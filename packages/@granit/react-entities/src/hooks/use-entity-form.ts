import { useCallback, useMemo } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';

import type { EntityFormManifest } from '@granit/entities';

export interface UseEntityFormOptions {
  /** Initial values, overlaid on top of the type-derived defaults. */
  readonly defaultValues?: Readonly<Record<string, unknown>>;
  /**
   * Validation mode forwarded to RHF. Default `onSubmit` matches the
   * server-authoritative model — the .NET endpoints run FluentValidation
   * on every write, so client-side checks are UX hints rather than
   * authoritative gates.
   */
  readonly mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
}

export interface UseEntityFormReturn {
  /** Spread these onto `<EntityForm />` directly. */
  readonly formProps: {
    readonly values: Readonly<Record<string, unknown>>;
    readonly onChange: (next: Readonly<Record<string, unknown>>) => void;
    readonly errors: Readonly<Record<string, string | undefined>>;
  };
  /** Underlying React Hook Form instance for advanced use cases. */
  readonly form: UseFormReturn<Record<string, unknown>>;
  /** RHF submit-handler factory. */
  readonly handleSubmit: UseFormReturn<Record<string, unknown>>['handleSubmit'];
  readonly isDirty: boolean;
  readonly isSubmitting: boolean;
  /** Resets the form to the initial defaults (or the supplied values). */
  readonly reset: UseFormReturn<Record<string, unknown>>['reset'];
}

/**
 * Wires a `<EntityForm />` to a React Hook Form instance. Default values
 * are derived from each field's `clrTypeName` so number / date inputs
 * start empty (`null`) rather than as the string `"undefined"`, and
 * boolean inputs render unchecked.
 *
 * Validation: server-authoritative. The .NET endpoints run
 * FluentValidation on every write, so this hook deliberately doesn't
 * synthesise client-side rules from the manifest yet — the manifest
 * doesn't carry required / min / max metadata. Apps that want
 * immediate-feedback validation today can pass a Zod resolver via
 * `useForm`'s `resolver` option through `form.<...>` directly. A
 * built-in schema generator lands once the manifest exposes the
 * validation contract.
 */
export function useEntityForm(
  variant: EntityFormManifest,
  options: UseEntityFormOptions = {}
): UseEntityFormReturn {
  const initialDefaults = useMemo(
    () =>
      options.defaultValues
        ? { ...deriveDefaults(variant), ...options.defaultValues }
        : deriveDefaults(variant),
    [variant, options.defaultValues]
  );

  const form = useForm<Record<string, unknown>>({
    defaultValues: initialDefaults,
    mode: options.mode ?? 'onSubmit',
  });

  const values = form.watch();
  const errors = form.formState.errors;

  const onChange = useCallback(
    (next: Readonly<Record<string, unknown>>) => {
      for (const [key, val] of Object.entries(next)) {
        if (val !== values[key]) {
          form.setValue(key, val, { shouldDirty: true, shouldValidate: false });
        }
      }
    },
    [form, values]
  );

  const errorMessages = useMemo<Record<string, string | undefined>>(() => {
    const out: Record<string, string | undefined> = {};
    for (const [key, err] of Object.entries(errors)) {
      const message = (err as { message?: unknown } | undefined)?.message;
      if (typeof message === 'string') {
        out[key] = message;
      }
    }
    return out;
  }, [errors]);

  return {
    formProps: { values, onChange, errors: errorMessages },
    form,
    handleSubmit: form.handleSubmit,
    isDirty: form.formState.isDirty,
    isSubmitting: form.formState.isSubmitting,
    reset: form.reset,
  };
}

/**
 * Derives a reasonable empty-state for each field based on its CLR type.
 * String → `''`, boolean → `false`, numerics + dates → `null`.
 */
function deriveDefaults(variant: EntityFormManifest): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const section of variant.sections) {
    for (const field of section.fields) {
      defaults[field.propertyName] = defaultForType(field.clrTypeName);
    }
  }
  return defaults;
}

function defaultForType(clrTypeName: string): unknown {
  switch (clrTypeName) {
    case 'String':
      return '';
    case 'Boolean':
      return false;
    case 'Int16':
    case 'Int32':
    case 'Int64':
    case 'Decimal':
    case 'Double':
    case 'Single':
    case 'Byte':
      return null;
    case 'DateOnly':
    case 'DateTime':
    case 'DateTimeOffset':
    case 'TimeOnly':
      return null;
    default:
      return null;
  }
}
