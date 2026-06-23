import { getFollowers, followEntity, unfollowEntity } from '@granit/timeline';
import { useCallback, useEffect, useState } from 'react';

import { logger as timelineLogger } from '../logger';
import { useTimelineConfig } from '../providers/timeline-provider';

const logger = timelineLogger.child('followers');

export interface UseTimelineFollowersOptions {
  entityType: string;
  entityId: string;
  currentUserId?: string;
}

export interface UseTimelineFollowersReturn {
  followers: string[];
  isFollowing: boolean;
  loading: boolean;
  error: Error | null;
  follow: () => Promise<void>;
  unfollow: () => Promise<void>;
}

export function useTimelineFollowers({
  entityType,
  entityId,
  currentUserId,
}: UseTimelineFollowersOptions): UseTimelineFollowersReturn {
  const { client, basePath } = useTimelineConfig();

  const [followers, setFollowers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const isFollowing = currentUserId != null && followers.includes(currentUserId);

  const loadFollowers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getFollowers(client, basePath, entityType, entityId);
      setFollowers(data);
    } catch (err) {
      const wrapped = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to load followers', wrapped);
      setError(wrapped);
    } finally {
      setLoading(false);
    }
  }, [client, basePath, entityType, entityId]);

  const follow = useCallback(async () => {
    setError(null);
    try {
      await followEntity(client, basePath, entityType, entityId);
      if (currentUserId) {
        setFollowers((prev) => (prev.includes(currentUserId) ? prev : [...prev, currentUserId]));
      }
    } catch (err) {
      const wrapped = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to follow entity', wrapped);
      setError(wrapped);
      throw wrapped;
    }
  }, [client, basePath, entityType, entityId, currentUserId]);

  const unfollow = useCallback(async () => {
    setError(null);
    try {
      await unfollowEntity(client, basePath, entityType, entityId);
      if (currentUserId) {
        setFollowers((prev) => prev.filter((id) => id !== currentUserId));
      }
    } catch (err) {
      const wrapped = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to unfollow entity', wrapped);
      setError(wrapped);
      throw wrapped;
    }
  }, [client, basePath, entityType, entityId, currentUserId]);

  useEffect(() => {
    loadFollowers().catch(() => {}); // Error state set inside loadFollowers
  }, [loadFollowers]);

  return { followers, isFollowing, loading, error, follow, unfollow };
}
