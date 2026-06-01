import { context, trace } from '@opentelemetry/api';

import type { TraceContext } from './types/index';

/**
 * Reads the active span from the OpenTelemetry global context and returns
 * its trace and span IDs.
 *
 * This function has **no React dependency** — it reads from the OTel global
 * singleton, making it safe to use in non-React code (e.g. as the
 * `getTraceContext` callback for `@granit/logger-otlp`).
 *
 * @returns Trace context if an active span exists, `undefined` otherwise.
 *
 * @example
 * ```ts
 * import { createOtlpTransport } from '@granit/logger-otlp';
 * import { getTraceContext } from '@granit/tracing';
 *
 * const transport = createOtlpTransport({
 *   endpoint: '/v1/logs',
 *   getTraceContext,
 * });
 * ```
 */
export function getTraceContext(): TraceContext | undefined {
  const span = trace.getSpan(context.active());
  if (!span) return undefined;

  const spanContext = span.spanContext();
  if (!spanContext.traceId || !spanContext.spanId) return undefined;

  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
  };
}
