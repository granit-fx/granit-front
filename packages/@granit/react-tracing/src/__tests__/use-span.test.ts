import { SpanStatusCode, context, trace } from '@opentelemetry/api';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSpan } from '../hooks/use-span.js';

import type { Span } from '@opentelemetry/api';

// ---------------------------------------------------------------------------
// Mock OpenTelemetry
// ---------------------------------------------------------------------------

const mockSpan: Span = {
  setStatus: vi.fn(),
  recordException: vi.fn(),
  end: vi.fn(),
  spanContext: vi.fn().mockReturnValue({ traceId: 'a', spanId: 'b', traceFlags: 1 }),
  setAttribute: vi.fn(),
  setAttributes: vi.fn(),
  addEvent: vi.fn(),
  addLink: vi.fn(),
  addLinks: vi.fn(),
  updateName: vi.fn(),
  isRecording: vi.fn().mockReturnValue(true),
};

const mockTracer = {
  startSpan: vi.fn(() => mockSpan),
};

vi.mock('@opentelemetry/api', async () => {
  const actual = await vi.importActual('@opentelemetry/api');
  return {
    ...actual,
    context: {
      active: vi.fn(() => ({})),
      with: vi.fn((_ctx: unknown, fn: () => unknown) => fn()),
    },
    trace: {
      setSpan: vi.fn((_ctx: unknown, _span: unknown) => ({})),
      getSpan: vi.fn(),
    },
    SpanStatusCode: actual.SpanStatusCode,
  };
});

// ---------------------------------------------------------------------------
// Mock TracingProvider context
// ---------------------------------------------------------------------------

vi.mock('../providers/tracing-provider.js', () => ({
  useTracingConfig: () => mockTracer,
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useSpan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('withSpan', () => {
    it('should create, execute, and end a span', async () => {
      const { result } = renderHook(() => useSpan());

      const returnValue = await result.current.withSpan('test-op', () => 42);

      expect(returnValue).toBe(42);
      expect(mockTracer.startSpan).toHaveBeenCalledWith('test-op');
      expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.OK });
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it('should handle async functions', async () => {
      const { result } = renderHook(() => useSpan());

      const returnValue = await result.current.withSpan('async-op', async () => {
        return 'async-result';
      });

      expect(returnValue).toBe('async-result');
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it('should record errors and re-throw', async () => {
      const { result } = renderHook(() => useSpan());
      const error = new Error('test failure');

      await expect(
        result.current.withSpan('failing-op', () => {
          throw error;
        })
      ).rejects.toThrow('test failure');

      expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR });
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it('should set the span in the active context', async () => {
      const { result } = renderHook(() => useSpan());

      await result.current.withSpan('ctx-op', () => undefined);

      expect(trace.setSpan).toHaveBeenCalledWith(context.active(), mockSpan);
      expect(context.with).toHaveBeenCalled();
    });

    it('should handle non-Error thrown values without calling recordException', async () => {
      const { result } = renderHook(() => useSpan());

      await expect(
        result.current.withSpan('non-error-op', () => {
          throw 'string-error'; // NOSONAR — intentionally testing non-Error thrown value
        })
      ).rejects.toBe('string-error');

      expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR });
      expect(mockSpan.recordException).not.toHaveBeenCalled();
      expect(mockSpan.end).toHaveBeenCalled();
    });
  });

  describe('createSpan', () => {
    it('should create a span with the given name', () => {
      const { result } = renderHook(() => useSpan());

      const span = result.current.createSpan('manual-span');

      expect(span).toBe(mockSpan);
      expect(mockTracer.startSpan).toHaveBeenCalledWith('manual-span', undefined);
    });

    it('should forward span options', () => {
      const { result } = renderHook(() => useSpan());
      const options = { attributes: { 'test.key': 'value' } };

      result.current.createSpan('options-span', options);

      expect(mockTracer.startSpan).toHaveBeenCalledWith('options-span', options);
    });
  });
});
