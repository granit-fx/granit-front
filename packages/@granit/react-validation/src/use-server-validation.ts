import { validateField, validateFieldServer } from '@granit/validation';
import { useEffect, useRef, useState } from 'react';

import type { TranslateFunction } from './create-constraints-resolver.js';
import type { AxiosInstance } from '@granit/api-client';
import type { FieldConstraint } from '@granit/validation';

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

function isEmpty(value: unknown): boolean {
  return (
    value === undefined || value === null || (typeof value === 'string' && value.trim() === '')
  );
}

/**
 * Validates a field against a server-side validator with debounce and abort support.
 *
 * Skips server call when:
 * - The constraint has no `granitValidator`
 * - The value is empty and the field is not required
 * - Client-side validation already fails (let the resolver handle it)
 *
 * Returns a state object with `status` and optional `message`.
 */
export function useServerValidation(options: UseServerValidationOptions): ServerValidationState {
  const { client, constraint, value, t, enabled = true, debounceMs = 400, basePath } = options;

  const [state, setState] = useState<ServerValidationState>(IDLE);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cleanup previous timer and request
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    abortRef.current?.abort();

    // No server validator on this constraint
    if (!constraint.granitValidator || !enabled) {
      setState(IDLE);
      return;
    }

    const validatorKey = constraint.granitValidator;

    // Empty value — skip (required or not, let client resolver handle it)
    if (isEmpty(value)) {
      setState(IDLE);
      return;
    }

    // Client-side validation fails — let resolver handle, skip server call
    const clientErrors = validateField(value, constraint);
    if (clientErrors.length > 0) {
      setState(IDLE);
      return;
    }

    // Debounce the server call
    timerRef.current = setTimeout(() => {
      const controller = new AbortController();
      abortRef.current = controller;

      setState(VALIDATING);

      validateFieldServer(client, validatorKey, value, basePath, controller.signal)
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
            // ValidatorNotFound — no server validator available
            setState(IDLE);
          }
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          // Network errors are non-blocking — don't prevent form submission
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
