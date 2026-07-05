import { IotTelemetryProvider, useTelemetryQuery } from '@granit/react-iot';
import { useDateFormatter, useTranslation } from '@granit/react-localization';
import { QueryEndpointDataTable } from '@granit/react-ui-kit';
import { useMemo } from 'react';

import type { TelemetryPoint } from '@granit/iot';
import type { ColumnDef } from '@tanstack/react-table';

/**
 * Telemetry explorer grid. The telemetry QueryEngine scope (a sibling surface to
 * the device fleet grid served by `IotProvider`) is wired by the headless
 * {@link IotTelemetryProvider}; this page just renders the query-engine data table.
 */
export function TelemetryPage() {
  return (
    <IotTelemetryProvider>
      <TelemetryContent />
    </IotTelemetryProvider>
  );
}

function TelemetryContent() {
  const { t } = useTranslation();
  const { formatDateTime } = useDateFormatter();
  const queryEndpoint = useTelemetryQuery();

  const columns = useMemo<ColumnDef<TelemetryPoint, unknown>[]>(
    () => [
      {
        id: 'deviceId',
        accessorKey: 'deviceId',
        header: t('IoT.Telemetry.Columns.Device'),
        enableSorting: true,
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">{row.original.deviceId}</span>
        ),
      },
      {
        id: 'recordedAt',
        accessorKey: 'recordedAt',
        header: t('IoT.Telemetry.Columns.RecordedAt'),
        enableSorting: true,
        cell: ({ row }) => (
          <span className="text-sm text-foreground">{formatDateTime(row.original.recordedAt)}</span>
        ),
      },
      {
        id: 'source',
        accessorKey: 'source',
        header: t('IoT.Telemetry.Columns.Source'),
        enableSorting: true,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.source ?? '—'}</span>
        ),
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        header: t('IoT.Telemetry.Columns.IngestedAt'),
        enableSorting: true,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDateTime(row.original.createdAt)}
          </span>
        ),
      },
    ],
    [t, formatDateTime]
  );

  return (
    <div data-slot="telemetry-page" className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{t('IoT.Telemetry.Title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('IoT.Telemetry.Description')}</p>
      </div>

      <QueryEndpointDataTable queryEndpoint={queryEndpoint} columns={columns} />
    </div>
  );
}
