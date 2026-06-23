import { INVOICE_WORKFLOW_STATES } from '../constants';
import { formatCurrency } from '../lib/format-currency';
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

describe('formatCurrency', () => {
  it('should format minor units as a locale-aware currency string', () => {
    expect(formatCurrency(12100, 'EUR', 'en')).toBe('€121.00');
  });

  it('should respect the requested locale for separators', () => {
    // French formatting uses a comma decimal separator and a trailing symbol.
    const formatted = formatCurrency(123456, 'EUR', 'fr-FR');
    expect(formatted).toContain('234,56');
    expect(formatted).toContain('€');
  });

  it('should fall back to the runtime default locale when none is given', () => {
    expect(formatCurrency(5000, 'USD')).toContain('50');
  });
});
