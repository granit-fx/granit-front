import { describe, expect, it } from 'vitest';

import {
  createPartyAddressResolver,
  createPartyCreateResolver,
  createPartyEmailResolver,
  createPartyExternalMappingResolver,
  createPartyPhoneResolver,
  createPartyTaxStatusResolver,
  metadataLimits,
} from '../validation';

import type { Resolver } from 'react-hook-form';

// The resolvers translate via the host-provided keys. For assertions we only need
// the few keys whose exact string the original zod tests checked
// (`Validation.InvalidUrl`, `Parties.Phones.InvalidNumber`,
// `Parties.Validation.ExemptAndReverseCharge`, `Validation.Required`). Everything
// else (`Validation:Builtin:*`) is passed through verbatim — enough to detect
// "an error exists on this field".
const MESSAGES: Record<string, string> = {
  'Validation.InvalidUrl': 'Validation.InvalidUrl',
  'Validation.Required': 'Validation.Required',
  'Parties.Phones.InvalidNumber': 'Parties.Phones.InvalidNumber',
  'Parties.Validation.ExemptAndReverseCharge': 'Parties.Validation.ExemptAndReverseCharge',
};

const t = ((key: string) => MESSAGES[key] ?? key) as unknown as Parameters<
  typeof createPartyCreateResolver
>[0];

// Drives a resolver factory the way react-hook-form does: builds a `fields` map
// (one entry per key) and returns the resolver's flat error map.
async function run<T extends Record<string, unknown>>(
  resolver: Resolver<T>,
  values: T
): Promise<Record<string, { type: string; message: string }>> {
  const fields = Object.fromEntries(Object.keys(values).map((name) => [name, { name }])) as Record<
    string,
    { name: string }
  >;
  // The Resolver signature is async with (values, context, { fields }).
  const result = await (
    resolver as unknown as (
      v: T,
      c: unknown,
      o: { fields: Record<string, { name: string }> }
    ) => Promise<{ errors: Record<string, { type: string; message: string }> }>
  )(values, undefined, { fields });
  return result.errors;
}

// ---------------------------------------------------------------------------
// createPartyCreateResolver
// ---------------------------------------------------------------------------

describe('createPartyCreateResolver', () => {
  const resolver = createPartyCreateResolver(t);

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

  it('accepts valid minimal data', async () => {
    expect(await run(resolver, validData)).toEqual({});
  });

  it('rejects an empty name', async () => {
    const errors = await run(resolver, { ...validData, name: '' });
    expect(errors.name).toBeDefined();
  });

  it('rejects an invalid currency code (too short)', async () => {
    const errors = await run(resolver, { ...validData, defaultCurrency: 'EU' });
    expect(errors.defaultCurrency).toBeDefined();
  });

  it('rejects a lowercase currency code', async () => {
    const errors = await run(resolver, { ...validData, defaultCurrency: 'eur' });
    expect(errors.defaultCurrency).toBeDefined();
  });

  it('accepts a valid URL', async () => {
    const errors = await run(resolver, { ...validData, website: 'https://example.com' });
    expect(errors.website).toBeUndefined();
  });

  it('rejects a URL with numeric-only TLD', async () => {
    const errors = await run(resolver, { ...validData, website: 'https://example.123' });
    expect(errors.website?.message).toBe('Validation.InvalidUrl');
  });

  it('rejects a URL with a single-label hostname', async () => {
    const errors = await run(resolver, { ...validData, website: 'https://localhost-but-not' });
    expect(errors.website).toBeDefined();
  });

  it('accepts localhost as website', async () => {
    const errors = await run(resolver, { ...validData, website: 'http://localhost:3000' });
    expect(errors.website).toBeUndefined();
  });

  it('rejects an invalid kind', async () => {
    const errors = await run(resolver, { ...validData, kind: 'Robot' });
    expect(errors.kind).toBeDefined();
  });

  it('rejects an invalid role', async () => {
    const errors = await run(resolver, { ...validData, role: 'InvalidRole' });
    expect(errors.role).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// createPartyAddressResolver
// ---------------------------------------------------------------------------

describe('createPartyAddressResolver', () => {
  const resolver = createPartyAddressResolver(t);

  const validData = {
    kind: 'Billing',
    street1: '1 Main Street',
    city: 'Brussels',
    postalCode: '1000',
    country: 'BE',
    street2: null,
    state: null,
    label: null,
  };

  it('accepts valid data', async () => {
    expect(await run(resolver, validData)).toEqual({});
  });

  it('rejects an empty street1', async () => {
    const errors = await run(resolver, { ...validData, street1: '' });
    expect(errors.street1).toBeDefined();
  });

  it('rejects an empty city', async () => {
    const errors = await run(resolver, { ...validData, city: '' });
    expect(errors.city).toBeDefined();
  });

  it('rejects a country code longer than 2 characters', async () => {
    const errors = await run(resolver, { ...validData, country: 'BEL' });
    expect(errors.country).toBeDefined();
  });

  it('rejects a lowercase country code', async () => {
    const errors = await run(resolver, { ...validData, country: 'be' });
    expect(errors.country).toBeDefined();
  });

  it('rejects an invalid kind', async () => {
    const errors = await run(resolver, { ...validData, kind: 'Unknown' });
    expect(errors.kind).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// createPartyEmailResolver
// ---------------------------------------------------------------------------

describe('createPartyEmailResolver', () => {
  const resolver = createPartyEmailResolver(t);

  it('accepts a valid email', async () => {
    const errors = await run(resolver, { address: 'alice@example.com', label: null });
    expect(errors.address).toBeUndefined();
  });

  it('rejects an invalid email', async () => {
    const errors = await run(resolver, { address: 'not-an-email', label: null });
    expect(errors.address).toBeDefined();
  });

  it('rejects an empty address', async () => {
    const errors = await run(resolver, { address: '', label: null });
    expect(errors.address).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// createPartyPhoneResolver
// ---------------------------------------------------------------------------

describe('createPartyPhoneResolver', () => {
  const resolver = createPartyPhoneResolver(t);

  it('accepts a valid E.164 phone number', async () => {
    const errors = await run(resolver, { kind: 'Mobile', number: '+32479123456', label: null });
    expect(errors.number).toBeUndefined();
  });

  it('rejects an invalid phone number', async () => {
    const errors = await run(resolver, { kind: 'Mobile', number: '123', label: null });
    expect(errors.number?.message).toBe('Parties.Phones.InvalidNumber');
  });

  it('rejects an empty number', async () => {
    const errors = await run(resolver, { kind: 'Mobile', number: '', label: null });
    expect(errors.number).toBeDefined();
  });

  it('rejects an invalid kind', async () => {
    const errors = await run(resolver, { kind: 'Satellite', number: '+32479123456', label: null });
    expect(errors.kind).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// createPartyTaxStatusResolver
// ---------------------------------------------------------------------------

describe('createPartyTaxStatusResolver', () => {
  const resolver = createPartyTaxStatusResolver(t);

  it('accepts valid tax status', async () => {
    const errors = await run(resolver, { isExempt: false, reverseCharge: false, vatin: null });
    expect(errors).toEqual({});
  });

  it('rejects exempt + reverseCharge simultaneously', async () => {
    const errors = await run(resolver, { isExempt: true, reverseCharge: true, vatin: null });
    expect(errors.reverseCharge?.message).toBe('Parties.Validation.ExemptAndReverseCharge');
  });

  it('rejects reverseCharge without vatin', async () => {
    const errors = await run(resolver, { isExempt: false, reverseCharge: true, vatin: null });
    expect(errors.vatin).toBeDefined();
  });

  it('accepts reverseCharge with a vatin', async () => {
    const errors = await run(resolver, {
      isExempt: false,
      reverseCharge: true,
      vatin: 'BE0123456789',
    });
    expect(errors.vatin).toBeUndefined();
    expect(errors.reverseCharge).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// createPartyExternalMappingResolver
// ---------------------------------------------------------------------------

describe('createPartyExternalMappingResolver', () => {
  const resolver = createPartyExternalMappingResolver(t);

  it('accepts valid data', async () => {
    const errors = await run(resolver, { providerName: 'stripe', externalId: 'cus_123' });
    expect(errors).toEqual({});
  });

  it('rejects empty providerName', async () => {
    const errors = await run(resolver, { providerName: '', externalId: 'cus_123' });
    expect(errors.providerName).toBeDefined();
  });

  it('rejects empty externalId', async () => {
    const errors = await run(resolver, { providerName: 'stripe', externalId: '' });
    expect(errors.externalId).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// metadataLimits — the metadata tab enforces key/value length + max-entries
// inline (no RHF resolver), so the limit constants are the contract to assert.
// ---------------------------------------------------------------------------

describe('metadataLimits', () => {
  it('caps metadata keys at 40 characters', () => {
    expect(metadataLimits.keyMax).toBe(40);
  });

  it('caps metadata values at 500 characters', () => {
    expect(metadataLimits.valueMax).toBe(500);
  });

  it('caps the number of metadata entries at 50', () => {
    expect(metadataLimits.entriesMax).toBe(50);
  });
});
