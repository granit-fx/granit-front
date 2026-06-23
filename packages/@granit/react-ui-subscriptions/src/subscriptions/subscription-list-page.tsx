import { useDateFormatter, useTranslation } from '@granit/react-localization';
import { QueryProvider, useQueryEndpoint, useQueryMeta } from '@granit/react-query-engine';
import { useActivePlans } from '@granit/react-subscriptions';
import { Button } from '@granit/react-ui';
import { QueryControlBar, QueryEndpointDataTable } from '@granit/react-ui-admin-kit';
import { Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { CreateSubscriptionDialog } from './components/create-subscription-dialog';
import { createSubscriptionColumns } from './components/subscription-columns';

import type { QueryConfig } from '@granit/query-engine';
import type { SubscriptionResponse } from '@granit/subscriptions';

const QUERY_CONFIG: QueryConfig = {
  basePath: '/api/v1/subscriptions/subscriptions',
};

function SubscriptionListContent() {
  const { t } = useTranslation();
  const { formatDate } = useDateFormatter();
  const navigate = useNavigate();
  const meta = useQueryMeta();
  const { data: plans } = useActivePlans();
  const [createOpen, setCreateOpen] = useState(false);

  const planNames = useMemo(() => {
    if (!plans) return undefined;
    return new Map(plans.map((plan) => [plan.id, plan.name]));
  }, [plans]);

  const queryEndpoint = useQueryEndpoint<SubscriptionResponse>({
    initialParams: {
      page: 1,
      pageSize: 20,
      sort: [{ field: 'currentPeriodStart', direction: 'desc' }],
    },
  });

  const handleView = useCallback(
    (subscription: { id: string }) => {
      navigate(`/subscriptions/${subscription.id}`);
    },
    [navigate]
  );

  const columns = useMemo(
    () => createSubscriptionColumns({ t, onView: handleView, planNames, formatDate }),
    [t, handleView, planNames, formatDate]
  );

  return (
    <div data-slot="subscription-list-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            {t('Subscriptions.List.Title')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('Subscriptions.List.Subtitle')}</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('Subscriptions.List.Create')}
        </Button>
      </div>

      {meta.data && (
        <QueryControlBar
          meta={meta.data}
          queryEndpoint={queryEndpoint}
          recordLabel={t('Subscriptions.List.Records', 'subscriptions')}
        />
      )}

      <QueryEndpointDataTable queryEndpoint={queryEndpoint} columns={columns} />

      <CreateSubscriptionDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

export function SubscriptionListPage() {
  return (
    <QueryProvider config={QUERY_CONFIG}>
      <SubscriptionListContent />
    </QueryProvider>
  );
}
