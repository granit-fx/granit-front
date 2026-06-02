import { getPage } from '@granit/query-engine';
import { createMockClient } from '@granit/testing';
import { toEntityId, toISODateString } from '@granit/types';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@granit/query-engine', () => ({ getPage: vi.fn() }));

import {
  cancelScheduledAction,
  getScheduledActionById,
  listScheduledActions,
  rescheduleScheduledAction,
} from '../api/scheduling-api';
import {
  SCHEDULING_PERMISSIONS,
  SCHEDULING_STATUS_COLORS,
  SCHEDULING_STATUS_LABELS,
} from '../constants';

import type {
  RescheduleActionRequest,
  ScheduledActionId,
  ScheduledActionResponse,
} from '../types/index';
import type { PagedResult } from '@granit/query-engine';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const basePath = '/api/v1/scheduling/actions';

const actionId: ScheduledActionId = toEntityId<'ScheduledAction'>(
  '00000000-0000-0000-0000-000000000001'
);

const sampleAction: ScheduledActionResponse = {
  id: actionId,
  payloadType: 'Granit.Invoicing.SendReminderPayload',
  executeAt: toISODateString('2026-07-01T08:00:00Z'),
  correlationId: null,
  status: 'Pending',
  executedAt: null,
  cancelledBy: null,
  failureReason: null,
  createdAt: toISODateString('2026-06-01T10:00:00Z'),
};

const pagedResult: PagedResult<ScheduledActionResponse> = {
  items: [sampleAction],
  hasMore: false,
  totalCount: 1,
};

// ---------------------------------------------------------------------------
// getScheduledActionById
// ---------------------------------------------------------------------------

describe('getScheduledActionById', () => {
  it('GETs {basePath}/{id}', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleAction });

    const result = await getScheduledActionById(client, basePath, actionId);

    expect(client.get).toHaveBeenCalledWith(`${basePath}/${actionId}`);
    expect(result).toEqual(sampleAction);
  });

  it('returns the unwrapped DTO directly from the response envelope', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleAction });

    const result = await getScheduledActionById(client, basePath, actionId);

    expect(result.id).toBe(actionId);
    expect(result.status).toBe('Pending');
  });
});

// ---------------------------------------------------------------------------
// listScheduledActions
// ---------------------------------------------------------------------------

describe('listScheduledActions', () => {
  it('delegates to getPage with no request when called without arguments', async () => {
    vi.mocked(getPage).mockResolvedValue(pagedResult);

    const client = createMockClient();
    const result = await listScheduledActions(client, basePath);

    expect(getPage).toHaveBeenCalledWith(client, basePath, {});
    expect(result).toEqual(pagedResult);
  });

  it('forwards the QueryRequest to getPage', async () => {
    vi.mocked(getPage).mockResolvedValue(pagedResult);

    const client = createMockClient();
    const request = { page: 2, pageSize: 25, sortBy: 'executeAt' };

    await listScheduledActions(client, basePath, request);

    expect(getPage).toHaveBeenCalledWith(client, basePath, request);
  });

  it('returns the PagedResult produced by getPage', async () => {
    vi.mocked(getPage).mockResolvedValue(pagedResult);

    const client = createMockClient();
    const result = await listScheduledActions(client, basePath);

    expect(result.items).toHaveLength(1);
    expect(result.totalCount).toBe(1);
    expect(result.hasMore).toBe(false);
  });

  it('returns an empty page when getPage resolves with no items', async () => {
    const emptyPage: PagedResult<ScheduledActionResponse> = {
      items: [],
      hasMore: false,
      totalCount: 0,
    };
    vi.mocked(getPage).mockResolvedValue(emptyPage);

    const client = createMockClient();
    const result = await listScheduledActions(client, basePath);

    expect(result.items).toHaveLength(0);
    expect(result.totalCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// cancelScheduledAction
// ---------------------------------------------------------------------------

describe('cancelScheduledAction', () => {
  it('DELETEs {basePath}/{id}', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue({ data: undefined });

    await cancelScheduledAction(client, basePath, actionId);

    expect(client.delete).toHaveBeenCalledWith(`${basePath}/${actionId}`);
  });

  it('resolves to void on success', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue({ data: undefined });

    const result = await cancelScheduledAction(client, basePath, actionId);

    expect(result).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// rescheduleScheduledAction
// ---------------------------------------------------------------------------

describe('rescheduleScheduledAction', () => {
  const request: RescheduleActionRequest = {
    newExecuteAt: toISODateString('2026-08-01T09:00:00Z'),
  };

  const rescheduledAction: ScheduledActionResponse = {
    ...sampleAction,
    executeAt: toISODateString('2026-08-01T09:00:00Z'),
  };

  it('PUTs to {basePath}/{id}/reschedule with the request body', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue({ data: rescheduledAction });

    await rescheduleScheduledAction(client, basePath, actionId, request);

    expect(client.put).toHaveBeenCalledWith(`${basePath}/${actionId}/reschedule`, request);
  });

  it('returns the updated ScheduledActionResponse', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue({ data: rescheduledAction });

    const result = await rescheduleScheduledAction(client, basePath, actionId, request);

    expect(result).toEqual(rescheduledAction);
    expect(result.executeAt).toBe('2026-08-01T09:00:00Z');
  });

  it('preserves the action id and status from the server response', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue({ data: rescheduledAction });

    const result = await rescheduleScheduledAction(client, basePath, actionId, request);

    expect(result.id).toBe(actionId);
    expect(result.status).toBe('Pending');
  });
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('SCHEDULING_PERMISSIONS', () => {
  it('exposes ACTIONS_READ and ACTIONS_MANAGE permission strings', () => {
    expect(SCHEDULING_PERMISSIONS.ACTIONS_READ).toBe('Scheduling.Actions.Read');
    expect(SCHEDULING_PERMISSIONS.ACTIONS_MANAGE).toBe('Scheduling.Actions.Manage');
  });

  it('has exactly two permission entries', () => {
    expect(Object.keys(SCHEDULING_PERMISSIONS)).toHaveLength(2);
  });
});

describe('SCHEDULING_STATUS_COLORS', () => {
  it('maps every ScheduledActionStatus to a color string', () => {
    expect(SCHEDULING_STATUS_COLORS.Pending).toBe('blue');
    expect(SCHEDULING_STATUS_COLORS.Executed).toBe('green');
    expect(SCHEDULING_STATUS_COLORS.Cancelled).toBe('gray');
    expect(SCHEDULING_STATUS_COLORS.Failed).toBe('red');
    expect(SCHEDULING_STATUS_COLORS.Processing).toBe('amber');
  });

  it('covers all five statuses', () => {
    expect(Object.keys(SCHEDULING_STATUS_COLORS)).toHaveLength(5);
  });
});

describe('SCHEDULING_STATUS_LABELS', () => {
  it('maps every ScheduledActionStatus to a human-readable label', () => {
    expect(SCHEDULING_STATUS_LABELS.Pending).toBe('Pending');
    expect(SCHEDULING_STATUS_LABELS.Executed).toBe('Executed');
    expect(SCHEDULING_STATUS_LABELS.Cancelled).toBe('Cancelled');
    expect(SCHEDULING_STATUS_LABELS.Failed).toBe('Failed');
    expect(SCHEDULING_STATUS_LABELS.Processing).toBe('Processing');
  });

  it('covers all five statuses', () => {
    expect(Object.keys(SCHEDULING_STATUS_LABELS)).toHaveLength(5);
  });
});
