import { describe, expect, it } from 'vitest';

import {
  metadataEntrySchema,
  partyAddressSchema,
  partyCreateSchema,
  partyEmailSchema,
  partyExternalMappingSchema,
  partyPhoneSchema,
  partyTaxStatusSchema,
} from '../validation';

const t = ((key: string) => key) as unknown as Parameters<typeof partyCreateSchema>[0];

// ---------------------------------------------------------------------------
// partyCreateSchema
// ---------------------------------------------------------------------------

describe('partyCreateSchema', () => {
  const schema = partyCreateSchema(t);

  const validData = {
    kind: 'Individual',
    name: 'Alice Martin',
    defaultCurrency: 'EUR',
    role: 'None',
    website: null,
    language: null,
    timezone: null,
    internalNotes: null,
  };

  it('accepts valid minimal data', () => {
    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects an empty name', () => {
    const result = schema.safeParse({ ...validData, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid currency code (too short)', () => {
    const result = schema.safeParse({ ...validData, defaultCurrency: 'EU' });
    expect(result.success).toBe(false);
  });

  it('rejects a lowercase currency code', () => {
    const result = schema.safeParse({ ...validData, defaultCurrency: 'eur' });
    expect(result.success).toBe(false);
  });

  it('accepts a valid URL', () => {
    const result = schema.safeParse({ ...validData, website: 'https://example.com' });
    expect(result.success).toBe(true);
  });

  it('rejects a URL with numeric-only TLD', () => {
    const result = schema.safeParse({ ...validData, website: 'https://example.123' });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues.map((i) => i.message)).toContain('Validation.InvalidUrl');
  });

  it('rejects a URL with a single-label hostname', () => {
    const result = schema.safeParse({ ...validData, website: 'https://localhost-but-not' });
    expect(result.success).toBe(false);
  });

  it('accepts localhost as website', () => {
    const result = schema.safeParse({ ...validData, website: 'http://localhost:3000' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid kind', () => {
    const result = schema.safeParse({ ...validData, kind: 'Robot' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid role', () => {
    const result = schema.safeParse({ ...validData, role: 'InvalidRole' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// partyAddressSchema
// ---------------------------------------------------------------------------

describe('partyAddressSchema', () => {
  const schema = partyAddressSchema(t);

  const validData = {
    kind: 'Billing',
    line1: '1 Main Street',
    city: 'Brussels',
    postalCode: '1000',
    country: 'BE',
    line2: null,
    state: null,
    companyName: null,
    label: null,
  };

  it('accepts valid data', () => {
    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects an empty line1', () => {
    const result = schema.safeParse({ ...validData, line1: '' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty city', () => {
    const result = schema.safeParse({ ...validData, city: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a country code longer than 2 characters', () => {
    const result = schema.safeParse({ ...validData, country: 'BEL' });
    expect(result.success).toBe(false);
  });

  it('rejects a lowercase country code', () => {
    const result = schema.safeParse({ ...validData, country: 'be' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid kind', () => {
    const result = schema.safeParse({ ...validData, kind: 'Unknown' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// partyEmailSchema
// ---------------------------------------------------------------------------

describe('partyEmailSchema', () => {
  const schema = partyEmailSchema(t);

  it('accepts a valid email', () => {
    const result = schema.safeParse({ address: 'alice@example.com', label: null });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = schema.safeParse({ address: 'not-an-email', label: null });
    expect(result.success).toBe(false);
  });

  it('rejects an empty address', () => {
    const result = schema.safeParse({ address: '', label: null });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// partyPhoneSchema
// ---------------------------------------------------------------------------

describe('partyPhoneSchema', () => {
  const schema = partyPhoneSchema(t);

  it('accepts a valid E.164 phone number', () => {
    const result = schema.safeParse({ kind: 'Mobile', number: '+32479123456', label: null });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid phone number', () => {
    const result = schema.safeParse({ kind: 'Mobile', number: '123', label: null });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues.map((i) => i.message)).toContain('Parties.Phones.InvalidNumber');
  });

  it('rejects an empty number', () => {
    const result = schema.safeParse({ kind: 'Mobile', number: '', label: null });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid kind', () => {
    const result = schema.safeParse({ kind: 'Satellite', number: '+32479123456', label: null });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// partyTaxStatusSchema
// ---------------------------------------------------------------------------

describe('partyTaxStatusSchema', () => {
  const schema = partyTaxStatusSchema(t);

  it('accepts valid tax status', () => {
    const result = schema.safeParse({ isExempt: false, reverseCharge: false, vatin: null });
    expect(result.success).toBe(true);
  });

  it('rejects exempt + reverseCharge simultaneously', () => {
    const result = schema.safeParse({ isExempt: true, reverseCharge: true, vatin: null });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues.map((i) => i.message)).toContain(
        'Parties.Validation.ExemptAndReverseCharge'
      );
  });

  it('rejects reverseCharge without vatin', () => {
    const result = schema.safeParse({ isExempt: false, reverseCharge: true, vatin: null });
    expect(result.success).toBe(false);
  });

  it('accepts reverseCharge with a vatin', () => {
    const result = schema.safeParse({
      isExempt: false,
      reverseCharge: true,
      vatin: 'BE0123456789',
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// partyExternalMappingSchema
// ---------------------------------------------------------------------------

describe('partyExternalMappingSchema', () => {
  const schema = partyExternalMappingSchema(t);

  it('accepts valid data', () => {
    const result = schema.safeParse({ providerName: 'Stripe', externalId: 'cus_123' });
    expect(result.success).toBe(true);
  });

  it('rejects empty providerName', () => {
    const result = schema.safeParse({ providerName: '', externalId: 'cus_123' });
    expect(result.success).toBe(false);
  });

  it('rejects empty externalId', () => {
    const result = schema.safeParse({ providerName: 'Stripe', externalId: '' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// metadataEntrySchema
// ---------------------------------------------------------------------------

describe('metadataEntrySchema', () => {
  const schema = metadataEntrySchema(t);

  it('accepts valid data', () => {
    const result = schema.safeParse({ key: 'source', value: 'crm' });
    expect(result.success).toBe(true);
  });

  it('rejects empty key', () => {
    const result = schema.safeParse({ key: '', value: 'crm' });
    expect(result.success).toBe(false);
  });

  it('accepts empty value', () => {
    const result = schema.safeParse({ key: 'source', value: '' });
    expect(result.success).toBe(true);
  });

  it('rejects key exceeding 40 characters', () => {
    const result = schema.safeParse({ key: 'a'.repeat(41), value: 'v' });
    expect(result.success).toBe(false);
  });

  it('rejects value exceeding 500 characters', () => {
    const result = schema.safeParse({ key: 'k', value: 'a'.repeat(501) });
    expect(result.success).toBe(false);
  });
});
