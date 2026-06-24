import { useTranslation } from '@granit/react-localization';
import { useCreateMeterDefinition, useMetersQuery } from '@granit/react-metering';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  toast,
} from '@granit/react-ui';
import { QueryEndpointDataTable } from '@granit/react-ui-kit';
import { Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { createMeterColumns } from './components/meter-columns';
import { MeterForm } from './components/meter-form';

import type { MeterFormValues } from './components/meter-form';
import type { AggregationType } from '@granit/metering';

// The meter catalog grid is driven by the query-engine endpoint, which needs a
// `QueryProvider` — wired by `MeteringProvider` in the host tree (the same way
// `MeterDetailPage` / `MeteringUsagePage` resolve the Axios client). The page
// does NOT wrap its own provider; it assumes an enclosing `MeteringProvider`.
export function MeterListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);

  // Query-engine surface: server-side pagination/filter/sort lives in the shared
  // reducer (wired by MeteringProvider). Lists ALL meters (not just Published).
  const queryEndpoint = useMetersQuery();
  const createMeter = useCreateMeterDefinition();

  const handleViewDetail = useCallback(
    (id: string) => {
      navigate(`/metering/${id}`);
    },
    [navigate]
  );

  const columns = useMemo(
    () => createMeterColumns({ t, onViewDetail: handleViewDetail }),
    [t, handleViewDetail]
  );

  const handleCreate = async (data: MeterFormValues) => {
    // `mutate` (not `mutateAsync`) routes failures to the global
    // MutationCache.onError toast — no local catch needed.
    createMeter.mutate(
      {
        name: data.name,
        description: data.description,
        aggregationType: data.aggregationType as AggregationType,
        unit: data.unit,
      },
      {
        onSuccess: () => {
          toast.success(t('Metering.CreateSuccess'));
          setCreateOpen(false);
        },
      }
    );
  };

  return (
    <div data-slot="meter-list-page" className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{t('Metering.List.Title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('Metering.List.Description')}</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('Metering.Actions.Create')}
        </Button>
      </div>

      {/* Data table */}
      <QueryEndpointDataTable queryEndpoint={queryEndpoint} columns={columns} />

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('Metering.Form.CreateTitle')}</DialogTitle>
            <DialogDescription>{t('Metering.Form.CreateDescription')}</DialogDescription>
          </DialogHeader>
          <MeterForm
            mode="create"
            onSubmit={handleCreate}
            onCancel={() => setCreateOpen(false)}
            isPending={createMeter.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
