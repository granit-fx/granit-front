import { INVOICE_WORKFLOW_STATES } from '../constants';
import { logger } from '../logger';

describe('INVOICE_WORKFLOW_STATES', () => {
  it('should list the five invoice workflow states in order', () => {
    expect(INVOICE_WORKFLOW_STATES).toEqual([
      'Draft',
      'Open',
      'Paid',
      'Cancelled',
      'Uncollectible',
    ]);
  });
});

describe('logger', () => {
  it('should expose a logger instance with the standard log methods', () => {
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.info).toBe('function');
  });
});
