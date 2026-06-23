import { catalogConstraints, type ProductId } from '@granit/catalog';
import { useProduct, useUpdateProduct } from '@granit/react-catalog';
import { useTranslation } from '@granit/react-localization';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Spinner,
  Textarea,
  toast,
} from '@granit/react-ui';
import { createConstraintsResolver } from '@granit/react-validation';
import { toEntityId } from '@granit/types';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { capitalize } from './lib/capitalize';

interface ProductUpdateFormValues {
  name: string;
  unit: string;
  description: string;
}

export function CatalogEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const productId = id ? (toEntityId<'Product'>(id) as ProductId) : null;

  const { data: product, isLoading } = useProduct(productId);
  const update = useUpdateProduct();

  // Spec-derived validation: required + maxLength constraints come from the
  // OpenAPI-backed ProductUpdateRequest.
  const formResolver = createConstraintsResolver(catalogConstraints.ProductUpdateRequest, t, {
    labelResolver: (field) => t(`Catalog.Fields.${capitalize(field)}`, field),
  }) as unknown as Resolver<ProductUpdateFormValues>;

  const form = useForm<ProductUpdateFormValues>({
    resolver: formResolver,
    defaultValues: { name: '', description: '', unit: '' },
  });

  const { reset } = form;
  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description ?? '',
        unit: product.unit,
      });
    }
  }, [product, reset]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (!product || !productId) {
    return <p className="text-sm text-muted-foreground">{t('Catalog.NotFound')}</p>;
  }
  if (product.lifecycleStatus !== 'Draft') {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="size-4" />
        <AlertTitle>{t('Catalog.EditNotAllowedTitle')}</AlertTitle>
        <AlertDescription>{t('Catalog.EditNotAllowedBody')}</AlertDescription>
      </Alert>
    );
  }

  const handleSubmit = (values: ProductUpdateFormValues) => {
    const description = values.description.trim();
    update.mutate(
      {
        id: productId,
        request: {
          name: values.name,
          description: description || null,
          unit: values.unit,
        },
      },
      {
        onSuccess: () => {
          toast.success(t('Catalog.UpdateSuccess'));
          navigate(`/catalog/${productId}`);
        },
      }
    );
  };

  return (
    <div data-slot="catalog-edit-page" className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">{t('Catalog.EditTitle', { name: product.name })}</h2>
        <p className="mt-1 font-mono text-sm text-muted-foreground">{product.sku}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Catalog.Fields.Unit')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
            <Button type="button" variant="ghost" onClick={() => navigate(`/catalog/${productId}`)}>
              {t('Common.Cancel')}
            </Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending && <Loader2 className="size-4 animate-spin" />}
              {t('Common.Save')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
