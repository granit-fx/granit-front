import { context, trace } from '@opentelemetry/api';
import { describe, expect, it, vi } from 'vitest';

import { getTraceContext } from '../trace-context';

vi.mock('@opentelemetry/api', () => {
  const mockContext = { active: vi.fn() };
  const mockTrace = { getSpan: vi.fn() };
  return { context: mockContext, trace: mockTrace };
});

describe('getTraceContext', () => {
  it('should return undefined when no active span', () => {
    vi.mocked(trace.getSpan).mockReturnValue(undefined);

    const result = getTraceContext();

    expect(result).toBeUndefined();
    expect(trace.getSpan).toHaveBeenCalledWith(context.active());
  });

  it('should return trace and span IDs from active span', () => {
    const mockSpan = {
      spanContext: () => ({
        traceId: 'abc123def456',
        spanId: '789xyz',
        traceFlags: 1,
      }),
    };
    vi.mocked(trace.getSpan).mockReturnValue(mockSpan as never);

    const result = getTraceContext();

    expect(result).toEqual({
      traceId: 'abc123def456',
      spanId: '789xyz',
    });
  });

  it('should return undefined when span context has empty traceId', () => {
    const mockSpan = {
      spanContext: () => ({
        traceId: '',
        spanId: '789xyz',
        traceFlags: 1,
      }),
    };
    vi.mocked(trace.getSpan).mockReturnValue(mockSpan as never);

    const result = getTraceContext();

    expect(result).toBeUndefined();
  });

  it('should return undefined when span context has empty spanId', () => {
    const mockSpan = {
      spanContext: () => ({
        traceId: 'abc123',
        spanId: '',
        traceFlags: 1,
      }),
    };
    vi.mocked(trace.getSpan).mockReturnValue(mockSpan as never);

    const result = getTraceContext();

    expect(result).toBeUndefined();
  });
});
