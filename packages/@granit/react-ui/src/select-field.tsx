import { FormControl, FormField, FormItem, FormLabel, FormMessage } from './form.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select.js';

import type { ReactNode } from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

export interface SelectFieldOption {
  readonly value: string;
  readonly label: ReactNode;
}

export interface SelectFieldProps<TValues extends FieldValues> {
  readonly control: Control<TValues>;
  readonly name: FieldPath<TValues>;
  readonly label: ReactNode;
  readonly options: readonly SelectFieldOption[];
  readonly placeholder?: ReactNode;
}

/**
 * `react-hook-form` single-select field: label + `<Select>` + validation message.
 * Callers build {@link SelectFieldOption} entries (already translated).
 */
export function SelectField<TValues extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder,
}: SelectFieldProps<TValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder ?? label} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
