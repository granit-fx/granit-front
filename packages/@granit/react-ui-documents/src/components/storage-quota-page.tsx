import { QuotaPanel } from '@granit/react-documents';
import { useTranslation } from '@granit/react-localization';

export function StorageQuotaPage() {
  const { t } = useTranslation();

  return (
    <div data-slot="storage-quota-page" className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-foreground">
          {t('documents:Quota.Title', 'Storage usage')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(
            'documents:Quota.Subtitle',
            'Tenant-wide document storage usage against the configured quota.'
          )}
        </p>
      </header>

      <QuotaPanel
        labels={{
          title: t('documents:Quota.Title', 'Storage usage'),
          used: t('documents:Quota.Used', 'Used'),
          limit: t('documents:Quota.Limit', 'Limit'),
          percentUsed: t('documents:Quota.PercentUsed', '% used'),
          updatedAt: t('documents:Quota.UpdatedAt', 'Updated'),
          loading: t('documents:Quota.Loading', 'Loading quota…'),
        }}
      />
    </div>
  );
}
