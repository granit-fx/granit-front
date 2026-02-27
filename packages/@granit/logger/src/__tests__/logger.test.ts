import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  LogLevel,
  createConsoleTransport,
  createLogger,
} from '../index.ts';

import type { LogEntry, LogTransport } from '../index.ts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockTransport(): LogTransport & {
  entries: LogEntry[];
  flush: ReturnType<typeof vi.fn>;
} {
  const entries: LogEntry[] = [];
  return {
    entries,
    send(entry: LogEntry) {
      entries.push(entry);
    },
    flush: vi.fn(async () => {}),
  };
}

// ---------------------------------------------------------------------------
// createLogger — basic API
// ---------------------------------------------------------------------------

describe('createLogger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns an object with all log methods and child', () => {
    const logger = createLogger('[Test]');
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.child).toBe('function');
  });

  it('debug includes the prefix in the output', () => {
    const logger = createLogger('[Auth]');
    logger.debug('token refreshed');
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('[Auth]'),
      expect.any(String),
      expect.any(String),
      expect.any(String),
    );
  });

  it('info includes the prefix in the output', () => {
    const logger = createLogger('[Auth]');
    logger.info('user connected');
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('[Auth]'),
      expect.any(String),
      expect.any(String),
      expect.any(String),
    );
  });

  it('warn includes the prefix in the output', () => {
    const logger = createLogger('[MyApp]');
    logger.warn('something is wrong');
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('[MyApp]'),
      expect.any(String),
      expect.any(String),
      expect.any(String),
    );
  });

  it('error includes the prefix in the output', () => {
    const logger = createLogger('[MyApp]');
    logger.error('fatal', new Error('boom'));
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('[MyApp]'),
      expect.any(String),
      expect.any(String),
      expect.any(String),
      expect.any(Error),
    );
  });

  it('debug does not pass extra args when context is omitted', () => {
    const logger = createLogger('[Test]');
    logger.debug('no context');
    // format + 3 styles = 4 args total, no trailing empty string
    expect(console.log).toHaveBeenCalledTimes(1);
    const args = vi.mocked(console.log).mock.calls[0];
    expect(args).toHaveLength(4);
  });

  it('info does not pass extra args when context is omitted', () => {
    const logger = createLogger('[Test]');
    logger.info('no context');
    const args = vi.mocked(console.info).mock.calls[0];
    expect(args).toHaveLength(4);
  });

  it('warn does not pass extra args when context is omitted', () => {
    const logger = createLogger('[Test]');
    logger.warn('no context');
    const args = vi.mocked(console.warn).mock.calls[0];
    expect(args).toHaveLength(4);
  });

  it('error does not pass extra args when no error or context', () => {
    const logger = createLogger('[Test]');
    logger.error('bare error');
    const args = vi.mocked(console.error).mock.calls[0];
    expect(args).toHaveLength(4);
  });

  it('debug passes context when provided', () => {
    const logger = createLogger('[Test]');
    const ctx = { requestId: '123' };
    logger.debug('with context', ctx);
    const args = vi.mocked(console.log).mock.calls[0];
    expect(args).toHaveLength(5);
    expect(args[4]).toBe(ctx);
  });

  it('info passes context when provided', () => {
    const logger = createLogger('[Test]');
    const ctx = { userId: 'u-42' };
    logger.info('with context', ctx);
    const args = vi.mocked(console.info).mock.calls[0];
    expect(args).toHaveLength(5);
    expect(args[4]).toBe(ctx);
  });

  it('warn passes context when provided', () => {
    const logger = createLogger('[MyApp]');
    const ctx = { userId: 'abc' };
    logger.warn('with context', ctx);
    const args = vi.mocked(console.warn).mock.calls[0];
    expect(args).toHaveLength(5);
    expect(args[4]).toBe(ctx);
  });

  it('error passes error and context when provided', () => {
    const logger = createLogger('[Test]');
    const err = new Error('boom');
    const ctx = { traceId: 'abc' };
    logger.error('with context', err, ctx);
    const args = vi.mocked(console.error).mock.calls[0];
    expect(args).toHaveLength(6);
    expect(args[4]).toBe(err);
    expect(args[5]).toBe(ctx);
  });

  it('error passes only error when context is omitted', () => {
    const logger = createLogger('[Test]');
    const err = new Error('test');
    logger.error('failure', err);
    const args = vi.mocked(console.error).mock.calls[0];
    expect(args).toHaveLength(5);
    expect(args[4]).toBe(err);
  });

  it('different prefixes produce independent loggers', () => {
    const logger1 = createLogger('[App1]');
    const logger2 = createLogger('[App2]');
    logger1.warn('msg1');
    logger2.warn('msg2');
    expect(console.warn).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('[App1]'),
      expect.any(String),
      expect.any(String),
      expect.any(String),
    );
    expect(console.warn).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('[App2]'),
      expect.any(String),
      expect.any(String),
      expect.any(String),
    );
  });
});

// ---------------------------------------------------------------------------
// createLogger — configurable level
// ---------------------------------------------------------------------------

describe('createLogger with level option', () => {
  it('level ERROR suppresses debug, info, and warn', () => {
    const transport = createMockTransport();
    const logger = createLogger('[X]', { level: 'ERROR', transports: [transport] });
    logger.debug('d');
    logger.info('i');
    logger.warn('w');
    logger.error('e', new Error('test'));
    expect(transport.entries).toHaveLength(1);
    expect(transport.entries[0].level).toBe('ERROR');
  });

  it('level WARN suppresses debug and info', () => {
    const transport = createMockTransport();
    const logger = createLogger('[X]', { level: 'WARN', transports: [transport] });
    logger.debug('d');
    logger.info('i');
    logger.warn('w');
    logger.error('e');
    expect(transport.entries).toHaveLength(2);
    expect(transport.entries[0].level).toBe('WARN');
    expect(transport.entries[1].level).toBe('ERROR');
  });

  it('level INFO suppresses debug only', () => {
    const transport = createMockTransport();
    const logger = createLogger('[X]', { level: 'INFO', transports: [transport] });
    logger.debug('d');
    logger.info('i');
    logger.warn('w');
    logger.error('e');
    expect(transport.entries).toHaveLength(3);
    expect(transport.entries[0].level).toBe('INFO');
  });

  it('level DEBUG allows all messages', () => {
    const transport = createMockTransport();
    const logger = createLogger('[X]', { level: 'DEBUG', transports: [transport] });
    logger.debug('d');
    logger.info('i');
    logger.warn('w');
    logger.error('e');
    expect(transport.entries).toHaveLength(4);
  });
});

// ---------------------------------------------------------------------------
// createLogger — custom transports
// ---------------------------------------------------------------------------

describe('createLogger with custom transports', () => {
  it('dispatches to a custom transport', () => {
    const transport = createMockTransport();
    const logger = createLogger('[App]', { transports: [transport] });
    logger.info('hello', { userId: '42' });
    expect(transport.entries).toHaveLength(1);
    expect(transport.entries[0]).toMatchObject({
      level: 'INFO',
      prefix: '[App]',
      message: 'hello',
      context: { userId: '42' },
    });
    expect(transport.entries[0].timestamp).toBeGreaterThan(0);
  });

  it('dispatches to multiple transports', () => {
    const t1 = createMockTransport();
    const t2 = createMockTransport();
    const logger = createLogger('[App]', { transports: [t1, t2] });
    logger.warn('msg');
    expect(t1.entries).toHaveLength(1);
    expect(t2.entries).toHaveLength(1);
  });

  it('includes error in LogEntry for error level', () => {
    const transport = createMockTransport();
    const logger = createLogger('[App]', { transports: [transport] });
    const err = new Error('crash');
    logger.error('oops', err, { traceId: 'abc' });
    expect(transport.entries[0]).toMatchObject({
      level: 'ERROR',
      message: 'oops',
      error: err,
      context: { traceId: 'abc' },
    });
  });
});

// ---------------------------------------------------------------------------
// child logger
// ---------------------------------------------------------------------------

describe('Logger.child', () => {
  it('combines prefixes', () => {
    const transport = createMockTransport();
    const logger = createLogger('[Auth]', { transports: [transport] });
    logger.child('[Token]').warn('expired');
    expect(transport.entries[0].prefix).toBe('[Auth] [Token]');
    expect(transport.entries[0].message).toBe('expired');
  });

  it('inherits parent level', () => {
    const transport = createMockTransport();
    const logger = createLogger('[X]', { level: 'ERROR', transports: [transport] });
    const child = logger.child('[Y]');
    child.debug('d');
    child.warn('w');
    child.error('e');
    expect(transport.entries).toHaveLength(1);
    expect(transport.entries[0].level).toBe('ERROR');
  });

  it('chains child prefixes', () => {
    const transport = createMockTransport();
    const logger = createLogger('[A]', { transports: [transport] });
    logger.child('[B]').child('[C]').info('deep');
    expect(transport.entries[0].prefix).toBe('[A] [B] [C]');
  });

  it('child is independent from parent', () => {
    const transport = createMockTransport();
    const parent = createLogger('[Parent]', { transports: [transport] });
    const child = parent.child('[Child]');
    parent.info('parent msg');
    child.info('child msg');
    expect(transport.entries[0].prefix).toBe('[Parent]');
    expect(transport.entries[1].prefix).toBe('[Parent] [Child]');
  });
});

// ---------------------------------------------------------------------------
// Exported values
// ---------------------------------------------------------------------------

describe('exported LogLevel', () => {
  it('contains expected keys and values', () => {
    expect(LogLevel.DEBUG).toBe(0);
    expect(LogLevel.INFO).toBe(1);
    expect(LogLevel.WARN).toBe(2);
    expect(LogLevel.ERROR).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// createConsoleTransport
// ---------------------------------------------------------------------------

describe('createConsoleTransport', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('routes DEBUG to console.log', () => {
    const transport = createConsoleTransport();
    transport.send({
      timestamp: Date.now(),
      level: 'DEBUG',
      prefix: '[T]',
      message: 'test',
    });
    expect(console.log).toHaveBeenCalledTimes(1);
  });

  it('routes INFO to console.info', () => {
    const transport = createConsoleTransport();
    transport.send({
      timestamp: Date.now(),
      level: 'INFO',
      prefix: '[T]',
      message: 'test',
    });
    expect(console.info).toHaveBeenCalledTimes(1);
  });

  it('routes WARN to console.warn', () => {
    const transport = createConsoleTransport();
    transport.send({
      timestamp: Date.now(),
      level: 'WARN',
      prefix: '[T]',
      message: 'test',
    });
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('routes ERROR to console.error', () => {
    const transport = createConsoleTransport();
    transport.send({
      timestamp: Date.now(),
      level: 'ERROR',
      prefix: '[T]',
      message: 'test',
    });
    expect(console.error).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Default level resolution
// ---------------------------------------------------------------------------

describe('default level', () => {
  it('defaults to DEBUG in dev mode (Vitest runs as DEV)', () => {
    // In Vitest, import.meta.env.DEV is true, so default level is DEBUG
    const transport = createMockTransport();
    const logger = createLogger('[Dev]', { transports: [transport] });
    logger.debug('should pass in dev');
    expect(transport.entries).toHaveLength(1);
    expect(transport.entries[0].level).toBe('DEBUG');
  });

  it('explicit level WARN simulates production behavior', () => {
    // Production mode sets WARN — we test the same behavior via explicit level
    const transport = createMockTransport();
    const logger = createLogger('[Prod]', { level: 'WARN', transports: [transport] });
    logger.debug('filtered');
    logger.info('filtered');
    logger.warn('passes');
    logger.error('passes');
    expect(transport.entries).toHaveLength(2);
    expect(transport.entries[0].level).toBe('WARN');
    expect(transport.entries[1].level).toBe('ERROR');
  });
});
