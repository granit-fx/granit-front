import { useTranslation } from '@granit/react-localization';
import { QueryProvider } from '@granit/react-query-engine';
import { Button } from '@granit/react-ui';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router';

import { WebhookSubscriptionTable } from './components/webhook-subscription-table';
import { SUBSCRIPTIONS_QUERY_CONFIG } from './constants';

export function WebhookListPage() {
  return (
    <QueryProvider config={SUBSCRIPTIONS_QUERY_CONFIG}>
      <WebhooksPageContent />
    </QueryProvider>
  );
}

function WebhooksPageContent() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div data-slot="webhook-list-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{t('Webhooks.Title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('Webhooks.Subtitle')}</p>
        </div>
        <Button size="sm" onClick={() => navigate('/webhooks/new')}>
          <Plus className="mr-2 h-4 w-4" />
          {t('Webhooks.Create')}
        </Button>
      </div>

      <WebhookSubscriptionTable />
    </div>
  );
}
