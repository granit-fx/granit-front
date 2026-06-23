import { catalogConstraints } from '@granit/catalog';
import {
  useAddProductExternalMapping,
  useRemoveProductExternalMapping,
} from '@granit/react-catalog';
import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  toast,
} from '@granit/react-ui';
import { createConstraintsResolver } from '@granit/react-validation';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useForm, type Resolver } from 'react-hook-form';

import { capitalize } from '../lib/capitalize';

import type { ProductExternalMappingId, ProductResponse } from '@granit/catalog';

interface Props {
  readonly product: ProductResponse;
}

interface ExternalMappingFormValues {
  providerName: string;
  externalId: string;
}

export function ExternalMappingsManager({ product }: Props) {
  const { t } = useTranslation();
  const add = useAddProductExternalMapping();
  const remove = useRemoveProductExternalMapping();

  // Spec-derived validation: required + maxLength for providerName / externalId
  // come from the OpenAPI-backed AddProductExternalMappingRequest constraints.
  const formResolver = createConstraintsResolver(
    catalogConstraints.AddProductExternalMappingRequest,
    t,
    { labelResolver: (field) => t(`Catalog.Fields.${capitalize(field)}`, field) }
  ) as unknown as Resolver<ExternalMappingFormValues>;

  const form = useForm<ExternalMappingFormValues>({
    resolver: formResolver,
    defaultValues: { providerName: '', externalId: '' },
  });

  const handleAdd = (values: ExternalMappingFormValues) => {
    add.mutate(
      { id: product.id, request: values },
      {
        onSuccess: () => {
          toast.success(t('Catalog.MappingAddSuccess'));
          form.reset({ providerName: '', externalId: '' });
        },
      }
    );
  };

  const handleRemove = (mappingId: ProductExternalMappingId) => {
    remove.mutate(
      { id: product.id, mappingId },
      {
        onSuccess: () => toast.success(t('Catalog.MappingRemoveSuccess')),
      }
    );
  };

  return (
    <div className="space-y-4">
      {product.externalMappings.length === 0 && (
        <p className="text-sm text-muted-foreground">{t('Catalog.NoMappings')}</p>
      )}
      {product.externalMappings.length > 0 && (
        <ul className="divide-y rounded-md border">
          {product.externalMappings.map((mapping) => (
            <li key={mapping.id} className="flex items-center justify-between p-3">
              <div>
                <p className="font-medium">{mapping.providerName}</p>
                <p className="font-mono text-xs text-muted-foreground">{mapping.externalId}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(mapping.id)}
                disabled={remove.isPending}
                aria-label={t('Catalog.Actions.RemoveMapping')}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleAdd)}
          className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_2fr_auto]"
        >
          <FormField
            control={form.control}
            name="providerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Catalog.Mapping.Provider')}</FormLabel>
                <FormControl>
                  <Input placeholder="Stripe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="externalId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Catalog.Mapping.ExternalId')}</FormLabel>
                <FormControl>
                  <Input placeholder="price_1Q0..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex items-end">
            <Button type="submit" disabled={add.isPending}>
              {add.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              {t('Catalog.Actions.AddMapping')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
