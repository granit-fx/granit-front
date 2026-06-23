import { useEffect } from 'react';

// Runs `effect` exactly when `key` changes — used to reset local draft state
// when server-side data changes. Callers pass an inline arrow each render;
// closing over the latest is fine and stale-effect drift is impossible.
export function useMemoSyncDraft(key: string, effect: () => void) {
  useEffect(() => {
    effect();
  }, [key]);
}
