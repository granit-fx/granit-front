import { useDevicesQuery, useProvisionDevice } from '@granit/react-iot';
import { useDateFormatter, useTranslation } from '@granit/react-localization';
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
import { useNavigate } from 'react-router';

import { createDeviceColumns } from './device-columns';
import { DeviceForm } from './device-form';

import type { DeviceFormValues } from './device-form';

// The device fleet grid is driven by the query-engine endpoint, which needs a
// `QueryProvider` — wired by `IotProvider` in the host tree (the same way
// `DeviceDetailPage` resolves the Axios client). The page does NOT wrap its own
// provider; it assumes an enclosing `IotProvider`.
export function DeviceListPage() {
  const { t } = useTranslation();
  const { formatDateTime } = useDateFormatter();
  const navigate = useNavigate();
  const [provisionOpen, setProvisionOpen] = useState(false);

  const queryEndpoint = useDevicesQuery();
  const provisionDevice = useProvisionDevice();

  const handleViewDetail = useCallback(
    (id: string) => {
      navigate(`/iot/devices/${id}`);
    },
    [navigate]
  );

  const columns = useMemo(
    () => createDeviceColumns({ t, formatDateTime, onViewDetail: handleViewDetail }),
    [t, formatDateTime, handleViewDetail]
  );

  const handleProvision = async (data: DeviceFormValues) => {
    // `mutate` (not `mutateAsync`) routes failures to the global
    // MutationCache.onError toast — no local catch needed.
    provisionDevice.mutate(
      {
        serialNumber: data.serialNumber,
        hardwareModel: data.hardwareModel,
        firmwareVersion: data.firmwareVersion,
        label: data.label.length > 0 ? data.label : null,
      },
      {
        onSuccess: () => {
          toast.success(t('IoT.ProvisionSuccess'));
          setProvisionOpen(false);
        },
      }
    );
  };

  return (
    <div data-slot="device-list-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{t('IoT.List.Title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('IoT.List.Description')}</p>
        </div>
        <Button size="sm" onClick={() => setProvisionOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('IoT.Actions.Provision')}
        </Button>
      </div>

      <QueryEndpointDataTable queryEndpoint={queryEndpoint} columns={columns} />

      <Dialog open={provisionOpen} onOpenChange={setProvisionOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('IoT.Form.ProvisionTitle')}</DialogTitle>
            <DialogDescription>{t('IoT.Form.ProvisionDescription')}</DialogDescription>
          </DialogHeader>
          <DeviceForm
            mode="provision"
            onSubmit={handleProvision}
            onCancel={() => setProvisionOpen(false)}
            isPending={provisionDevice.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
