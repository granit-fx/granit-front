import { sendSessionHeartbeat } from '@granit/authentication-local';
import { useMutation } from '@tanstack/react-query';

import { useLocalAuthConfig } from '../providers/local-auth-provider';

import type { UseMutationResult } from '@tanstack/react-query';

/** Sends a session keep-alive heartbeat for the authenticated user. */
export function useSendSessionHeartbeat(): UseMutationResult<void, Error, void> {
  const config = useLocalAuthConfig();

  return useMutation({
    mutationFn: () => sendSessionHeartbeat(config.client, config.basePath!),
  });
}
