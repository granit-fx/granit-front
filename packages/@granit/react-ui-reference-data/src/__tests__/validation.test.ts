import { logger } from '../logger';
import { createReferenceDataConstraints, editReferenceDataConstraints } from '../validation';

describe('package logger', () => {
  it('exposes a logger instance with the standard methods', () => {
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.info).toBe('function');
  });
});

describe('reference-data constraints', () => {
  describe('createReferenceDataConstraints', () => {
    it('requires code and labelEn', () => {
      expect(createReferenceDataConstraints.code?.required).toBe(true);
      expect(createReferenceDataConstraints.labelEn?.required).toBe(true);
    });

    it('constrains the code to the uppercase pattern with a hint', () => {
      expect(createReferenceDataConstraints.code?.pattern).toBe('^[A-Z0-9_-]+$');
      expect(createReferenceDataConstraints.code?.maxLength).toBe(50);
      expect(createReferenceDataConstraints.code?.patternHint).toBe(
        'Validation:Hints:ReferenceDataCode'
      );
    });

    it('caps all label fields at 250 characters', () => {
      expect(createReferenceDataConstraints.labelEn?.maxLength).toBe(250);
      expect(createReferenceDataConstraints.labelFr?.maxLength).toBe(250);
      expect(createReferenceDataConstraints.labelNl?.maxLength).toBe(250);
      expect(createReferenceDataConstraints.labelDe?.maxLength).toBe(250);
    });

    it('declares date format on validity fields and a non-negative sortOrder', () => {
      expect(createReferenceDataConstraints.validFrom?.format).toBe('date');
      expect(createReferenceDataConstraints.validTo?.format).toBe('date');
      expect(createReferenceDataConstraints.sortOrder?.minimum).toBe(0);
    });
  });

  describe('editReferenceDataConstraints', () => {
    it('drops the immutable code field', () => {
      expect(editReferenceDataConstraints.code).toBeUndefined();
    });

    it('still requires labelEn', () => {
      expect(editReferenceDataConstraints.labelEn?.required).toBe(true);
      expect(editReferenceDataConstraints.labelEn?.maxLength).toBe(250);
    });

    it('keeps the validity and parentCode constraints', () => {
      expect(editReferenceDataConstraints.validFrom?.format).toBe('date');
      expect(editReferenceDataConstraints.parentCode?.maxLength).toBe(50);
    });
  });
});
