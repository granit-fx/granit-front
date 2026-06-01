import { describe, expect, it } from 'vitest';

import { createMockLogger } from '../mock-logger';

describe('createMockLogger', () => {
  it('returns an object with debug, info, warn, error, child as mock functions', () => {
    const logger = createMockLogger();

    for (const method of ['debug', 'info', 'warn', 'error', 'child'] as const) {
      expect(logger[method]).toEqual(expect.any(Function));
    }
  });

  it('allows calling log methods without throwing', () => {
    const logger = createMockLogger();

    expect(() => logger.debug('msg')).not.toThrow();
    expect(() => logger.info('msg', { key: 'value' })).not.toThrow();
    expect(() => logger.warn('msg')).not.toThrow();
    expect(() => logger.error('msg', new Error('fail'), { key: 'value' })).not.toThrow();
  });

  it('tracks calls for assertion', () => {
    const logger = createMockLogger();

    logger.info('hello', { ctx: true });

    expect(logger.info).toHaveBeenCalledWith('hello', { ctx: true });
    expect(logger.info).toHaveBeenCalledTimes(1);
  });

  it('child() returns the same mock instance', () => {
    const logger = createMockLogger();
    const child = logger.child('sub');

    expect(child).toBe(logger);
    expect(logger.child).toHaveBeenCalledWith('sub');
  });
});
