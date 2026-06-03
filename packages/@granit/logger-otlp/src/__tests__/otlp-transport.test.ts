import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createOtlpTransport } from '../index.ts';

import type { LogEntry } from '@granit/logger';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    timestamp: 1_700_000_000_000,
    level: 'INFO',
    prefix: '[Test]',
    message: 'hello',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createOtlpTransport', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response()))
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should buffer entries without sending immediately', () => {
    const transport = createOtlpTransport({
      endpoint: '/v1/logs',
      serviceName: 'test',
      batchSize: 10,
    });
    transport.send(makeEntry());
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should auto-flush when batchSize is reached', () => {
    const transport = createOtlpTransport({
      endpoint: '/v1/logs',
      serviceName: 'test',
      batchSize: 3,
    });
    transport.send(makeEntry());
    transport.send(makeEntry());
    expect(fetch).not.toHaveBeenCalled();
    transport.send(makeEntry());
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should auto-flush on timer when batchSize not reached', async () => {
    const transport = createOtlpTransport({
      endpoint: '/v1/logs',
      serviceName: 'test',
      batchSize: 10,
      flushInterval: 2000,
    });
    transport.send(makeEntry());
    expect(fetch).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2000);
    // flush is async — let microtasks resolve
    await vi.advanceTimersByTimeAsync(0);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should send buffered entries via fetch on flush', async () => {
    const transport = createOtlpTransport({
      endpoint: '/v1/logs',
      serviceName: 'test',
      batchSize: 100,
    });
    transport.send(makeEntry({ message: 'a' }));
    transport.send(makeEntry({ message: 'b' }));
    await transport.flush!();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should be a no-op flush when buffer is empty', async () => {
    const transport = createOtlpTransport({
      endpoint: '/v1/logs',
      serviceName: 'test',
    });
    await transport.flush!();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should clear buffer after flush', async () => {
    const transport = createOtlpTransport({
      endpoint: '/v1/logs',
      serviceName: 'test',
      batchSize: 100,
    });
    transport.send(makeEntry());
    await transport.flush!();
    expect(fetch).toHaveBeenCalledTimes(1);
    await transport.flush!();
    // Second flush should not call fetch (buffer empty)
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should send correct OTLP JSON structure', async () => {
    const transport = createOtlpTransport({
      endpoint: '/v1/logs',
      serviceName: 'guava-front',
      serviceVersion: '1.0.0',
      environment: 'development',
      batchSize: 100,
    });
    transport.send(makeEntry({ level: 'WARN', context: { userId: '42' } }));
    await transport.flush!();

    const body = JSON.parse(vi.mocked(fetch).mock.calls[0]![1]!.body as string);
    // Resource attributes
    const resourceAttrs = body.resourceLogs[0].resource.attributes;
    expect(resourceAttrs).toContainEqual({
      key: 'service.name',
      value: { stringValue: 'guava-front' },
    });
    expect(resourceAttrs).toContainEqual({
      key: 'service.version',
      value: { stringValue: '1.0.0' },
    });
    expect(resourceAttrs).toContainEqual({
      key: 'deployment.environment',
      value: { stringValue: 'development' },
    });

    // Log record
    const record = body.resourceLogs[0].scopeLogs[0].logRecords[0];
    expect(record.severityNumber).toBe(13); // WARN
    expect(record.severityText).toBe('WARN');
    expect(record.body.stringValue).toContain('[Test]');
    expect(record.body.stringValue).toContain('hello');
  });

  it('should map severity numbers correctly', async () => {
    const transport = createOtlpTransport({
      endpoint: '/v1/logs',
      serviceName: 'test',
      batchSize: 100,
    });
    transport.send(makeEntry({ level: 'DEBUG' }));
    transport.send(makeEntry({ level: 'INFO' }));
    transport.send(makeEntry({ level: 'WARN' }));
    transport.send(makeEntry({ level: 'ERROR' }));
    await transport.flush!();

    const body = JSON.parse(vi.mocked(fetch).mock.calls[0]![1]!.body as string);
    const records = body.resourceLogs[0].scopeLogs[0].logRecords;
    expect(records[0].severityNumber).toBe(5); // DEBUG
    expect(records[1].severityNumber).toBe(9); // INFO
    expect(records[2].severityNumber).toBe(13); // WARN
    expect(records[3].severityNumber).toBe(17); // ERROR
  });

  it('should include context as log attributes', async () => {
    const transport = createOtlpTransport({
      endpoint: '/v1/logs',
      serviceName: 'test',
      batchSize: 100,
    });
    transport.send(makeEntry({ context: { userId: 'abc', requestId: '123' } }));
    await transport.flush!();

    const body = JSON.parse(vi.mocked(fetch).mock.calls[0]![1]!.body as string);
    const attrs = body.resourceLogs[0].scopeLogs[0].logRecords[0].attributes;
    expect(attrs).toContainEqual({
      key: 'userId',
      value: { stringValue: 'abc' },
    });
    expect(attrs).toContainEqual({
      key: 'requestId',
      value: { stringValue: '123' },
    });
  });

  it('should include error semantic attributes', async () => {
    const transport = createOtlpTransport({
      endpoint: '/v1/logs',
      serviceName: 'test',
      batchSize: 100,
    });
    const error = new Error('boom');
    error.name = 'TypeError';
    transport.send(makeEntry({ level: 'ERROR', error }));
    await transport.flush!();

    const body = JSON.parse(vi.mocked(fetch).mock.calls[0]![1]!.body as string);
    const attrs = body.resourceLogs[0].scopeLogs[0].logRecords[0].attributes;
    expect(attrs).toContainEqual({
      key: 'exception.type',
      value: { stringValue: 'TypeError' },
    });
    expect(attrs).toContainEqual({
      key: 'exception.message',
      value: { stringValue: 'boom' },
    });
    expect(attrs).toContainEqual(expect.objectContaining({ key: 'exception.stacktrace' }));
  });

  it('should include traceId and spanId when getTraceContext is provided', async () => {
    const transport = createOtlpTransport({
      endpoint: '/v1/logs',
      serviceName: 'test',
      batchSize: 100,
      getTraceContext: () => ({ traceId: 'trace-abc', spanId: 'span-def' }),
    });
    transport.send(makeEntry());
    await transport.flush!();

    const body = JSON.parse(vi.mocked(fetch).mock.calls[0]![1]!.body as string);
    const record = body.resourceLogs[0].scopeLogs[0].logRecords[0];
    expect(record.traceId).toBe('trace-abc');
    expect(record.spanId).toBe('span-def');
  });

  it('should use empty traceId/spanId when getTraceContext is not provided', async () => {
    const transport = createOtlpTransport({
      endpoint: '/v1/logs',
      serviceName: 'test',
      batchSize: 100,
    });
    transport.send(makeEntry());
    await transport.flush!();

    const body = JSON.parse(vi.mocked(fetch).mock.calls[0]![1]!.body as string);
    const record = body.resourceLogs[0].scopeLogs[0].logRecords[0];
    expect(record.traceId).toBe('');
    expect(record.spanId).toBe('');
  });

  it('should send correct Content-Type and custom headers', async () => {
    const transport = createOtlpTransport({
      endpoint: '/v1/logs',
      serviceName: 'test',
      headers: { 'X-Custom': 'value' },
      batchSize: 100,
    });
    transport.send(makeEntry());
    await transport.flush!();

    const init = vi.mocked(fetch).mock.calls[0]![1]!;
    const headers = init.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['X-Custom']).toBe('value');
  });

  it('should use keepalive for reliable delivery on unload', async () => {
    const transport = createOtlpTransport({
      endpoint: '/v1/logs',
      serviceName: 'test',
      batchSize: 100,
    });
    transport.send(makeEntry());
    await transport.flush!();

    const init = vi.mocked(fetch).mock.calls[0]![1]!;
    expect(init.keepalive).toBe(true);
  });

  it('redacts PII in the body and attributes by default (VULN-205)', async () => {
    const transport = createOtlpTransport({
      endpoint: '/v1/logs',
      serviceName: 'test',
      batchSize: 100,
    });
    transport.send(
      makeEntry({ message: 'login john.doe@example.com', context: { email: 'a@b.com' } })
    );
    await transport.flush!();

    const body = vi.mocked(fetch).mock.calls[0]![1]!.body as string;
    // Raw email addresses must not reach the collector when no redactor is set.
    expect(body).not.toContain('john.doe@example.com');
    expect(body).not.toContain('a@b.com');
  });

  it('honors an explicit opt-out via identity redactor', async () => {
    const transport = createOtlpTransport({
      endpoint: '/v1/logs',
      serviceName: 'test',
      batchSize: 100,
      redact: (s) => s,
    });
    transport.send(makeEntry({ message: 'login john.doe@example.com' }));
    await transport.flush!();

    const body = vi.mocked(fetch).mock.calls[0]![1]!.body as string;
    expect(body).toContain('john.doe@example.com');
  });

  it('should not throw when fetch fails', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network error'));
    const transport = createOtlpTransport({
      endpoint: '/v1/logs',
      serviceName: 'test',
      batchSize: 100,
    });
    transport.send(makeEntry());
    // Should not throw
    await expect(transport.flush!()).resolves.toBeUndefined();
  });
});
