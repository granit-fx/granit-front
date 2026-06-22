import { useGranitClient } from '@granit/react-api-client';
import { FeaturesProvider, useFeatureDefinitions, useFeatureValue } from '@granit/react-features';
import { useTranslation } from '@granit/react-localization';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Spinner } from '@granit/react-ui';
import { ArrowLeft } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { FeatureValueBadge } from './components/feature-value-badge';
import { SetOverrideDialog } from './components/set-override-dialog';

import type { ReactNode } from 'react';

export function FeatureDetailPage() {
  // The Axios client is resolved from the GranitClientProvider in the host tree
  // and handed to the headless data provider — no `@/lib/api` coupling.
  const client = useGranitClient();
  return (
    <FeaturesProvider config={{ client }}>
      <FeatureDetailPageContent />
    </FeaturesProvider>
  );
}

function FeatureDetailPageContent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { name } = useParams<{ name: string }>();
  const decodedName = name ? decodeURIComponent(name) : '';

  const { data: groups, isLoading: isLoadingDefs } = useFeatureDefinitions();
  const { data: featureValue, isLoading: isLoadingValue } = useFeatureValue(decodedName);

  const definition = useMemo(() => {
    if (!groups) return undefined;
    return groups.flatMap((g) => g.features).find((f) => f.name === decodedName);
  }, [groups, decodedName]);

  const isLoading = isLoadingDefs || isLoadingValue;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!definition || !featureValue) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">{t('Features.Detail.NotFound')}</h2>
        <Button variant="outline" onClick={() => navigate('/features')}>
          <ArrowLeft className="mr-2 size-4" />
          {t('Features.Detail.BackToList')}
        </Button>
      </div>
    );
  }

  return (
    <div data-slot="feature-detail-page" className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/features')}>
          <ArrowLeft className="mr-1 size-4" />
          {t('Features.Detail.BackToList')}
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-foreground">
              {definition.displayName ?? definition.name}
            </h2>
            <FeatureValueBadge definition={definition} value={featureValue.value} />
          </div>
          <p className="text-sm text-muted-foreground">{definition.description}</p>
        </div>
        <SetOverrideDialog definition={definition} currentValue={featureValue} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('Features.Detail.Definition')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label={t('Features.Detail.Name')} value={definition.name} />
            <InfoRow label={t('Features.Detail.Type')} value={definition.valueType} />
            <InfoRow label={t('Features.Detail.DefaultValue')} value={definition.defaultValue} />
            {definition.numericConstraint && (
              <InfoRow
                label={t('Features.Detail.Range')}
                value={`${definition.numericConstraint.min} - ${definition.numericConstraint.max}`}
              />
            )}
            {definition.selectionValues && definition.selectionValues.length > 0 && (
              <InfoRow
                label={t('Features.Detail.AllowedValues')}
                value={
                  <div className="flex flex-wrap gap-1">
                    {definition.selectionValues.map((v) => (
                      <Badge key={v} variant="outline" className="text-xs">
                        {v}
                      </Badge>
                    ))}
                  </div>
                }
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('Features.Detail.CurrentState')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow
              label={t('Features.Detail.CurrentValue')}
              value={<FeatureValueBadge definition={definition} value={featureValue.value} />}
            />
            <InfoRow label={t('Features.Detail.DefaultValue')} value={definition.defaultValue} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: Readonly<{ label: string; value: ReactNode }>) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
