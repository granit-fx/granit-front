import { DATE_OPERATORS, ENUM_OPERATORS, STRING_OPERATORS } from '@granit/query-engine';
import { createQueryMetaHandler } from '@granit/react-query-engine/testing';
import { noContent, notFound } from '@granit/testing/msw';
import { toEntityId, toISODateString } from '@granit/types';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import {
  sampleDeviceEntities,
  sampleDevices,
  sampleLatestTelemetry,
  sampleTelemetryAggregate,
  sampleTelemetryEntities,
} from './data';

import type { DeviceResponse } from '@granit/iot';
import type { QueryMetadata } from '@granit/query-engine';

const DEVICE_STATUSES = ['Provisioning', 'Active', 'Suspended', 'Decommissioned'];

/** Mock /meta payload for the device fleet grid (`GET /devices`). */
export const deviceQueryMetadata: QueryMetadata = {
  columns: [
    {
      name: 'id',
      label: 'ID',
      type: 'Guid',
      order: 0,
      isSortable: false,
      isFilterable: false,
      isVisible: false,
    },
    {
      name: 'serialNumber',
      label: 'Serial number',
      type: 'String',
      order: 1,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'model',
      label: 'Model',
      type: 'String',
      order: 2,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'firmware',
      label: 'Firmware',
      type: 'String',
      order: 3,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'String',
      order: 4,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'label',
      label: 'Label',
      type: 'String',
      order: 5,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'lastHeartbeatAt',
      label: 'Last heartbeat',
      type: 'DateTime',
      order: 6,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'tenantId',
      label: 'Tenant',
      type: 'Guid',
      order: 7,
      isSortable: false,
      isFilterable: true,
      isVisible: false,
    },
    {
      name: 'createdAt',
      label: 'Created at',
      type: 'DateTime',
      order: 8,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'modifiedAt',
      label: 'Modified at',
      type: 'DateTime',
      order: 9,
      isSortable: true,
      isFilterable: true,
      isVisible: false,
    },
  ],
  filterableFields: [
    { name: 'serialNumber', type: 'String', operators: STRING_OPERATORS },
    { name: 'model', type: 'String', operators: STRING_OPERATORS },
    { name: 'firmware', type: 'String', operators: STRING_OPERATORS },
    { name: 'status', type: 'String', operators: ENUM_OPERATORS, enumValues: DEVICE_STATUSES },
    { name: 'label', type: 'String', operators: STRING_OPERATORS },
    { name: 'lastHeartbeatAt', type: 'DateTime', operators: DATE_OPERATORS },
    { name: 'tenantId', type: 'Guid', operators: ENUM_OPERATORS },
    { name: 'createdAt', type: 'DateTime', operators: DATE_OPERATORS },
  ],
  sortableFields: [
    { name: 'serialNumber' },
    { name: 'model' },
    { name: 'firmware' },
    { name: 'status' },
    { name: 'label' },
    { name: 'lastHeartbeatAt' },
    { name: 'createdAt' },
  ],
  presetFilterGroups: [],
  quickFilters: [
    { name: 'active', label: 'Active', isDefault: true },
    { name: 'provisioning', label: 'Provisioning', isDefault: false },
    { name: 'suspended', label: 'Suspended', isDefault: false },
    { name: 'decommissioned', label: 'Decommissioned', isDefault: false },
  ],
  dateFilters: [],
  groupByFields: [
    { name: 'status', type: 'String' },
    { name: 'model', type: 'String' },
    { name: 'firmware', type: 'String' },
  ],
  pagination: {
    defaultPageSize: 25,
    maxPageSize: 100,
    maxStreamSize: 10_000,
    supportsCursor: false,
  },
  defaultSort: '-createdAt',
};

/** Mock /meta payload for the telemetry grid (`GET /telemetry`). */
export const telemetryQueryMetadata: QueryMetadata = {
  columns: [
    {
      name: 'id',
      label: 'ID',
      type: 'Guid',
      order: 0,
      isSortable: false,
      isFilterable: false,
      isVisible: false,
    },
    {
      name: 'deviceId',
      label: 'Device',
      type: 'Guid',
      order: 1,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'recordedAt',
      label: 'Recorded at',
      type: 'DateTime',
      order: 2,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'source',
      label: 'Source',
      type: 'String',
      order: 3,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'messageId',
      label: 'Message ID',
      type: 'String',
      order: 4,
      isSortable: false,
      isFilterable: true,
      isVisible: false,
    },
    {
      name: 'tenantId',
      label: 'Tenant',
      type: 'Guid',
      order: 5,
      isSortable: false,
      isFilterable: true,
      isVisible: false,
    },
    {
      name: 'createdAt',
      label: 'Ingested at',
      type: 'DateTime',
      order: 6,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
  ],
  filterableFields: [
    { name: 'deviceId', type: 'Guid', operators: ENUM_OPERATORS },
    { name: 'recordedAt', type: 'DateTime', operators: DATE_OPERATORS },
    { name: 'source', type: 'String', operators: STRING_OPERATORS },
    { name: 'messageId', type: 'String', operators: STRING_OPERATORS },
    { name: 'tenantId', type: 'Guid', operators: ENUM_OPERATORS },
    { name: 'createdAt', type: 'DateTime', operators: DATE_OPERATORS },
  ],
  sortableFields: [
    { name: 'deviceId' },
    { name: 'recordedAt' },
    { name: 'source' },
    { name: 'createdAt' },
  ],
  presetFilterGroups: [],
  quickFilters: [],
  dateFilters: [],
  groupByFields: [
    { name: 'deviceId', type: 'Guid' },
    { name: 'source', type: 'String' },
  ],
  pagination: {
    defaultPageSize: 25,
    maxPageSize: 100,
    maxStreamSize: 50_000,
    supportsCursor: true,
  },
  defaultSort: '-recordedAt',
};

/**
 * Create stateful MSW handlers for IoT endpoints. Device mutations (provision /
 * update / decommission) persist in the in-memory list.
 *
 * @param baseUrl - API base path (default: `/api/v1/iot`)
 */
export function createIotHandlers(baseUrl = DEFAULT_BASE_PATH) {
  let devices = [...sampleDevices];

  return [
    // GET /devices/meta — QueryEngine metadata (registered before /devices/:id)
    createQueryMetaHandler(`${baseUrl}/devices`, deviceQueryMetadata),

    // GET /devices — QueryEngine admin grid (paged)
    http.get(`${baseUrl}/devices`, () => {
      return HttpResponse.json({
        items: sampleDeviceEntities,
        totalCount: sampleDeviceEntities.length,
        hasMore: false,
      });
    }),

    // POST /devices — provision (starts in Provisioning)
    http.post(`${baseUrl}/devices`, async ({ request }) => {
      const body = (await request.json()) as Partial<DeviceResponse>;
      const newDevice: DeviceResponse = {
        id: toEntityId<'Device'>(`dev_${String(devices.length + 1).padStart(3, '0')}`),
        serialNumber: body.serialNumber ?? '',
        hardwareModel: body.hardwareModel ?? '',
        firmwareVersion: body.firmwareVersion ?? '',
        status: 'Provisioning',
        label: body.label ?? null,
        lastHeartbeatAt: null,
        createdAt: toISODateString('2026-07-05T00:00:00Z'),
        modifiedAt: null,
        concurrencyStamp: `stamp-${devices.length + 1}`,
      };
      devices = [...devices, newDevice];
      return HttpResponse.json(newDevice, { status: 201 });
    }),

    // GET /devices/:id — single device
    http.get(`${baseUrl}/devices/:id`, ({ params }) => {
      const device = devices.find((d) => d.id === params.id);
      if (!device) return notFound();
      return HttpResponse.json(device);
    }),

    // PUT /devices/:id — update firmware/label
    http.put(`${baseUrl}/devices/:id`, async ({ params, request }) => {
      const id = params.id as string;
      const body = (await request.json()) as Partial<DeviceResponse>;
      const existing = devices.find((d) => d.id === id);
      if (!existing) return notFound();

      const updated: DeviceResponse = {
        ...existing,
        firmwareVersion: body.firmwareVersion ?? existing.firmwareVersion,
        label: body.label ?? existing.label,
        modifiedAt: toISODateString('2026-07-05T12:00:00Z'),
        concurrencyStamp: `${existing.concurrencyStamp}-x`,
      };
      devices = devices.map((d) => (d.id === id ? updated : d));
      return HttpResponse.json(updated);
    }),

    // DELETE /devices/:id — decommission
    http.delete(`${baseUrl}/devices/:id`, ({ params }) => {
      const id = params.id as string;
      const existing = devices.find((d) => d.id === id);
      if (!existing) return notFound();
      devices = devices.map((d) => (d.id === id ? { ...d, status: 'Decommissioned' } : d));
      return noContent();
    }),

    // GET /telemetry/meta — QueryEngine metadata
    createQueryMetaHandler(`${baseUrl}/telemetry`, telemetryQueryMetadata),

    // GET /telemetry — QueryEngine grid (paged)
    http.get(`${baseUrl}/telemetry`, () => {
      return HttpResponse.json({
        items: sampleTelemetryEntities,
        totalCount: sampleTelemetryEntities.length,
        hasMore: false,
      });
    }),

    // GET /telemetry/:deviceId/latest — most recent point
    http.get(`${baseUrl}/telemetry/:deviceId/latest`, ({ params }) => {
      return HttpResponse.json({
        ...sampleLatestTelemetry,
        deviceId: toEntityId<'Device'>(
          (params.deviceId as string) ?? sampleLatestTelemetry.deviceId
        ),
      });
    }),

    // GET /telemetry/:deviceId/aggregate — metric aggregate over a range
    http.get(`${baseUrl}/telemetry/:deviceId/aggregate`, ({ request }) => {
      const url = new URL(request.url);
      return HttpResponse.json({
        ...sampleTelemetryAggregate,
        metricName: url.searchParams.get('metric') ?? sampleTelemetryAggregate.metricName,
        aggregation:
          (url.searchParams.get('aggregation') as typeof sampleTelemetryAggregate.aggregation) ??
          sampleTelemetryAggregate.aggregation,
      });
    }),
  ];
}
