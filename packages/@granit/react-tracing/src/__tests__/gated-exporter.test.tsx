import { renderHook } from '@testing-library/react';
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TracingProvider, useTracer } from '../providers/tracing-provider.js';

import type { TracingConfig } from '@granit/tracing';
import type { ReadableSpan, SpanExporter } from '@opentelemetry/sdk-trace-web';

// ---------------------------------------------------------------------------
// Capture the gated exporter from the BatchSpanProcessor constructor
// ---------------------------------------------------------------------------

let capturedExporter: SpanExporter | null = null;

const { mockTracer, mockRegister, mockShutdown } = vi.hoisted(() => ({
  mockTracer: { startSpan: vi.fn() },
  mockRegister: vi.fn(),
  mockShutdown: vi.fn().mockResolvedValue(undefined),
}));

const { mockOTLPExport } = vi.hoisted(() => ({
  mockOTLPExport: vi.fn(),
}));

vi.mock('@opentelemetry/api', () => ({
  trace: {
    getTracer: vi.fn(() => mockTracer),
    getTracerProvider: vi.fn(() => ({ shutdown: mockShutdown })),
    setSpan: vi.fn(),
    getSpan: vi.fn(),
  },
  context: { active: vi.fn() },
  SpanStatusCode: { OK: 1, ERROR: 2 },
}));

vi.mock('@opentelemetry/sdk-trace-web', () => ({
  WebTracerProvider: class {
    register = mockRegister;
  },
  BatchSpanProcessor: class {
    constructor(exporter: SpanExporter) {
      capturedExporter = exporter;
    }
  },
}));

vi.mock('@opentelemetry/exporter-trace-otlp-http', () => ({
  OTLPTraceExporter: class {
    export = mockOTLPExport;
    shutdown = vi.fn().mockResolvedValue(undefined);
    forceFlush = vi.fn().mockResolvedValue(undefined);
  },
}));

vi.mock('@opentelemetry/resources', () => ({
  resourceFromAttributes: vi.fn((a: unknown) => a),
}));

vi.mock('@opentelemetry/semantic-conventions', () => ({
  ATTR_SERVICE_NAME: 'service.name',
  ATTR_SERVICE_VERSION: 'service.version',
}));

vi.mock('@opentelemetry/context-zone', () => ({
  ZoneContextManager: class {
    _noop = true;
  },
}));

vi.mock('@opentelemetry/instrumentation-fetch', () => ({
  FetchInstrumentation: class {
    enable = vi.fn();
  },
}));

vi.mock('@opentelemetry/instrumentation-xml-http-request', () => ({
  XMLHttpRequestInstrumentation: class {
    enable = vi.fn();
  },
}));

vi.mock('@opentelemetry/instrumentation-document-load', () => ({
  DocumentLoadInstrumentation: class {
    enable = vi.fn();
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EXPORTER_URL = 'http://localhost:4318/v1/traces';

function renderProvider(): SpanExporter {
  capturedExporter = null;
  const config: TracingConfig = {
    serviceName: 'test-app',
    exporter: { url: EXPORTER_URL },
  };

  renderHook(() => useTracer(), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <TracingProvider config={config}>{children}</TracingProvider>
    ),
  });

  if (!capturedExporter) {
    throw new Error('BatchSpanProcessor did not capture the exporter');
  }
  return capturedExporter;
}

const mockSpans: ReadableSpan[] = [{ name: 'test-span' } as unknown as ReadableSpan];

beforeEach(() => {
  vi.clearAllMocks();
  capturedExporter = null;
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests — createGatedExporter branches
// ---------------------------------------------------------------------------

describe('gated exporter', () => {
  it('should probe the OTLP endpoint on first export and delegate when OK', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    const exporter = renderProvider();
    const callback = vi.fn();

    exporter.export(mockSpans, callback);

    // Wait for the probe fetch to resolve
    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        EXPORTER_URL,
        expect.objectContaining({ method: 'POST' })
      );
    });

    // After successful probe, delegate.export should have been called
    await vi.waitFor(() => {
      expect(mockOTLPExport).toHaveBeenCalledWith(mockSpans, callback);
    });

    vi.unstubAllGlobals();
  });

  it('should disable export when probe returns non-OK status', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 503 });
    vi.stubGlobal('fetch', fetchMock);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const exporter = renderProvider();
    const callback = vi.fn();

    exporter.export(mockSpans, callback);

    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalledWith({ code: 0 });
    });

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('OTLP collector unavailable'));

    // Subsequent exports should short-circuit with success
    const callback2 = vi.fn();
    exporter.export(mockSpans, callback2);
    expect(callback2).toHaveBeenCalledWith({ code: 0 });

    vi.unstubAllGlobals();
  });

  it('should disable export when probe fetch throws (network error)', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.stubGlobal('fetch', fetchMock);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const exporter = renderProvider();
    const callback = vi.fn();

    exporter.export(mockSpans, callback);

    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalledWith({ code: 0 });
    });

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('OTLP collector unreachable'));

    vi.unstubAllGlobals();
  });

  it('should delegate subsequent exports after successful probe', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    const exporter = renderProvider();
    const callback1 = vi.fn();

    exporter.export(mockSpans, callback1);

    await vi.waitFor(() => {
      expect(mockOTLPExport).toHaveBeenCalledTimes(1);
    });

    // Second export should go directly to delegate without probing again
    const callback2 = vi.fn();
    exporter.export(mockSpans, callback2);

    // fetch should only have been called once (the probe)
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });

  it('should resolve shutdown when no delegate exists', async () => {
    // Do not probe, so delegate is null
    const exporter = renderProvider();

    await expect(exporter.shutdown!()).resolves.toBeUndefined();
  });

  it('should resolve forceFlush when no delegate exists', async () => {
    const exporter = renderProvider();

    await expect(exporter.forceFlush!()).resolves.toBeUndefined();
  });

  it('should delegate shutdown after successful probe', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    const exporter = renderProvider();
    const callback = vi.fn();

    exporter.export(mockSpans, callback);

    await vi.waitFor(() => {
      expect(mockOTLPExport).toHaveBeenCalled();
    });

    // Now shutdown should delegate
    await exporter.shutdown!();

    vi.unstubAllGlobals();
  });
});
