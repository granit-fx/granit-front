import { useDevice, useUpdateDevice } from '@granit/react-iot';
import { useDateFormatter, useTranslation } from '@granit/react-localization';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Skeleton,
  toast,
} from '@granit/react-ui';
import { cn } from '@granit/utils';
import { ArrowLeft, Pencil, Power } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { DecommissionDeviceDialog } from './decommission-device-dialog';
import { DeviceForm } from './device-form';
import { DeviceTelemetryCard } from './device-telemetry-card';

import type { DeviceFormValues } from './device-form';
import type { DeviceStatus } from '@granit/iot';

function statusClasses(status: DeviceStatus): string {
  switch (status) {
    case 'Active':
      return 'bg-success-500/15 text-success border-success-500/25';
    case 'Suspended':
      return 'bg-warning-500/15 text-warning border-warning-500/25';
    case 'Decommissioned':
      return 'bg-destructive/10 text-destructive border-destructive/25';
    default:
      return 'bg-muted/50 text-muted-foreground';
  }
}

export function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { formatDateTime } = useDateFormatter();
  const navigate = useNavigate();

  const [editOpen, setEditOpen] = useState(false);
  const [decommissionOpen, setDecommissionOpen] = useState(false);

  const deviceId = id ?? '';
  const { data: device, isLoading } = useDevice(deviceId);
  const updateDevice = useUpdateDevice();

  const handleUpdate = async (data: DeviceFormValues) => {
    if (!device) return;
    updateDevice.mutate(
      {
        id: device.id,
        request: {
          concurrencyStamp: device.concurrencyStamp,
          firmwareVersion: data.firmwareVersion,
          label: data.label.length > 0 ? data.label : null,
        },
      },
      {
        onSuccess: () => {
          toast.success(t('IoT.UpdateSuccess'));
          setEditOpen(false);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div data-slot="device-detail-page" className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!device) {
    return (
      <div data-slot="device-detail-page" className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">{t('IoT.Detail.NotFound')}</p>
      </div>
    );
  }

  const isDecommissioned = device.status === 'Decommissioned';

  return (
    <div data-slot="device-detail-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/iot/devices')}
            aria-label={t('Common.Back')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold text-foreground">
                {device.label ?? device.serialNumber}
              </h2>
              <Badge variant="secondary" className={cn('text-xs', statusClasses(device.status))}>
                {t(`IoT.Status.${device.status}`)}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{device.serialNumber}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditOpen(true)}
            disabled={isDecommissioned}
          >
            <Pencil className="mr-2 h-4 w-4" />
            {t('IoT.Actions.Edit')}
          </Button>
          {!isDecommissioned && (
            <Button variant="destructive" size="sm" onClick={() => setDecommissionOpen(true)}>
              <Power className="mr-2 h-4 w-4" />
              {t('IoT.Actions.Decommission')}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card data-slot="device-info-card">
          <CardHeader>
            <CardTitle className="text-base">{t('IoT.Detail.InfoTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  {t('IoT.Detail.SerialNumber')}
                </dt>
                <dd className="mt-1 text-sm text-foreground">{device.serialNumber}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  {t('IoT.Detail.Model')}
                </dt>
                <dd className="mt-1 text-sm text-foreground">{device.hardwareModel}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  {t('IoT.Detail.Firmware')}
                </dt>
                <dd className="mt-1 text-sm text-foreground">{device.firmwareVersion}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  {t('IoT.Detail.LastHeartbeat')}
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {device.lastHeartbeatAt
                    ? formatDateTime(device.lastHeartbeatAt)
                    : t('IoT.Detail.Never')}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  {t('IoT.Detail.CreatedAt')}
                </dt>
                <dd className="mt-1 text-sm text-foreground">{formatDateTime(device.createdAt)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <DeviceTelemetryCard deviceId={device.id} />
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('IoT.Form.EditTitle')}</DialogTitle>
            <DialogDescription>{t('IoT.Form.EditDescription')}</DialogDescription>
          </DialogHeader>
          <DeviceForm
            mode="edit"
            defaultValues={device}
            onSubmit={handleUpdate}
            onCancel={() => setEditOpen(false)}
            isPending={updateDevice.isPending}
          />
        </DialogContent>
      </Dialog>

      <DecommissionDeviceDialog
        device={device}
        open={decommissionOpen}
        onOpenChange={setDecommissionOpen}
        onSuccess={() => navigate('/iot/devices')}
      />
    </div>
  );
}
