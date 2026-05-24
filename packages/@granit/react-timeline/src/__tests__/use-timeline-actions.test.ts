import { TimelineEntryType } from '@granit/timeline';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useTimelineActions } from '../hooks/use-timeline-actions.js';

import { axiosResponse, createMockClient, createWrapper } from './test-utils.tsx';

describe('useTimelineActions', () => {
  it('should post an entry and call onEntryCreated', async () => {
    const client = createMockClient();
    const createdEntry = {
      id: 'e-1',
      entryType: TimelineEntryType.Comment,
      body: 'Hello',
      authorId: 'u-1',
      authorName: 'User',
      parentEntryId: null,
      occurredAt: '2026-01-01T00:00:00Z',
      attachments: [],
    };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(createdEntry));

    const onEntryCreated = vi.fn();

    const { result } = renderHook(
      () =>
        useTimelineActions({
          entityType: 'Patient',
          entityId: 'p-1',
          onEntryCreated,
        }),
      { wrapper: createWrapper(client) }
    );

    expect(result.current.posting).toBe(false);

    let returnedEntry;
    await act(async () => {
      returnedEntry = await result.current.postEntry({
        entryType: TimelineEntryType.Comment,
        body: 'Hello',
      });
    });

    expect(returnedEntry).toEqual(createdEntry);
    expect(onEntryCreated).toHaveBeenCalledWith(createdEntry);
    expect(client.post).toHaveBeenCalledWith('/api/v1/timeline/Patient/p-1/entries', {
      entryType: TimelineEntryType.Comment,
      body: 'Hello',
    });
  });

  it('should delete an entry and call onEntryDeleted', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

    const onEntryDeleted = vi.fn();

    const { result } = renderHook(
      () =>
        useTimelineActions({
          entityType: 'Patient',
          entityId: 'p-1',
          onEntryDeleted,
        }),
      { wrapper: createWrapper(client) }
    );

    await act(async () => {
      await result.current.removeEntry('e-1');
    });

    expect(onEntryDeleted).toHaveBeenCalledWith('e-1');
    expect(client.delete).toHaveBeenCalledWith('/api/v1/timeline/Patient/p-1/entries/e-1');
  });

  it('should set error on post failure', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(
      () =>
        useTimelineActions({
          entityType: 'Patient',
          entityId: 'p-1',
        }),
      { wrapper: createWrapper(client) }
    );

    await expect(
      result.current.postEntry({ entryType: TimelineEntryType.Comment, body: 'Hello' })
    ).rejects.toThrow('Server error');

    await waitFor(() => expect(result.current.error?.message).toBe('Server error'));
  });

  it('should set error on delete failure', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(
      () =>
        useTimelineActions({
          entityType: 'Patient',
          entityId: 'p-1',
        }),
      { wrapper: createWrapper(client) }
    );

    await expect(result.current.removeEntry('e-1')).rejects.toThrow('Not found');

    await waitFor(() => expect(result.current.error?.message).toBe('Not found'));
  });

  it('should wrap non-Error thrown value on post failure', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValue('string error');

    const { result } = renderHook(
      () =>
        useTimelineActions({
          entityType: 'Patient',
          entityId: 'p-1',
        }),
      { wrapper: createWrapper(client) }
    );

    await expect(
      result.current.postEntry({ entryType: TimelineEntryType.Comment, body: 'Hello' })
    ).rejects.toThrow('string error');

    await waitFor(() => expect(result.current.error?.message).toBe('string error'));
  });

  it('should wrap non-Error thrown value on delete failure', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockRejectedValue('delete failed');

    const { result } = renderHook(
      () =>
        useTimelineActions({
          entityType: 'Patient',
          entityId: 'p-1',
        }),
      { wrapper: createWrapper(client) }
    );

    await expect(result.current.removeEntry('e-1')).rejects.toThrow('delete failed');

    await waitFor(() => expect(result.current.error?.message).toBe('delete failed'));
  });
});
