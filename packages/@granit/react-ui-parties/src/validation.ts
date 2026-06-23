import { isValidPhoneNumber } from 'libphonenumber-js/min';
import { z } from 'zod';

import { ADDRESS_KINDS, PARTY_ASSIGNABLE_ROLES, PARTY_KINDS, PHONE_KINDS } from './constants';

import type { useTranslation } from '@granit/react-localization';

type TranslateFn = ReturnType<typeof useTranslation>['t'];

const NAME_MAX = 256;
const NOTES_MAX = 8000;
const METADATA_KEY_MAX = 40;
const METADATA_VALUE_MAX = 500;
const METADATA_ENTRIES_MAX = 50;

function nonEmptyString(t: TranslateFn, fieldKey: string, max: number) {
  return z
    .string()
    .trim()
    .min(1, t('Validation.Required', { field: t(fieldKey) }))
    .max(max);
}

// `.nullable()` (not `.nullish()`) keeps the field required-but-nullable so
// the schema's input type matches the form's `T | null` shape. With `.nullish()`
// the input becomes `T | null | undefined` with the field marked optional (`?:`),
// which trips RHF's strict Resolver<TFieldValues, TTransformedValues> generics.
function optionalString(max: number) {
  return z
    .string()
    .max(max)
    .nullable()
    .transform((v) => (v == null || v === '' ? null : v));
}

// `new URL()` alone is too permissive: it accepts `https://12345` (numeric
// host), `https://example` (single-label hostname), and quietly tolerates
// odd characters in the authority (`https://".com` parses on some engines).
// For a public website field we want a real FQDN — RFC 1123 hostname labels
// (alphanumeric + internal hyphens) joined by dots, with a non-numeric TLD
// of at least 2 chars. IPs (v4 / v6) and `localhost` are allowed for
// completeness even if rarely used here.
const RFC_1123_HOSTNAME =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{0,61}[a-z0-9]?$/i;
const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

function isParseableUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  const host = url.hostname;
  if (!host) return false;
  if (host === 'localhost') return true;
  if (IPV4.test(host)) return true;
  if (host.startsWith('[') && host.endsWith(']')) return true;
  return RFC_1123_HOSTNAME.test(host);
}

function optionalUrl(t: TranslateFn, max: number) {
  return optionalString(max).refine((v) => v == null || isParseableUrl(v), {
    message: t('Validation.InvalidUrl'),
  });
}

const currencyCode = z
  .string()
  .trim()
  .length(3)
  .regex(/^[A-Z]{3}$/, 'ISO 4217 code (e.g. EUR)');

const countryCode = z
  .string()
  .trim()
  .length(2)
  .regex(/^[A-Z]{2}$/, 'ISO 3166-1 alpha-2 (e.g. BE)');

export function partyCreateSchema(t: TranslateFn) {
  return z.object({
    kind: z.enum(PARTY_KINDS as readonly [string, ...string[]]),
    name: nonEmptyString(t, 'Parties.Fields.Name', NAME_MAX),
    defaultCurrency: currencyCode,
    role: z.enum(['None', ...PARTY_ASSIGNABLE_ROLES] as readonly [string, ...string[]]),
    website: optionalUrl(t, 2048),
    language: optionalString(16),
    timezone: optionalString(64),
    internalNotes: optionalString(NOTES_MAX),
  });
}

export type PartyCreateFormValues = z.infer<ReturnType<typeof partyCreateSchema>>;

export function partyIdentitySchema(t: TranslateFn) {
  return z.object({
    name: nonEmptyString(t, 'Parties.Fields.Name', NAME_MAX),
    website: optionalUrl(t, 2048),
    language: optionalString(16),
    timezone: optionalString(64),
    internalNotes: optionalString(NOTES_MAX),
  });
}

export type PartyIdentityFormValues = z.infer<ReturnType<typeof partyIdentitySchema>>;

export function partyAddressSchema(t: TranslateFn) {
  return z.object({
    kind: z.enum(ADDRESS_KINDS as readonly [string, ...string[]]),
    line1: nonEmptyString(t, 'Parties.Fields.Line1', 256),
    line2: optionalString(256),
    city: nonEmptyString(t, 'Parties.Fields.City', 128),
    state: optionalString(128),
    postalCode: nonEmptyString(t, 'Parties.Fields.PostalCode', 32),
    country: countryCode,
    companyName: optionalString(256),
    label: optionalString(64),
    isDefault: z.boolean().optional(),
  });
}

export type PartyAddressFormValues = z.infer<ReturnType<typeof partyAddressSchema>>;

export function partyEmailSchema(t: TranslateFn) {
  return z.object({
    address: nonEmptyString(t, 'Parties.Fields.Email', 256).pipe(z.string().email()),
    label: optionalString(64),
    isPrimary: z.boolean().optional(),
  });
}

export type PartyEmailFormValues = z.infer<ReturnType<typeof partyEmailSchema>>;

export function partyPhoneSchema(t: TranslateFn) {
  return z.object({
    kind: z.enum(PHONE_KINDS as readonly [string, ...string[]]),
    number: nonEmptyString(t, 'Parties.Fields.PhoneNumber', 64).refine(
      (value) => isValidPhoneNumber(value),
      { message: t('Parties.Phones.InvalidNumber') }
    ),
    label: optionalString(64),
    isPrimary: z.boolean().optional(),
  });
}

export type PartyPhoneFormValues = z.infer<ReturnType<typeof partyPhoneSchema>>;

export function partyExternalMappingSchema(t: TranslateFn) {
  return z.object({
    providerName: nonEmptyString(t, 'Parties.Fields.Provider', 64),
    externalId: nonEmptyString(t, 'Parties.Fields.ExternalId', 256),
  });
}

export type PartyExternalMappingFormValues = z.infer<ReturnType<typeof partyExternalMappingSchema>>;

export function partyTaxStatusSchema(t: TranslateFn) {
  return z
    .object({
      isExempt: z.boolean(),
      reverseCharge: z.boolean(),
      vatin: optionalString(64),
    })
    .superRefine((value, ctx) => {
      if (value.isExempt && value.reverseCharge) {
        ctx.addIssue({
          code: 'custom',
          path: ['reverseCharge'],
          message: t('Parties.Validation.ExemptAndReverseCharge'),
        });
      }
      if (value.reverseCharge && (!value.vatin || value.vatin.trim() === '')) {
        ctx.addIssue({
          code: 'custom',
          path: ['vatin'],
          message: t('Validation.Required', { field: t('Parties.Fields.Vatin') }),
        });
      }
    });
}

export type PartyTaxStatusFormValues = z.infer<ReturnType<typeof partyTaxStatusSchema>>;

export function metadataEntrySchema(t: TranslateFn) {
  return z.object({
    key: z
      .string()
      .trim()
      .min(1, t('Validation.Required', { field: t('Parties.Fields.MetadataKey') }))
      .max(METADATA_KEY_MAX),
    value: z.string().max(METADATA_VALUE_MAX),
  });
}

export const metadataLimits = {
  keyMax: METADATA_KEY_MAX,
  valueMax: METADATA_VALUE_MAX,
  entriesMax: METADATA_ENTRIES_MAX,
} as const;

export const partyLimits = {
  nameMax: NAME_MAX,
  notesMax: NOTES_MAX,
} as const;
