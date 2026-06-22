import { catalogConstraints } from '@granit/catalog';
import { useCreateProduct } from '@granit/react-catalog';
import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@granit/react-ui';
import { createConstraintsResolver } from '@granit/react-validation';
import { Loader2 } from 'lucide-react';
import { useForm, type Resolver } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { PRODUCT_TYPES } from './constants';
import { capitalize } from './lib/capitalize';

import type { ProductType } from '@granit/catalog';

interface ProductCreateFormValues {
  sku: string;
  name: string;
  type: ProductType;
  unit: string;
  description: string;
}

export function CatalogCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const create = useCreateProduct();

  // Spec-derived validation: required + maxLength constraints come from the
  // OpenAPI-backed ProductCreateRequest. The resolver only validates registered
  // fields, so request-only shapes are never evaluated here.
  const formResolver = createConstraintsResolver(catalogConstraints.ProductCreateRequest, t, {
    labelResolver: (field) => t(`Catalog.Fields.${capitalize(field)}`, field),
  }) as unknown as Resolver<ProductCreateFormValues>;

  const form = useForm<ProductCreateFormValues>({
    resolver: formResolver,
    defaultValues: {
      sku: '',
      name: '',
      type: 'Service',
      unit: 'each',
      description: '',
    },
  });

  const handleSubmit = (values: ProductCreateFormValues) => {
    const description = values.description.trim();
    create.mutate(
      {
        sku: values.sku.toUpperCase(),
        name: values.name,
        type: values.type,
        unit: values.unit,
        description: description || null,
      },
      {
        onSuccess: (created) => {
          toast.success(t('Catalog.CreateSuccess'));
          navigate(`/catalog/${created.id}`);
        },
      }
    );
  };

  return (
    <div data-slot="catalog-create-page" className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">{t('Catalog.CreateTitle')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('Catalog.CreateSubtitle')}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Catalog.Fields.Sku')}</FormLabel>
                <FormControl>
                  <Input placeholder="BASIC-MONTHLY" {...field} />
                </FormControl>
                <FormDescription>{t('Catalog.Fields.SkuHelp')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Catalog.Fields.Name')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Catalog.Fields.Type')}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PRODUCT_TYPES.map((productType) => (
                        <SelectItem key={productType} value={productType}>
                          {productType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>{t('Catalog.Fields.TypeHelp')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Catalog.Fields.Unit')}</FormLabel>
                  <FormControl>
                    <Input placeholder="each" {...field} />
                  </FormControl>
                  <FormDescription>{t('Catalog.Fields.UnitHelp')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Catalog.Fields.Description')}</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => navigate('/catalog')}>
              {t('Common.Cancel')}
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="size-4 animate-spin" />}
              {t('Common.Create')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
