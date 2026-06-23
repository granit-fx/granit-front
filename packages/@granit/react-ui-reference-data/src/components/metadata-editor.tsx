import { useTranslation } from '@granit/react-localization';
import { Button, FormControl, FormField, FormItem, FormLabel, Input } from '@granit/react-ui';
import { Plus, Trash2 } from 'lucide-react';
import { useCallback } from 'react';
import { useFieldArray } from 'react-hook-form';

import type { UseFormReturn } from 'react-hook-form';

interface MetadataEditorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly form: UseFormReturn<any>;
  readonly name?: string;
  readonly i18nPrefix?: string;
  /** Suggested keys shown via datalist autocomplete. */
  readonly suggestions?: string[];
}

export function MetadataEditor({
  form,
  name = 'metadata',
  i18nPrefix = 'ReferenceData.Common',
  suggestions,
}: MetadataEditorProps) {
  const { t } = useTranslation();

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name,
  });

  const handleAdd = useCallback(() => {
    append({ key: '', value: '' });
  }, [append]);

  const datalistId = suggestions?.length ? `${name}-suggestions` : undefined;

  return (
    <div data-slot="metadata-editor">
      <div className="mb-2 flex items-center justify-between">
        <FormLabel>{t(`${i18nPrefix}.Form.Metadata`)}</FormLabel>
        <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
          <Plus className="mr-1 h-3 w-3" />
          {t(`${i18nPrefix}.Form.AddProperty`)}
        </Button>
      </div>
      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground">{t(`${i18nPrefix}.Form.NoMetadata`)}</p>
      )}
      {fields.map((field, index) => (
        <div key={field.id} className="mb-2 flex items-center gap-2">
          <FormField
            control={form.control}
            name={`${name}.${index}.key`}
            render={({ field: f }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input
                    {...f}
                    placeholder={t(`${i18nPrefix}.Form.PropertyKey`)}
                    list={datalistId}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${name}.${index}.value`}
            render={({ field: f }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input {...f} placeholder={t(`${i18nPrefix}.Form.PropertyValue`)} />
                </FormControl>
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-alert-600"
            onClick={() => remove(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      {datalistId && (
        <datalist id={datalistId}>
          {suggestions?.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      )}
    </div>
  );
}
