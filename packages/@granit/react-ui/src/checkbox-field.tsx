import { Checkbox } from './checkbox.js';
import { FormControl, FormField, FormItem, FormLabel } from './form.js';

import type { ReactNode } from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

export interface CheckboxFieldProps<TValues extends FieldValues> {
  readonly control: Control<TValues>;
  readonly name: FieldPath<TValues>;
  readonly label: ReactNode;
}

/**
 * `react-hook-form` boolean field rendered as an inline checkbox + label.
 */
export function CheckboxField<TValues extends FieldValues>({
  control,
  name,
  label,
}: CheckboxFieldProps<TValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center gap-2 space-y-0">
          <FormControl>
            <Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} />
          </FormControl>
          <FormLabel className="!mt-0">{label}</FormLabel>
        </FormItem>
      )}
    />
  );
}
