import { vi } from 'vitest';

import type { Logger } from '@granit/logger';
import type { Mock } from 'vitest';

export interface MockLogger extends Logger {
  debug: Mock<Logger['debug']>;
  info: Mock<Logger['info']>;
  warn: Mock<Logger['warn']>;
  error: Mock<Logger['error']>;
  child: Mock<(subPrefix: string) => MockLogger>;
}

/**
 * Create a mock logger that structurally satisfies the {@link @granit/logger#Logger}
 * interface. All methods are `vi.fn()` spies. The `child()` method returns the
 * same instance for easy assertion without deep nesting.
 */
export function createMockLogger(): MockLogger {
  const logger: MockLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
  };
  logger.child.mockReturnValue(logger);
  return logger;
}
