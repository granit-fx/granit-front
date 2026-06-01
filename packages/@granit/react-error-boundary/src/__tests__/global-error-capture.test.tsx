import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GlobalErrorCapture } from '../components/global-error-capture';

import type { Logger } from '@granit/logger';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockLogger(): Logger {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
  } as unknown as Logger;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GlobalErrorCapture', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should register error and unhandledrejection listeners on mount', () => {
    const addSpy = vi.spyOn(globalThis, 'addEventListener');
    const logger = createMockLogger();

    render(<GlobalErrorCapture logger={logger} />);

    expect(addSpy).toHaveBeenCalledWith('error', expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
  });

  it('should remove listeners on unmount', () => {
    const removeSpy = vi.spyOn(globalThis, 'removeEventListener');
    const logger = createMockLogger();

    const { unmount } = render(<GlobalErrorCapture logger={logger} />);
    unmount();

    expect(removeSpy).toHaveBeenCalledWith('error', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
  });

  it('should log window.error events', () => {
    const logger = createMockLogger();
    render(<GlobalErrorCapture logger={logger} />);

    const errorEvent = new ErrorEvent('error', {
      error: new Error('Global error'),
      message: 'Global error',
      filename: 'app.js',
      lineno: 42,
      colno: 10,
    });
    globalThis.dispatchEvent(errorEvent);

    expect(logger.error).toHaveBeenCalledWith(
      'Uncaught error',
      expect.objectContaining({ message: 'Global error' }),
      expect.objectContaining({
        filename: 'app.js',
        lineno: 42,
        colno: 10,
      })
    );
  });

  it('should log unhandled promise rejections', () => {
    const logger = createMockLogger();
    render(<GlobalErrorCapture logger={logger} />);

    const event = new PromiseRejectionEvent('unhandledrejection', {
      promise: Promise.resolve(),
      reason: new Error('Rejected!'),
    });
    globalThis.dispatchEvent(event);

    expect(logger.error).toHaveBeenCalledWith(
      'Unhandled promise rejection',
      expect.objectContaining({ message: 'Rejected!' })
    );
  });

  it('should call onError callback', () => {
    const logger = createMockLogger();
    const onError = vi.fn();
    render(<GlobalErrorCapture logger={logger} onError={onError} />);

    const errorEvent = new ErrorEvent('error', {
      error: new Error('Callback test'),
      message: 'Callback test',
    });
    globalThis.dispatchEvent(errorEvent);

    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Callback test' }));
  });

  it('should deduplicate errors with the same message within 1 second', () => {
    const logger = createMockLogger();
    render(<GlobalErrorCapture logger={logger} />);

    const createEvent = () =>
      new ErrorEvent('error', {
        error: new Error('Duplicate'),
        message: 'Duplicate',
      });

    globalThis.dispatchEvent(createEvent());
    globalThis.dispatchEvent(createEvent());
    globalThis.dispatchEvent(createEvent());

    expect(logger.error).toHaveBeenCalledTimes(1);
  });

  it('should handle non-Error rejection reasons', () => {
    const logger = createMockLogger();
    render(<GlobalErrorCapture logger={logger} />);

    const event = new PromiseRejectionEvent('unhandledrejection', {
      promise: Promise.resolve(),
      reason: 'string error',
    });
    globalThis.dispatchEvent(event);

    expect(logger.error).toHaveBeenCalledWith(
      'Unhandled promise rejection',
      expect.objectContaining({ message: 'string error' })
    );
  });

  it('should wrap non-Error event.error in handleError', () => {
    const logger = createMockLogger();
    render(<GlobalErrorCapture logger={logger} />);

    const errorEvent = new ErrorEvent('error', {
      error: 'not-an-error-object',
      message: 'fallback message',
    });
    globalThis.dispatchEvent(errorEvent);

    expect(logger.error).toHaveBeenCalledWith(
      'Uncaught error',
      expect.objectContaining({ message: 'fallback message' }),
      expect.objectContaining({})
    );
  });

  it('should use default message when event.error is not Error and message is empty', () => {
    const logger = createMockLogger();
    render(<GlobalErrorCapture logger={logger} />);

    const errorEvent = new ErrorEvent('error', {
      error: null,
      message: '',
    });
    globalThis.dispatchEvent(errorEvent);

    expect(logger.error).toHaveBeenCalledWith(
      'Uncaught error',
      expect.objectContaining({ message: 'Unknown error' }),
      expect.objectContaining({})
    );
  });

  it('should use default message for nullish rejection reason', () => {
    const logger = createMockLogger();
    render(<GlobalErrorCapture logger={logger} />);

    const event = new PromiseRejectionEvent('unhandledrejection', {
      promise: Promise.resolve(),
      reason: null,
    });
    globalThis.dispatchEvent(event);

    expect(logger.error).toHaveBeenCalledWith(
      'Unhandled promise rejection',
      expect.objectContaining({ message: 'Unhandled promise rejection' })
    );
  });

  it('should use default message for undefined rejection reason', () => {
    const logger = createMockLogger();
    render(<GlobalErrorCapture logger={logger} />);

    const event = new PromiseRejectionEvent('unhandledrejection', {
      promise: Promise.resolve(),
      reason: undefined,
    });
    globalThis.dispatchEvent(event);

    expect(logger.error).toHaveBeenCalledWith(
      'Unhandled promise rejection',
      expect.objectContaining({ message: 'Unhandled promise rejection' })
    );
  });
});
