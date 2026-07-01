import { useTranslation } from '@granit/react-localization';
import { useValidateTaxId } from '@granit/react-tax';
import { Card, CardContent, CardHeader, CardTitle } from '@granit/react-ui';

import { ValidateTaxForm, type TaxValidateFormValues } from './validate-tax-form';
import { ValidationResultCard } from './validation-result-card';

export function TaxValidatePage() {
  const { t } = useTranslation();
  const validateMutation = useValidateTaxId();

  const handleSubmit = (data: TaxValidateFormValues) => {
    validateMutation.mutate({
      taxId: data.taxId,
      countryCode: data.countryCode,
    });
  };

  return (
    <div data-slot="tax-validate-page" className="mx-auto max-w-2xl space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{t('Tax.Validate.Title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('Tax.Validate.Subtitle')}</p>
      </div>

      {/* Validation form */}
      <Card>
        <CardHeader>
          <CardTitle>{t('Tax.Validate.FormTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ValidateTaxForm onSubmit={handleSubmit} isPending={validateMutation.isPending} />
        </CardContent>
      </Card>

      {/* Validation result */}
      {validateMutation.isSuccess && validateMutation.data && (
        <ValidationResultCard result={validateMutation.data} />
      )}
    </div>
  );
}
