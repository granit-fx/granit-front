import { renderHook } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TracingProvider, useTracingConfig, useTracer } from '../providers/tracing-provider.js';

import type { TracingConfig } from '@granit/tracing';

// ---------------------------------------------------------------------------
// Mock OpenTelemetry
// ---------------------------------------------------------------------------

const { mockTracer, mockShutdown, mockRegister, mockResourceFromAttributes } = vi.hoisted(() => ({
  mockTracer: { startSpan: vi.fn() },
  mockShutdown: vi.fn().mockResolvedValue(undefined),
  mockRegister: vi.fn(),
  mockResourceFromAttributes: vi.fn((attrs: Record<string, string>) => attrs),
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

vi.mock('@opentelemetry/sdk-trace-web', () => {
  class MockWebTracerProvider {
    register = mockRegister;
  }
  return {
    WebTracerProvider: MockWebTracerProvider,
    BatchSpanProcessor: class {
      /* empty mock */
    },
  };
});

vi.mock('@opentelemetry/exporter-trace-otlp-http', () => ({
  OTLPTraceExporter: class {
    /* empty mock */
  },
}));

vi.mock('@opentelemetry/resources', () => ({
  resourceFromAttributes: mockResourceFromAttributes,
}));

vi.mock('@opentelemetry/semantic-conventions', () => ({
  ATTR_SERVICE_NAME: 'service.name',
  ATTR_SERVICE_VERSION: 'service.version',
}));

vi.mock('@opentelemetry/context-zone', () => ({
  ZoneContextManager: class {
    /* empty mock */
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

const DEFAULT_CONFIG: TracingConfig = {
  serviceName: 'test-app',
  exporter: { url: '/v1/traces' },
};

function createWrapper(config: TracingConfig = DEFAULT_CONFIG) {
  return ({ children }: { children: React.ReactNode }) => (
    <TracingProvider config={config}>{children}</TracingProvider>
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TracingProvider', () => {
  it('should provide a tracer via useTracingConfig()', () => {
    const { result } = renderHook(() => useTracingConfig(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBe(mockTracer);
  });

  it('should register the WebTracerProvider', () => {
    renderHook(() => useTracingConfig(), { wrapper: createWrapper() });

    expect(mockRegister).toHaveBeenCalled();
  });

  it('should call shutdown on unmount', () => {
    const { unmount } = renderHook(() => useTracingConfig(), {
      wrapper: createWrapper(),
    });

    unmount();

    expect(mockShutdown).toHaveBeenCalled();
  });

  it('should include serviceVersion in resource attributes when provided', () => {
    const config: TracingConfig = {
      serviceName: 'test-app',
      serviceVersion: '1.2.3',
      exporter: { url: '/v1/traces' },
    };

    renderHook(() => useTracingConfig(), { wrapper: createWrapper(config) });

    expect(mockResourceFromAttributes).toHaveBeenCalledWith(
      expect.objectContaining({ 'service.version': '1.2.3' })
    );
  });

  it('should not include serviceVersion when omitted', () => {
    renderHook(() => useTracingConfig(), { wrapper: createWrapper() });

    const callArgs = mockResourceFromAttributes.mock.calls[0]![0] as Record<string, string>;
    expect(callArgs).not.toHaveProperty('service.version');
  });

  it('should skip fetch instrumentation when instrumentFetch is false', () => {
    const config: TracingConfig = {
      serviceName: 'test-app',
      exporter: { url: '/v1/traces' },
      instrumentFetch: false,
      instrumentXhr: true,
      instrumentDocumentLoad: true,
    };

    renderHook(() => useTracingConfig(), { wrapper: createWrapper(config) });

    // Provider still registers successfully
    expect(mockRegister).toHaveBeenCalled();
  });

  it('should skip XHR instrumentation when instrumentXhr is false', () => {
    const config: TracingConfig = {
      serviceName: 'test-app',
      exporter: { url: '/v1/traces' },
      instrumentFetch: true,
      instrumentXhr: false,
      instrumentDocumentLoad: true,
    };

    renderHook(() => useTracingConfig(), { wrapper: createWrapper(config) });

    expect(mockRegister).toHaveBeenCalled();
  });

  it('should skip document-load instrumentation when instrumentDocumentLoad is false', () => {
    const config: TracingConfig = {
      serviceName: 'test-app',
      exporter: { url: '/v1/traces' },
      instrumentFetch: true,
      instrumentXhr: true,
      instrumentDocumentLoad: false,
    };

    renderHook(() => useTracingConfig(), { wrapper: createWrapper(config) });

    expect(mockRegister).toHaveBeenCalled();
  });

  it('should skip all instrumentations when all are disabled', () => {
    const config: TracingConfig = {
      serviceName: 'test-app',
      exporter: { url: '/v1/traces' },
      instrumentFetch: false,
      instrumentXhr: false,
      instrumentDocumentLoad: false,
    };

    renderHook(() => useTracingConfig(), { wrapper: createWrapper(config) });

    expect(mockRegister).toHaveBeenCalled();
  });

  it('should handle additional instrumentations without enable method', () => {
    const instrumentationWithoutEnable = {} as never;
    const config: TracingConfig = {
      serviceName: 'test-app',
      exporter: { url: '/v1/traces' },
      additionalInstrumentations: [instrumentationWithoutEnable],
    };

    renderHook(() => useTracingConfig(), { wrapper: createWrapper(config) });

    expect(mockRegister).toHaveBeenCalled();
  });

  it('should handle unmount when tracer provider has no shutdown method', async () => {
    const { trace } = await import('@opentelemetry/api');
    vi.mocked(trace.getTracerProvider).mockReturnValueOnce({} as never);

    const { unmount } = renderHook(() => useTracingConfig(), {
      wrapper: createWrapper(),
    });

    // Should not throw when shutdown is missing
    expect(() => unmount()).not.toThrow();
  });
});

describe('useTracingConfig', () => {
  it('should throw when used outside TracingProvider', () => {
    expect(() => renderHook(() => useTracingConfig())).toThrowError(
      'useTracingConfig must be used within a TracingProvider'
    );
  });

  it('should still work via deprecated useTracer alias', () => {
    expect(() => renderHook(() => useTracer())).toThrowError(
      'useTracingConfig must be used within a TracingProvider'
    );
  });
});
