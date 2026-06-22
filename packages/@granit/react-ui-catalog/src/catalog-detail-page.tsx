import { useProduct } from '@granit/react-catalog';
import { useTranslation } from '@granit/react-localization';
import { Button, Card, CardContent, CardHeader, CardTitle, Spinner } from '@granit/react-ui';
import { toEntityId } from '@granit/types';
import { ArrowLeft, Pencil } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { ExternalMappingsManager } from './components/external-mappings-manager';
import { LifecycleActions } from './components/lifecycle-actions';
import { LifecycleStatusBadge } from './components/lifecycle-status-badge';
import { MetadataEditor } from './components/metadata-editor';

import type { ProductId } from '@granit/catalog';

export function CatalogDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const productId = id ? (toEntityId<'Product'>(id) as ProductId) : null;

  const { data: product, isLoading, error } = useProduct(productId);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (error || !product) {
    return <p className="text-sm text-muted-foreground">{t('Catalog.NotFound')}</p>;
  }

  const canEdit = product.lifecycleStatus === 'Draft';

  return (
    <div data-slot="catalog-detail-page" className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/catalog')} className="mb-2">
            <ArrowLeft className="size-4" />
            {t('Catalog.BackToList')}
          </Button>
          <h2 className="text-2xl font-semibold">{product.name}</h2>
          <p className="font-mono text-sm text-muted-foreground">{product.sku}</p>
          <div className="mt-2">
            <LifecycleStatusBadge status={product.lifecycleStatus} />
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button variant="outline" onClick={() => navigate(`/catalog/${product.id}/edit`)}>
              <Pencil className="size-4" />
              {t('Common.Edit')}
            </Button>
          )}
          <LifecycleActions product={product} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('Catalog.Section.Info')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">
              {t('Catalog.Fields.Type')}
            </p>
            <p>{product.type}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">
              {t('Catalog.Fields.Unit')}
            </p>
            <p>{product.unit}</p>
          </div>
          <div className="md:col-span-3">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              {t('Catalog.Fields.Description')}
            </p>
            <p>{product.description ?? t('Common.NotSet')}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('Catalog.Section.Metadata')}</CardTitle>
        </CardHeader>
        <CardContent>
          <MetadataEditor product={product} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('Catalog.Section.ExternalMappings')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ExternalMappingsManager product={product} />
        </CardContent>
      </Card>
    </div>
  );
}
