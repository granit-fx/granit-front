import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useTimelineFollowers } from '../hooks/use-timeline-followers';

import { axiosResponse, createMockClient, createWrapper } from './test-utils.tsx';

describe('useTimelineFollowers', () => {
  it('should load followers on mount', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(['u-1', 'u-2']));

    const { result } = renderHook(
      () =>
        useTimelineFollowers({
          entityType: 'Patient',
          entityId: 'p-1',
          currentUserId: 'u-1',
        }),
      { wrapper: createWrapper(client) }
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.followers).toEqual(['u-1', 'u-2']);
    expect(result.current.isFollowing).toBe(true);
  });

  it('should detect isFollowing=false when user not in followers', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(['u-2']));

    const { result } = renderHook(
      () =>
        useTimelineFollowers({
          entityType: 'Patient',
          entityId: 'p-1',
          currentUserId: 'u-1',
        }),
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isFollowing).toBe(false);
  });

  it('should follow an entity and update local state', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([]));
    vi.mocked(client.post).mockResolvedValue(axiosResponse(undefined));

    const { result } = renderHook(
      () =>
        useTimelineFollowers({
          entityType: 'Patient',
          entityId: 'p-1',
          currentUserId: 'u-1',
        }),
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isFollowing).toBe(false);

    await result.current.follow();

    await waitFor(() => expect(result.current.isFollowing).toBe(true));
    expect(result.current.followers).toContain('u-1');
    expect(client.post).toHaveBeenCalledWith('/api/v1/timeline/Patient/p-1/follow');
  });

  it('should unfollow an entity and update local state', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(['u-1']));
    vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

    const { result } = renderHook(
      () =>
        useTimelineFollowers({
          entityType: 'Patient',
          entityId: 'p-1',
          currentUserId: 'u-1',
        }),
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isFollowing).toBe(true);

    await result.current.unfollow();

    await waitFor(() => expect(result.current.isFollowing).toBe(false));
    expect(result.current.followers).not.toContain('u-1');
    expect(client.delete).toHaveBeenCalledWith('/api/v1/timeline/Patient/p-1/follow');
  });

  it('should set error state on follow failure', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([]));
    vi.mocked(client.post).mockRejectedValue(new Error('Forbidden'));

    const { result } = renderHook(
      () =>
        useTimelineFollowers({
          entityType: 'Patient',
          entityId: 'p-1',
          currentUserId: 'u-1',
        }),
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(result.current.follow()).rejects.toThrow('Forbidden');

    await waitFor(() => expect(result.current.error?.message).toBe('Forbidden'));
  });

  it('should handle missing currentUserId gracefully', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(['u-1']));

    const { result } = renderHook(
      () =>
        useTimelineFollowers({
          entityType: 'Patient',
          entityId: 'p-1',
        }),
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isFollowing).toBe(false);
    expect(result.current.followers).toEqual(['u-1']);
  });

  it('should wrap non-Error thrown value on load failure', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue('load failed');

    const { result } = renderHook(
      () =>
        useTimelineFollowers({
          entityType: 'Patient',
          entityId: 'p-1',
        }),
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error?.message).toBe('load failed');
  });

  it('should set error state on unfollow failure', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(['u-1']));
    vi.mocked(client.delete).mockRejectedValue(new Error('Unfollow denied'));

    const { result } = renderHook(
      () =>
        useTimelineFollowers({
          entityType: 'Patient',
          entityId: 'p-1',
          currentUserId: 'u-1',
        }),
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(result.current.unfollow()).rejects.toThrow('Unfollow denied');

    await waitFor(() => expect(result.current.error?.message).toBe('Unfollow denied'));
  });

  it('should wrap non-Error thrown value on unfollow failure', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(['u-1']));
    vi.mocked(client.delete).mockRejectedValue('unfollow error');

    const { result } = renderHook(
      () =>
        useTimelineFollowers({
          entityType: 'Patient',
          entityId: 'p-1',
          currentUserId: 'u-1',
        }),
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(result.current.unfollow()).rejects.toThrow('unfollow error');

    await waitFor(() => expect(result.current.error?.message).toBe('unfollow error'));
  });

  it('should not update local followers state on follow without currentUserId', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([]));
    vi.mocked(client.post).mockResolvedValue(axiosResponse(undefined));

    const { result } = renderHook(
      () =>
        useTimelineFollowers({
          entityType: 'Patient',
          entityId: 'p-1',
        }),
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    await result.current.follow();

    expect(result.current.followers).toEqual([]);
    expect(client.post).toHaveBeenCalledWith('/api/v1/timeline/Patient/p-1/follow');
  });

  it('should not update local followers state on unfollow without currentUserId', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(['u-1']));
    vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

    const { result } = renderHook(
      () =>
        useTimelineFollowers({
          entityType: 'Patient',
          entityId: 'p-1',
        }),
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    await result.current.unfollow();

    expect(result.current.followers).toEqual(['u-1']);
    expect(client.delete).toHaveBeenCalledWith('/api/v1/timeline/Patient/p-1/follow');
  });

  it('should not duplicate currentUserId when already following', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(['u-1']));
    vi.mocked(client.post).mockResolvedValue(axiosResponse(undefined));

    const { result } = renderHook(
      () =>
        useTimelineFollowers({
          entityType: 'Patient',
          entityId: 'p-1',
          currentUserId: 'u-1',
        }),
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isFollowing).toBe(true);

    await result.current.follow();

    await waitFor(() => {
      expect(result.current.followers.filter((id) => id === 'u-1')).toHaveLength(1);
    });
  });
});
