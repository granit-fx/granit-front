import { backToImpersonator, sessionHeartbeat } from '@granit/account';
import { useMutation } from '@tanstack/react-query';

import { useAccountConfig } from '../providers/account-provider';

import type { AccountImpersonationResult } from '@granit/account';
import type { UseMutationResult } from '@tanstack/react-query';

/** Sends a session heartbeat to prevent idle timeout. */
export function useSessionHeartbeat(): UseMutationResult<void, Error, void> {
  const config = useAccountConfig();

  return useMutation({
    mutationFn: () => sessionHeartbeat(config.client, config.basePath!),
  });
}

/** Ends an impersonation session and returns to the original admin account. */
export function useBackToImpersonator(): UseMutationResult<
  AccountImpersonationResult,
  Error,
  void
> {
  const config = useAccountConfig();

  return useMutation({
    mutationFn: () => backToImpersonator(config.client, config.basePath!),
  });
}
