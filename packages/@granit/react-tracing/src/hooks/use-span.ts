import { SpanStatusCode, context, trace } from '@opentelemetry/api';
import * as React from 'react';

import { useTracingConfig } from '../providers/tracing-provider';

import type { Span, SpanOptions } from '@opentelemetry/api';

/** Return type of the {@link useSpan} hook. */
export type UseSpanReturn = {
  /**
   * Execute a function within a new span. The span is automatically ended
   * when the function completes (or rejects). Errors are recorded on the span.
   *
   * @param name - Span name.
   * @param fn - Function to execute within the span context.
   * @returns The return value of `fn`.
   */
  withSpan: <T>(name: string, fn: (span: Span) => T | Promise<T>) => Promise<T>;

  /**
   * Create a span manually for fine-grained control.
   * **You must call `span.end()` yourself.**
   *
   * @param name - Span name.
   * @param options - Optional OTel span options.
   * @returns The created span.
   */
  createSpan: (name: string, options?: SpanOptions) => Span;
};

/**
 * Hook providing helpers for creating custom OpenTelemetry spans.
 *
 * Requires a `TracingProvider` ancestor in the component tree.
 *
 * @example
 * ```tsx
 * const { withSpan } = useSpan();
 *
 * const handleSave = () =>
 *   withSpan('save-invoice', async (span) => {
 *     span.setAttribute('invoice.id', invoiceId);
 *     await api.post('/invoices', data);
 *   });
 * ```
 */
export function useSpan(): UseSpanReturn {
  const tracer = useTracingConfig();

  const withSpan = React.useCallback(
    async <T>(name: string, fn: (span: Span) => T | Promise<T>): Promise<T> => {
      const span = tracer.startSpan(name);
      const ctx = trace.setSpan(context.active(), span);

      try {
        const result = await context.with(ctx, () => fn(span));
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR });
        if (error instanceof Error) {
          span.recordException(error);
        }
        throw error;
      } finally {
        span.end();
      }
    },
    [tracer]
  );

  const createSpan = React.useCallback(
    (name: string, options?: SpanOptions): Span => tracer.startSpan(name, options),
    [tracer]
  );

  return { withSpan, createSpan };
}
