import { type Tracer, trace } from '@opentelemetry/api';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BatchSpanProcessor, WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import * as React from 'react';

import { logger } from '../logger';

import type { TracingProviderProps } from '../types/index';
import type { TracingExporterConfig } from '@granit/tracing';
import type { Instrumentation } from '@opentelemetry/instrumentation';
import type { ReadableSpan, SpanExporter } from '@opentelemetry/sdk-trace-web';

// ---------------------------------------------------------------------------
// Gated exporter — probes the OTLP endpoint on first export, then either
// delegates to OTLPTraceExporter or disables itself with a warning.
// ---------------------------------------------------------------------------

// ExportResultCode.SUCCESS = 0 (from @opentelemetry/core, not a direct dependency)
const EXPORT_SUCCESS = { code: 0 as const };

function createGatedExporter(exporterConfig: TracingExporterConfig): SpanExporter {
  let delegate: OTLPTraceExporter | null = null;
  let disabled = false;
  let probed = false;

  return {
    export(spans: ReadableSpan[], resultCallback: (result: { code: number }) => void): void {
      if (disabled) {
        resultCallback(EXPORT_SUCCESS);
        return;
      }

      if (!probed) {
        probed = true;

        // Probe the collector with an empty OTLP payload before delegating.
        void fetch(exporterConfig.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...exporterConfig.headers },
          body: '{"resourceSpans":[]}',
        })
          .then((res) => {
            if (res.ok) {
              delegate = new OTLPTraceExporter({
                url: exporterConfig.url,
                headers: exporterConfig.headers,
              });
              delegate.export(spans, resultCallback);
            } else {
              disabled = true;
              logger.warn('OTLP collector unavailable; trace export disabled for this session', {
                url: exporterConfig.url,
                status: res.status,
              });
              resultCallback(EXPORT_SUCCESS);
            }
          })
          .catch((err: unknown) => {
            disabled = true;
            logger.warn('OTLP collector unreachable; trace export disabled for this session', {
              url: exporterConfig.url,
              err,
            });
            resultCallback(EXPORT_SUCCESS);
          });
        return;
      }

      delegate!.export(spans, resultCallback);
    },

    shutdown(): Promise<void> {
      return delegate?.shutdown() ?? Promise.resolve();
    },

    forceFlush(): Promise<void> {
      return delegate?.forceFlush?.() ?? Promise.resolve();
    },
  };
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const TracerContext = React.createContext<Tracer | null>(null);

/**
 * Returns the OTel `Tracer` instance provided by the nearest `TracingProvider`.
 *
 * @throws If called outside a `TracingProvider`.
 */
export function useTracingConfig(): Tracer {
  const tracer = React.useContext(TracerContext);
  if (!tracer) {
    throw new Error('useTracingConfig must be used within a TracingProvider');
  }
  return tracer;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * Initialises the OpenTelemetry `WebTracerProvider` with auto-instrumentations
 * (fetch, XHR, document-load) and an OTLP HTTP exporter.
 *
 * The exporter probes the OTLP endpoint on first export. If the collector is
 * unavailable, a warning is logged and trace export is disabled for the session
 * (no continuous 500 errors in the browser console).
 *
 * Provides a `Tracer` via React context (accessible with `useTracingConfig()`).
 * Shuts down the provider on unmount to flush pending spans.
 *
 * @example
 * ```tsx
 * <TracingProvider config={{
 *   serviceName: 'guava-front',
 *   exporter: { url: '/v1/traces' },
 * }}>
 *   <App />
 * </TracingProvider>
 * ```
 */
export function TracingProvider({ config, children }: Readonly<TracingProviderProps>) {
  const tracerRef = React.useRef<Tracer | null>(null);

  if (!tracerRef.current) {
    const {
      serviceName,
      serviceVersion,
      exporter: exporterConfig,
      instrumentFetch = true,
      instrumentXhr = true,
      instrumentDocumentLoad = true,
      additionalInstrumentations = [],
    } = config;

    // --- Resource ---
    const attributes: Record<string, string> = {
      [ATTR_SERVICE_NAME]: serviceName,
    };
    if (serviceVersion) {
      attributes[ATTR_SERVICE_VERSION] = serviceVersion;
    }
    const resource = resourceFromAttributes(attributes);

    // --- Exporter & Processor ---
    const gatedExporter = createGatedExporter(exporterConfig);
    const spanProcessor = new BatchSpanProcessor(gatedExporter);

    // --- Instrumentations ---
    const instrumentations: Instrumentation[] = [...additionalInstrumentations];
    if (instrumentFetch) {
      instrumentations.push(new FetchInstrumentation());
    }
    if (instrumentXhr) {
      instrumentations.push(new XMLHttpRequestInstrumentation());
    }
    if (instrumentDocumentLoad) {
      instrumentations.push(new DocumentLoadInstrumentation());
    }

    // --- Provider ---
    const provider = new WebTracerProvider({
      resource,
      spanProcessors: [spanProcessor],
    });
    provider.register({
      contextManager: new ZoneContextManager(),
      propagator: new W3CTraceContextPropagator(),
    });

    // Register instrumentations
    for (const instrumentation of instrumentations) {
      if ('enable' in instrumentation && typeof instrumentation.enable === 'function') {
        instrumentation.enable();
      }
    }

    tracerRef.current = trace.getTracer(serviceName, serviceVersion);
  }

  React.useEffect(() => {
    return () => {
      const activeProvider = trace.getTracerProvider();
      if ('shutdown' in activeProvider && typeof activeProvider.shutdown === 'function') {
        (activeProvider as { shutdown: () => Promise<void> }).shutdown();
      }
    };
  }, []);

  return <TracerContext.Provider value={tracerRef.current}>{children}</TracerContext.Provider>;
}
