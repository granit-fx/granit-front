import { useTranslation } from '@granit/react-localization';
import { useApplicableRegulation, useProcessingPurposes } from '@granit/react-privacy';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@granit/react-ui';
import { Loader2 } from 'lucide-react';

function RegulationField({ label, value }: Readonly<{ label: string; value: React.ReactNode }>) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{value}</dd>
    </div>
  );
}

export function PrivacyRegulationPage() {
  const { t } = useTranslation();
  const { data: regulation, isLoading: isLoadingRegulation } = useApplicableRegulation();
  const { data: purposes, isLoading: isLoadingPurposes } = useProcessingPurposes();

  return (
    <div data-slot="privacy-regulation-page" className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          {t('Privacy.Regulation.Title', 'Privacy Regulation')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(
            'Privacy.Regulation.Subtitle',
            'Active regulation profile and data processing purposes for this tenant.'
          )}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('Privacy.Regulation.ProfileTitle', 'Regulation Profile')}</CardTitle>
          <CardDescription>
            {t(
              'Privacy.Regulation.ProfileDescription',
              "Read-only profile derived from the tenant's jurisdiction."
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingRegulation && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {regulation && (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <RegulationField
                label={t('Privacy.Regulation.Field.Regulation', 'Regulation')}
                value={regulation.regulation}
              />
              <RegulationField
                label={t('Privacy.Regulation.Field.DisplayName', 'Display Name')}
                value={regulation.displayName}
              />
              <RegulationField
                label={t('Privacy.Regulation.Field.Jurisdiction', 'Jurisdiction')}
                value={regulation.jurisdictionCode}
              />
              <RegulationField
                label={t('Privacy.Regulation.Field.ConsentModel', 'Consent Model')}
                value={regulation.consentModel}
              />
              <RegulationField
                label={t('Privacy.Regulation.Field.CookieConsent', 'Cookie Consent')}
                value={regulation.cookieConsentModel}
              />
              <RegulationField
                label={t('Privacy.Regulation.Field.MinimumConsentAge', 'Minimum Consent Age')}
                value={t('Privacy.Regulation.Value.Years', {
                  count: regulation.minimumConsentAge,
                  defaultValue: '{{count}} years',
                })}
              />
              <RegulationField
                label={t('Privacy.Regulation.Field.SarDeadline', 'SAR Deadline')}
                value={t('Privacy.Regulation.Value.Days', {
                  count: regulation.subjectAccessRequestDays,
                  defaultValue: '{{count}} days',
                })}
              />
              {regulation.deletionRequestDays !== null && (
                <RegulationField
                  label={t('Privacy.Regulation.Field.DeletionDeadline', 'Deletion Deadline')}
                  value={t('Privacy.Regulation.Value.Days', {
                    count: regulation.deletionRequestDays,
                    defaultValue: '{{count}} days',
                  })}
                />
              )}
              <RegulationField
                label={t('Privacy.Regulation.Field.DefaultDeletionGrace', 'Default Deletion Grace')}
                value={t('Privacy.Regulation.Value.Days', {
                  count: regulation.defaultDeletionGracePeriodDays,
                  defaultValue: '{{count}} days',
                })}
              />
              {regulation.breachNotifyAuthorityHours !== null && (
                <RegulationField
                  label={t(
                    'Privacy.Regulation.Field.BreachNotifyAuthority',
                    'Breach Notify Authority'
                  )}
                  value={t('Privacy.Regulation.Value.Hours', {
                    count: regulation.breachNotifyAuthorityHours,
                    defaultValue: '{{count}} h',
                  })}
                />
              )}
              <RegulationField
                label={t('Privacy.Regulation.Field.DpoRepresentative', 'DPO / Representative')}
                value={
                  regulation.requiresDpoOrRepresentative ? (
                    <Badge variant="default">
                      {t('Privacy.Regulation.Value.Required', 'Required')}
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      {t('Privacy.Regulation.Value.NotRequired', 'Not required')}
                    </Badge>
                  )
                }
              />
              <RegulationField
                label={t('Privacy.Regulation.Field.DataLocalization', 'Data Localization')}
                value={
                  regulation.dataLocalizationRequired ? (
                    <Badge variant="default">
                      {t('Privacy.Regulation.Value.Required', 'Required')}
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      {t('Privacy.Regulation.Value.NotRequired', 'Not required')}
                    </Badge>
                  )
                }
              />
              <RegulationField
                label={t('Privacy.Regulation.Field.HonorGpc', 'Honor GPC')}
                value={
                  regulation.honorGlobalPrivacyControl ? (
                    <Badge variant="default">{t('Privacy.Regulation.Value.Yes', 'Yes')}</Badge>
                  ) : (
                    <Badge variant="outline">{t('Privacy.Regulation.Value.No', 'No')}</Badge>
                  )
                }
              />
              {(regulation.availableLegalBases?.length ?? 0) > 0 &&
                regulation.availableLegalBases && (
                  <div className="col-span-2 sm:col-span-3">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t('Privacy.Regulation.Field.AvailableLegalBases', 'Available Legal Bases')}
                    </dt>
                    <dd className="mt-1 flex flex-wrap gap-1">
                      {regulation.availableLegalBases.map((b) => (
                        <Badge key={b} variant="secondary">
                          {b}
                        </Badge>
                      ))}
                    </dd>
                  </div>
                )}
              {(regulation.requiredExportFormats?.length ?? 0) > 0 &&
                regulation.requiredExportFormats && (
                  <div className="col-span-2 sm:col-span-3">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t(
                        'Privacy.Regulation.Field.RequiredExportFormats',
                        'Required Export Formats'
                      )}
                    </dt>
                    <dd className="mt-1 flex flex-wrap gap-1">
                      {regulation.requiredExportFormats.map((f) => (
                        <Badge key={f} variant="secondary">
                          {f}
                        </Badge>
                      ))}
                    </dd>
                  </div>
                )}
            </dl>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('Privacy.Regulation.PurposesTitle', 'Processing Purposes')}</CardTitle>
          <CardDescription>
            {t(
              'Privacy.Regulation.PurposesDescription',
              'Data processing activities declared for this tenant.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPurposes && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoadingPurposes && (!purposes || purposes.length === 0) && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t('Privacy.Regulation.NoPurposes', 'No processing purposes declared.')}
            </p>
          )}
          {!isLoadingPurposes && purposes && purposes.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Privacy.Regulation.Columns.PurposeId', 'Purpose ID')}</TableHead>
                  <TableHead>
                    {t('Privacy.Regulation.Columns.DisplayName', 'Display Name')}
                  </TableHead>
                  <TableHead>{t('Privacy.Regulation.Columns.LegalBasis', 'Legal Basis')}</TableHead>
                  <TableHead>
                    {t('Privacy.Regulation.Columns.DataCategory', 'Data Category')}
                  </TableHead>
                  <TableHead>
                    {t('Privacy.Regulation.Columns.ExplicitConsent', 'Explicit Consent')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purposes.map((p) => (
                  <TableRow key={p.purposeId}>
                    <TableCell className="font-mono text-sm">{p.purposeId}</TableCell>
                    <TableCell>{p.displayName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{p.legalBasis}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.dataCategory ?? '—'}
                    </TableCell>
                    <TableCell>
                      {p.requiresExplicitConsent ? (
                        <Badge variant="default">
                          {t('Privacy.Regulation.Value.Required', 'Required')}
                        </Badge>
                      ) : (
                        <Badge variant="outline">{t('Privacy.Regulation.Value.No', 'No')}</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
