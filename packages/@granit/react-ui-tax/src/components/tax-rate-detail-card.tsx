import { useDateFormatter, useTranslation } from '@granit/react-localization';
import { useTaxRateByCountry } from '@granit/react-tax';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@granit/react-ui';

interface TaxRateDetailCardProps {
  readonly countryCode: string;
}

export function TaxRateDetailCard({ countryCode }: TaxRateDetailCardProps) {
  const { t } = useTranslation();
  const { formatDate } = useDateFormatter();
  const { data: rate, isLoading } = useTaxRateByCountry(countryCode);

  if (isLoading) {
    return (
      <Card data-slot="tax-rate-detail-card">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={`skeleton-${i}`} className="h-4 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!rate) {
    return (
      <Card data-slot="tax-rate-detail-card">
        <CardContent className="py-8 text-center text-muted-foreground">
          {t('Tax.Rates.NotFound')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-slot="tax-rate-detail-card">
      <CardHeader>
        <CardTitle>{rate.countryCode}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">
              {t('Tax.Rates.Columns.StandardRate')}
            </dt>
            <dd className="text-lg font-semibold text-foreground">{rate.standardRate}%</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">
              {t('Tax.Rates.Columns.ReducedRate')}
            </dt>
            <dd className="text-lg font-semibold text-foreground">
              {rate.reducedRate == null ? '—' : `${rate.reducedRate}%`}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">
              {t('Tax.Rates.Detail.SuperReducedRate')}
            </dt>
            <dd className="text-lg font-semibold text-foreground">
              {rate.superReducedRate == null ? '—' : `${rate.superReducedRate}%`}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">
              {t('Tax.Rates.Detail.ParkingRate')}
            </dt>
            <dd className="text-lg font-semibold text-foreground">
              {rate.parkingRate == null ? '—' : `${rate.parkingRate}%`}
            </dd>
          </div>
          {rate.effectiveFrom != null && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                {t('Tax.Rates.Detail.EffectiveFrom')}
              </dt>
              <dd className="text-lg font-semibold text-foreground">
                {formatDate(rate.effectiveFrom)}
              </dd>
            </div>
          )}
          {rate.effectiveTo != null && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                {t('Tax.Rates.Detail.EffectiveTo')}
              </dt>
              <dd className="text-lg font-semibold text-foreground">
                {formatDate(rate.effectiveTo)}
              </dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}
