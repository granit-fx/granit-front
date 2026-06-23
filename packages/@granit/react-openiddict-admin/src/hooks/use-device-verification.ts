import { useState } from 'react';

import { logger } from '../logger';
import { useAdminConfig } from '../providers/openiddict-admin-provider';

export type DeviceVerificationStatus = 'idle' | 'pending' | 'success' | 'error';

export interface DeviceVerificationState {
  readonly status: DeviceVerificationStatus;
  /** OAuth 2.0 error code on failure (e.g. `invalid_user_code`, `expired_token`). */
  readonly errorCode: string | null;
  /** Submit the user code to the verification endpoint. */
  readonly submit: (userCode: string) => Promise<void>;
}

/**
 * Drives the OAuth 2.0 Device Authorization Grant verification page (RFC 8628).
 *
 * Submits the user code via `application/x-www-form-urlencoded` POST to the
 * OpenIddict device verification endpoint (default `/connect/verify`).
 *
 * Must be used inside an `<OpenIddictAdminProvider>`.
 */
export function useDeviceVerification(verifyEndpoint = '/connect/verify'): DeviceVerificationState {
  const config = useAdminConfig();
  const [status, setStatus] = useState<DeviceVerificationStatus>('idle');
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const submit = async (userCode: string) => {
    setStatus('pending');
    setErrorCode(null);
    try {
      await config.client.post(verifyEndpoint, new URLSearchParams({ user_code: userCode }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      setStatus('success');
    } catch (error: unknown) {
      const data = (error as { response?: { data?: { error?: string } } })?.response?.data;
      const code = data?.error ?? 'unknown_error';
      // Log only the OAuth error code — the submitted user_code is a credential
      // and must never be logged (it can travel inside the raw error/request).
      logger.warn('Device verification failed', { errorCode: code });
      setErrorCode(code);
      setStatus('error');
    }
  };

  return { status, errorCode, submit };
}
