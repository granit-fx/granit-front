import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  cancelActivity,
  completeActivity,
  createActivity,
  getActivitiesCalendar,
  getActivity,
  listActivities,
  reassignActivity,
  rescheduleActivity,
} from '../api/activities-api.js';

import type {
  ActivityCalendarFilter,
  ActivityCalendarItemResponse,
  ActivityListResponse,
  ActivityResponse,
  CancelActivityRequest,
  CompleteActivityRequest,
  CreateActivityRequest,
  ReassignActivityRequest,
  RescheduleActivityRequest,
} from '../types/index.js';

const basePath = '/activities';

const sampleActivity: ActivityResponse = {
  id: 'act-1',
  entityType: 'Quote',
  entityId: 'quote-1',
  type: 'FollowUp',
  assignedToUserId: 'user-1',
  createdByUserId: 'user-2',
  dueAt: '2026-05-10T10:00:00Z',
  description: 'Call back the client',
  status: 'Open',
  completedAt: null,
  completedByUserId: null,
  createdAt: '2026-05-01T08:00:00Z',
};

const sampleListResponse: ActivityListResponse = {
  items: [sampleActivity],
  totalCount: 1,
  page: 1,
  pageSize: 20,
};

const sampleCalendarItem: ActivityCalendarItemResponse = {
  id: 'act-1',
  start: '2026-05-10T10:00:00Z',
  end: null,
  title: 'Quote · FollowUp',
  color: 'open',
  type: 'FollowUp',
  status: 'Open',
  entityType: 'Quote',
  entityId: 'quote-1',
  assignedToUserId: 'user-1',
};

describe('listActivities', () => {
  it('GETs the base path without params when no filter is provided', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleListResponse));

    const result = await listActivities(client, basePath);

    expect(client.get).toHaveBeenCalledWith(basePath, undefined);
    expect(result).toEqual(sampleListResponse);
  });

  it('omits undefined filter axes from query params', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleListResponse));

    await listActivities(client, basePath, {
      status: 'OpenOrOverdue',
      assignedToUserId: 'user-1',
      page: 2,
      pageSize: 50,
    });

    expect(client.get).toHaveBeenCalledWith(basePath, {
      params: { status: 'OpenOrOverdue', assignedToUserId: 'user-1', page: 2, pageSize: 50 },
    });
  });

  it('returns no params object when the filter is present but empty', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleListResponse));

    await listActivities(client, basePath, {});

    expect(client.get).toHaveBeenCalledWith(basePath, undefined);
  });
});

describe('getActivity', () => {
  it('GETs a single activity by id with URI-encoded path', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleActivity));

    const result = await getActivity(client, basePath, 'act/with slash');

    expect(client.get).toHaveBeenCalledWith(`${basePath}/act%2Fwith%20slash`);
    expect(result).toEqual(sampleActivity);
  });

  it('propagates Axios errors (404)', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('Request failed with status code 404'));

    await expect(getActivity(client, basePath, 'missing')).rejects.toThrow(/404/);
  });
});

describe('createActivity', () => {
  it('POSTs to the base path', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleActivity));
    const request: CreateActivityRequest = {
      entityType: 'Quote',
      entityId: 'quote-1',
      type: 'FollowUp',
      assignedToUserId: 'user-1',
      dueAt: '2026-05-10T10:00:00Z',
      description: null,
    };

    const result = await createActivity(client, basePath, request);

    expect(client.post).toHaveBeenCalledWith(basePath, request);
    expect(result).toEqual(sampleActivity);
  });
});

describe('completeActivity', () => {
  it('POSTs to {id}/complete', async () => {
    const client = createMockClient();
    const completed: ActivityResponse = {
      ...sampleActivity,
      status: 'Completed',
      completedAt: '2026-05-09T15:00:00Z',
      completedByUserId: 'user-1',
    };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(completed));
    const request: CompleteActivityRequest = { completedAt: '2026-05-09T15:00:00Z' };

    const result = await completeActivity(client, basePath, 'act-1', request);

    expect(client.post).toHaveBeenCalledWith(`${basePath}/act-1/complete`, request);
    expect(result).toEqual(completed);
  });

  it('rejects on 422 from the backend', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValue(new Error('Request failed with status code 422'));
    const request: CompleteActivityRequest = { completedAt: '2026-05-09T15:00:00Z' };

    await expect(completeActivity(client, basePath, 'act-1', request)).rejects.toThrow(/422/);
  });
});

describe('cancelActivity', () => {
  it('POSTs to {id}/cancel', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleActivity));
    const request: CancelActivityRequest = { cancelledAt: '2026-05-09T15:00:00Z' };

    await cancelActivity(client, basePath, 'act-1', request);

    expect(client.post).toHaveBeenCalledWith(`${basePath}/act-1/cancel`, request);
  });
});

describe('reassignActivity', () => {
  it('PUTs to {id}/assignee', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue(axiosResponse(sampleActivity));
    const request: ReassignActivityRequest = { newAssigneeUserId: 'user-3' };

    await reassignActivity(client, basePath, 'act-1', request);

    expect(client.put).toHaveBeenCalledWith(`${basePath}/act-1/assignee`, request);
  });

  it('propagates 403 when the caller lacks Manage', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockRejectedValue(new Error('Request failed with status code 403'));
    const request: ReassignActivityRequest = { newAssigneeUserId: 'user-3' };

    await expect(reassignActivity(client, basePath, 'act-1', request)).rejects.toThrow(/403/);
  });
});

describe('rescheduleActivity', () => {
  it('PUTs to {id}/due-date', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue(axiosResponse(sampleActivity));
    const request: RescheduleActivityRequest = { newDueAt: '2026-05-15T10:00:00Z' };

    await rescheduleActivity(client, basePath, 'act-1', request);

    expect(client.put).toHaveBeenCalledWith(`${basePath}/act-1/due-date`, request);
  });
});

describe('getActivitiesCalendar', () => {
  it('always sends from + to and includes only defined optional axes', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([sampleCalendarItem]));
    const filter: ActivityCalendarFilter = {
      from: '2026-05-01T00:00:00Z',
      to: '2026-05-31T23:59:59Z',
      assignee: 'me',
      status: 'OpenOrOverdue',
    };

    const result = await getActivitiesCalendar(client, basePath, filter);

    expect(client.get).toHaveBeenCalledWith(`${basePath}/calendar`, {
      params: {
        from: '2026-05-01T00:00:00Z',
        to: '2026-05-31T23:59:59Z',
        assignee: 'me',
        status: 'OpenOrOverdue',
      },
    });
    expect(result).toEqual([sampleCalendarItem]);
  });

  it('omits all optional axes when the caller only supplies the time window', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([]));

    await getActivitiesCalendar(client, basePath, {
      from: '2026-05-01T00:00:00Z',
      to: '2026-05-31T23:59:59Z',
    });

    expect(client.get).toHaveBeenCalledWith(`${basePath}/calendar`, {
      params: { from: '2026-05-01T00:00:00Z', to: '2026-05-31T23:59:59Z' },
    });
  });

  it('rejects with 401 when the caller is unauthenticated', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('Request failed with status code 401'));

    await expect(
      getActivitiesCalendar(client, basePath, {
        from: '2026-05-01T00:00:00Z',
        to: '2026-05-31T23:59:59Z',
      })
    ).rejects.toThrow(/401/);
  });
});
