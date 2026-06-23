import { isEmptyFieldValue, validateField, validateFieldsBatch } from '@granit/validation';
import { useEffect, useRef, useState } from 'react';

import { logger } from './logger';

import type { TranslateFunction } from './create-constraints-resolver';
import type { ServerValidationState } from './use-server-validation';
import type { AxiosInstance } from '@granit/api-client';
import type { FieldConstraint } from '@granit/validation';

export interface BatchFieldSpec {
  readonly name: string;
  readonly constraint: FieldConstraint;
  readonly value: unknown;
}

export interface UseServerValidationBatchOptions {
  readonly client: AxiosInstance;
  readonly fields: readonly BatchFieldSpec[];
  readonly t: TranslateFunction;
  readonly enabled?: boolean;
  readonly debounceMs?: number;
  readonly basePath?: string;
}

/** Map of field name → server validation state for each server-validated field. */
export type ServerValidationBatchState = Readonly<Record<string, ServerValidationState>>;

const EMPTY_STATE: ServerValidationBatchState = {};

/**
 * Validates multiple fields against server-side validators in a single batch
 * request, with debounce and abort support.
 *
 * Fields without a `granitValidator` constraint, empty values, or fields
 * whose client-side validation already fails are excluded from the batch.
 *
 * Uses `validateFieldsBatch` to coalesce N server round-trips into one —
 * prefer this over calling `useServerValidation` once per field.
 *
 * Uses useState/useEffect rather than TanStack Query for the same reasons
 * as `useServerValidation` (debounce/abort semantics, non-blocking errors).
 */
export function useServerValidationBatch(
  options: UseServerValidationBatchOptions
): ServerValidationBatchState {
  const { client, fields, t, enabled = true, debounceMs = 400, basePath } = options;

  const [state, setState] = useState<ServerValidationBatchState>(EMPTY_STATE);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    abortRef.current?.abort();

    if (!enabled) {
      setState(EMPTY_STATE);
      return;
    }

    const eligible = fields.filter(
      (f) =>
        f.constraint.granitValidator !== undefined &&
        !isEmptyFieldValue(f.value) &&
        validateField(f.value, f.constraint).length === 0
    );

    if (eligible.length === 0) {
      setState(EMPTY_STATE);
      return;
    }

    timerRef.current = setTimeout(() => {
      const controller = new AbortController();
      abortRef.current = controller;

      const validatingState: Record<string, ServerValidationState> = {};
      for (const f of eligible) {
        validatingState[f.name] = { status: 'validating' };
      }
      setState(validatingState);

      validateFieldsBatch(
        client,
        eligible.map((f) => ({
          errorCode: f.constraint.granitValidator!,
          value: typeof f.value === 'string' ? f.value : String(f.value),
        })),
        basePath,
        controller.signal
      )
        .then((results) => {
          if (controller.signal.aborted) return;

          const nextState: Record<string, ServerValidationState> = {};
          for (let i = 0; i < eligible.length; i++) {
            const field = eligible[i]!;
            const result = results[i];
            if (!result) continue;

            if (result.status === 'Valid') {
              nextState[field.name] = { status: 'valid' };
            } else if (result.status === 'Invalid') {
              nextState[field.name] = {
                status: 'invalid',
                message: t(field.constraint.granitValidator ?? '', { nsSeparator: false }),
              };
            } else {
              nextState[field.name] = { status: 'idle' };
            }
          }
          setState(nextState);
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          logger.warn('Server batch field validation request failed', {
            fieldCount: eligible.length,
            err,
          });
          const errorState: Record<string, ServerValidationState> = {};
          for (const f of eligible) {
            errorState[f.name] = {
              status: 'error',
              message: err instanceof Error ? err.message : String(err),
            };
          }
          setState(errorState);
        });
    }, debounceMs);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      abortRef.current?.abort();
    };
  }, [fields, enabled, client, t, debounceMs, basePath]);

  return state;
}
