import { axiosResponse, createMockClient } from '@granit/api-client/test-utils';
import { toISODateString } from '@granit/types';
import { describe, expect, it, vi } from 'vitest';

import {
  executeStateMachineTransition,
  fetchHistory,
  fetchTransitions,
} from '../api/workflow-api.js';

import type {
  TransitionHistory,
  WorkflowTransitionResult,
  WorkflowStatus,
} from '../types/index.js';

describe('workflow api', () => {
  const basePath = '/api/v1/workflow';
  const entityType = 'Document';
  const entityId = 'doc-1';

  it('should call GET with correct URL for fetchHistory', async () => {
    const client = createMockClient();
    const historyItems: TransitionHistory[] = [
      {
        previousState: 'Draft',
        newState: 'Published',
        transitionedAt: toISODateString('2026-01-15T10:00:00Z'),
        transitionedBy: 'Dr. Martin',
        comment: null,
      },
    ];
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse({ items: historyItems, totalCount: 1, nextCursor: null })
    );

    const result = await fetchHistory(client, basePath, entityType, entityId);

    expect(client.get).toHaveBeenCalledWith('/api/v1/workflow/Document/doc-1/history', {
      params: {},
    });
    expect(result).toEqual({ items: historyItems, totalCount: 1, nextCursor: null });
  });

  it('should call GET with query param for fetchTransitions', async () => {
    const client = createMockClient();
    const status: WorkflowStatus = {
      currentState: 'Draft',
      availableTransitions: [
        { targetState: 'Published', name: 'Publier', allowed: true, requiresApproval: false },
        { targetState: 'Archived', name: 'Archiver', allowed: false, requiresApproval: true },
      ],
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(status));

    const result = await fetchTransitions(client, basePath, 'Draft');

    expect(client.get).toHaveBeenCalledWith('/api/v1/workflow/transitions', {
      params: { currentState: 'Draft' },
    });
    expect(result).toEqual(status);
  });

  it('should call POST with query param and body for executeStateMachineTransition', async () => {
    const client = createMockClient();
    const transitionResult: WorkflowTransitionResult = {
      succeeded: true,
      resultingState: 'Published',
      outcome: 'Completed',
    };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(transitionResult));

    const result = await executeStateMachineTransition(client, basePath, 'Draft', {
      targetState: 'Published',
      comment: 'Approved by medical director.',
    });

    expect(client.post).toHaveBeenCalledWith(
      '/api/v1/workflow/transitions',
      { targetState: 'Published', comment: 'Approved by medical director.' },
      { params: { currentState: 'Draft' } }
    );
    expect(result).toEqual(transitionResult);
  });

  it('should pass pagination params to fetchHistory when provided', async () => {
    const client = createMockClient();
    const historyItems: TransitionHistory[] = [
      {
        previousState: 'Draft',
        newState: 'Published',
        transitionedAt: toISODateString('2026-01-15T10:00:00Z'),
        transitionedBy: 'Dr. Martin',
        comment: null,
      },
    ];
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse({ items: historyItems, totalCount: 10, nextCursor: 'abc' })
    );

    const result = await fetchHistory(client, basePath, entityType, entityId, {
      page: 2,
      pageSize: 5,
    });

    expect(client.get).toHaveBeenCalledWith('/api/v1/workflow/Document/doc-1/history', {
      params: { page: 2, pageSize: 5 },
    });
    expect(result.totalCount).toBe(10);
    expect(result.nextCursor).toBe('abc');
  });
});
