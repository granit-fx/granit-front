import { FormControl, FormField, FormItem, FormLabel, FormMessage } from './form.js';
import { Input } from './input.js';

import type { ReactNode } from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

export interface TextFieldProps<TValues extends FieldValues> {
  readonly control: Control<TValues>;
  readonly name: FieldPath<TValues>;
  readonly label: ReactNode;
  readonly type?: string;
  readonly placeholder?: string;
  readonly maxLength?: number;
  /** Normalises every keystroke, e.g. `toLowerCase` / `toUpperCase`. */
  readonly transform?: (value: string) => string;
}

/**
 * `react-hook-form` text field: label + `<Input>` + validation message. Neutral
 * so any feature can use it. Coerces a `null`/`undefined` field value to `''` to
 * keep the input controlled.
 */
export function TextField<TValues extends FieldValues>({
  control,
  name,
  label,
  type,
  placeholder,
  maxLength,
  transform,
}: TextFieldProps<TValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              {...field}
              value={field.value ?? ''}
              type={type}
              placeholder={placeholder}
              maxLength={maxLength}
              onChange={
                transform ? (e) => field.onChange(transform(e.target.value)) : field.onChange
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
