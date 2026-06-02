// ---------------------------------------------------------------------------
// @granit/logger-otlp — OTLP HTTP transport for @granit/logger
// ---------------------------------------------------------------------------

import type { LogContext, LogEntry, LogLevelName, LogTransport } from '@granit/logger';

// ---------------------------------------------------------------------------
// OTLP severity mapping (OpenTelemetry Logs data model)
// ---------------------------------------------------------------------------

const SEVERITY_NUMBER: Record<LogLevelName, number> = {
  DEBUG: 5,
  INFO: 9,
  WARN: 13,
  ERROR: 17,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TraceContext {
  traceId: string;
  spanId: string;
}

export interface OtlpTransportOptions {
  /** OTLP HTTP endpoint (e.g. '/v1/logs' via Vite proxy, or full URL in prod) */
  endpoint: string;
  /** Service name (e.g. 'guava-front') */
  serviceName: string;
  /** Service version */
  serviceVersion?: string;
  /** Deployment environment (e.g. 'development', 'production') */
  environment?: string;
  /** Additional HTTP headers */
  headers?: Record<string, string>;
  /** Batch size before auto-flush (default: 10) */
  batchSize?: number;
  /** Flush interval in ms (default: 5000) */
  flushInterval?: number;
  /** Optional callback to retrieve trace context for log-to-trace correlation */
  getTraceContext?: () => TraceContext | undefined;
  /**
   * Optional PII scrubber applied to the log body and every attribute
   * value before serialization. Use `defaultPiiRedactor` for a built-in
   * baseline (email, JWT, Bearer tokens, IBAN, credit card, E.164 phone).
   */
  redact?: (text: string) => string;
}

// ---------------------------------------------------------------------------
// OTLP JSON payload builders
// ---------------------------------------------------------------------------

interface OtlpAttribute {
  key: string;
  value: { stringValue: string };
}

function toStringAttribute(key: string, value: string): OtlpAttribute {
  return { key, value: { stringValue: value } };
}

function contextToAttributes(context: LogContext): OtlpAttribute[] {
  return Object.entries(context).map(([key, val]) => toStringAttribute(key, String(val)));
}

function errorToAttributes(error: unknown): OtlpAttribute[] {
  if (!(error instanceof Error)) return [];
  const attrs: OtlpAttribute[] = [
    toStringAttribute('exception.type', error.name),
    toStringAttribute('exception.message', error.message),
  ];
  if (error.stack) {
    attrs.push(toStringAttribute('exception.stacktrace', error.stack));
  }
  return attrs;
}

function buildLogRecord(
  entry: LogEntry,
  traceContext?: TraceContext,
  redact?: (text: string) => string
) {
  const attributes: OtlpAttribute[] = [toStringAttribute('logger.prefix', entry.prefix)];
  if (entry.context) {
    attributes.push(...contextToAttributes(entry.context));
  }
  if (entry.error !== undefined) {
    attributes.push(...errorToAttributes(entry.error));
  }

  if (redact) {
    for (const attr of attributes) {
      attr.value.stringValue = redact(attr.value.stringValue);
    }
  }

  const rawBody = `${entry.prefix} ${entry.message}`;
  return {
    timeUnixNano: String(BigInt(entry.timestamp) * 1_000_000n),
    severityNumber: SEVERITY_NUMBER[entry.level],
    severityText: entry.level,
    body: { stringValue: redact ? redact(rawBody) : rawBody },
    attributes,
    traceId: traceContext?.traceId ?? '',
    spanId: traceContext?.spanId ?? '',
  };
}

function buildPayload(entries: LogEntry[], options: OtlpTransportOptions) {
  const resourceAttributes: OtlpAttribute[] = [
    toStringAttribute('service.name', options.serviceName),
  ];
  if (options.serviceVersion) {
    resourceAttributes.push(toStringAttribute('service.version', options.serviceVersion));
  }
  if (options.environment) {
    resourceAttributes.push(toStringAttribute('deployment.environment', options.environment));
  }

  return {
    resourceLogs: [
      {
        resource: { attributes: resourceAttributes },
        scopeLogs: [
          {
            scope: { name: '@granit/logger-otlp' },
            logRecords: entries.map((entry) =>
              buildLogRecord(entry, options.getTraceContext?.(), options.redact)
            ),
          },
        ],
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Transport factory
// ---------------------------------------------------------------------------

export function createOtlpTransport(options: OtlpTransportOptions): LogTransport {
  const batchSize = options.batchSize ?? 10;
  const flushInterval = options.flushInterval ?? 5_000;

  let buffer: LogEntry[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;
  let disabled = false;

  function scheduleFlush(): void {
    timer ??= setTimeout(() => {
      timer = null;
      void flush();
    }, flushInterval);
  }

  function clearTimer(): void {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  async function flush(): Promise<void> {
    if (disabled || buffer.length === 0) return;
    clearTimer();

    const batch = buffer;
    buffer = [];

    const payload = JSON.stringify(buildPayload(batch, options));

    try {
      const response = await fetch(options.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: payload,
        keepalive: true,
      });
      if (!response.ok) {
        disabled = true;
        globalThis.console.warn(
          `[@granit/logger-otlp] OTLP collector unavailable at ${options.endpoint} (HTTP ${String(response.status)}). Log export disabled for this session.`
        );
      }
    } catch {
      disabled = true;
      globalThis.console.warn(
        `[@granit/logger-otlp] OTLP collector unreachable at ${options.endpoint}. Log export disabled for this session.`
      );
    }
  }

  return {
    send(entry: LogEntry): void {
      if (disabled) return;
      buffer.push(entry);
      if (buffer.length >= batchSize) {
        void flush();
      } else {
        scheduleFlush();
      }
    },
    flush,
  };
}
