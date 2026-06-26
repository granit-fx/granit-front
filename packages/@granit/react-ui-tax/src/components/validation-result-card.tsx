import { useDateFormatter, useTranslation } from '@granit/react-localization';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@granit/react-ui';
import { cn } from '@granit/utils';

import type { TaxValidateResponse } from '@granit/tax';

interface ValidationResultCardProps {
  readonly result: TaxValidateResponse;
}

export function ValidationResultCard({ result }: ValidationResultCardProps) {
  const { t } = useTranslation();
  const { formatDateTime } = useDateFormatter();

  return (
    <Card data-slot="validation-result-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('Tax.Validate.ResultTitle')}</CardTitle>
          <Badge
            variant={result.isValid ? 'default' : 'destructive'}
            className={cn(
              'text-xs',
              result.isValid ? 'bg-success-500/15 text-success border-success-500/25' : ''
            )}
          >
            {result.isValid ? t('Tax.Validate.Valid') : t('Tax.Validate.Invalid')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3">
          {result.companyName && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                {t('Tax.Validate.CompanyName')}
              </dt>
              <dd className="text-sm text-foreground">{result.companyName}</dd>
            </div>
          )}
          {result.companyAddress && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                {t('Tax.Validate.CompanyAddress')}
              </dt>
              <dd className="text-sm text-foreground">{result.companyAddress}</dd>
            </div>
          )}
          {result.requestIdentifier && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                {t('Tax.Validate.RequestIdentifier')}
              </dt>
              <dd className="font-mono text-sm text-foreground">{result.requestIdentifier}</dd>
            </div>
          )}
          {result.validatedAt && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                {t('Tax.Validate.ValidatedAt')}
              </dt>
              <dd className="text-sm text-foreground">{formatDateTime(result.validatedAt)}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-medium text-muted-foreground">
              {t('Tax.Validate.Source')}
            </dt>
            <dd className="text-sm text-foreground">{result.source}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
