import { createLogger } from '@granit/logger';
import { isEmptyFieldValue, validateField, validateFieldServer } from '@granit/validation';
import { useEffect, useRef, useState } from 'react';

import type { TranslateFunction } from './create-constraints-resolver';
import type { AxiosInstance } from '@granit/api-client';
import type { FieldConstraint } from '@granit/validation';

const logger = createLogger('react-validation');

export interface ServerValidationState {
  readonly status: 'idle' | 'validating' | 'valid' | 'invalid' | 'error';
  readonly message?: string;
}

export interface UseServerValidationOptions {
  readonly client: AxiosInstance;
  readonly constraint: FieldConstraint;
  readonly value: unknown;
  readonly t: TranslateFunction;
  readonly enabled?: boolean;
  readonly debounceMs?: number;
  readonly basePath?: string;
}

const IDLE: ServerValidationState = { status: 'idle' };
const VALIDATING: ServerValidationState = { status: 'validating' };
const VALID: ServerValidationState = { status: 'valid' };

/**
 * Validates a field against a server-side validator with debounce and abort support.
 *
 * Uses useState/useEffect rather than TanStack Query intentionally: TQ's caching
 * and retry semantics conflict with real-time field validation (debounce, abort
 * on value change, non-blocking network errors).
 *
 * Skips server call when:
 * - The constraint has no `granitValidator`
 * - The value is empty (let the resolver handle required/empty)
 * - Client-side validation already fails
 *
 * Returns a state object with `status` and optional `message`.
 */
export function useServerValidation(options: UseServerValidationOptions): ServerValidationState {
  const { client, constraint, value, t, enabled = true, debounceMs = 400, basePath } = options;

  const [state, setState] = useState<ServerValidationState>(IDLE);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    abortRef.current?.abort();

    if (!constraint.granitValidator || !enabled) {
      setState(IDLE);
      return;
    }

    const validatorKey = constraint.granitValidator;

    if (isEmptyFieldValue(value)) {
      setState(IDLE);
      return;
    }

    const clientErrors = validateField(value, constraint);
    if (clientErrors.length > 0) {
      setState(IDLE);
      return;
    }

    timerRef.current = setTimeout(() => {
      const controller = new AbortController();
      abortRef.current = controller;

      setState(VALIDATING);

      // Coerce to string — .NET endpoint expects string? (not arbitrary JSON)
      const stringValue = typeof value === 'string' ? value : String(value);

      validateFieldServer(client, validatorKey, stringValue, basePath, controller.signal)
        .then((status) => {
          if (controller.signal.aborted) return;

          if (status === 'Valid') {
            setState(VALID);
          } else if (status === 'Invalid') {
            setState({
              status: 'invalid',
              message: t(validatorKey, { nsSeparator: false }),
            });
          } else {
            setState(IDLE);
          }
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          logger.warn('Server field validation request failed', { validatorKey, err });
          setState({
            status: 'error',
            message: err instanceof Error ? err.message : String(err),
          });
        });
    }, debounceMs);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      abortRef.current?.abort();
    };
  }, [value, enabled, constraint, client, t, debounceMs, basePath]);

  return state;
}
