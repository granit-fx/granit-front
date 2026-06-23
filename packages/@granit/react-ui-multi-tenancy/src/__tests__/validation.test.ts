import { describe, expect, it } from 'vitest';

import { createTenantSchema, editTenantSchema } from '../validation';

describe('createTenantSchema', () => {
  const validData = {
    name: 'Acme Corp',
    identifier: 'acme-corp',
  };

  it('accepts valid minimal data', () => {
    const result = createTenantSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('accepts valid data with all optional fields', () => {
    const result = createTenantSchema.safeParse({
      ...validData,
      contactEmail: 'admin@acme.com',
      jurisdiction: 'BE',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty string for optional contactEmail', () => {
    const result = createTenantSchema.safeParse({ ...validData, contactEmail: '' });
    expect(result.success).toBe(true);
  });

  it('accepts empty string for optional jurisdiction', () => {
    const result = createTenantSchema.safeParse({ ...validData, jurisdiction: '' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty name', () => {
    const result = createTenantSchema.safeParse({ ...validData, name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.message)).toContain('Name is required');
    }
  });

  it('rejects a name exceeding 256 characters', () => {
    const result = createTenantSchema.safeParse({ ...validData, name: 'a'.repeat(257) });
    expect(result.success).toBe(false);
  });

  it('rejects an empty identifier', () => {
    const result = createTenantSchema.safeParse({ ...validData, identifier: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.message)).toContain('Identifier is required');
    }
  });

  it('rejects an identifier exceeding 64 characters', () => {
    const result = createTenantSchema.safeParse({ ...validData, identifier: 'a'.repeat(65) });
    expect(result.success).toBe(false);
  });

  it('rejects an identifier with uppercase letters', () => {
    const result = createTenantSchema.safeParse({ ...validData, identifier: 'AcmeCorp' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.message)).toContain(
        'Must be a lowercase slug (e.g. acme-corp)'
      );
    }
  });

  it('rejects an identifier with spaces', () => {
    const result = createTenantSchema.safeParse({ ...validData, identifier: 'acme corp' });
    expect(result.success).toBe(false);
  });

  it('rejects an identifier with special characters', () => {
    const result = createTenantSchema.safeParse({ ...validData, identifier: 'acme_corp' });
    expect(result.success).toBe(false);
  });

  it('accepts a valid slug with numbers', () => {
    const result = createTenantSchema.safeParse({ ...validData, identifier: 'tenant-42' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid contactEmail', () => {
    const result = createTenantSchema.safeParse({ ...validData, contactEmail: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects a jurisdiction exceeding 16 characters', () => {
    const result = createTenantSchema.safeParse({
      ...validData,
      jurisdiction: 'a'.repeat(17),
    });
    expect(result.success).toBe(false);
  });
});

describe('editTenantSchema', () => {
  const validData = {
    name: 'Acme Corp Updated',
  };

  it('accepts valid minimal data', () => {
    const result = editTenantSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('accepts all optional fields', () => {
    const result = editTenantSchema.safeParse({
      ...validData,
      contactEmail: 'admin@acme.com',
      jurisdiction: 'BE',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty strings for optional fields', () => {
    const result = editTenantSchema.safeParse({
      ...validData,
      contactEmail: '',
      jurisdiction: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty name', () => {
    const result = editTenantSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.message)).toContain('Name is required');
    }
  });

  it('rejects an invalid contactEmail', () => {
    const result = editTenantSchema.safeParse({ ...validData, contactEmail: 'bad' });
    expect(result.success).toBe(false);
  });

  it('rejects a jurisdiction exceeding 16 characters', () => {
    const result = editTenantSchema.safeParse({ ...validData, jurisdiction: 'a'.repeat(17) });
    expect(result.success).toBe(false);
  });
});
