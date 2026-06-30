import { partiesConstraints } from '@granit/parties';
import { createConstraintsResolver } from '@granit/react-validation';
import { isValidPhoneNumber } from 'libphonenumber-js/min';

import { ADDRESS_KINDS, PARTY_ASSIGNABLE_ROLES, PARTY_KINDS, PHONE_KINDS } from './constants';

import type { useTranslation } from '@granit/react-localization';
import type { Resolver } from 'react-hook-form';

type TranslateFn = ReturnType<typeof useTranslation>['t'];

const NAME_MAX = 256;
const NOTES_MAX = 8000;
const METADATA_KEY_MAX = 40;
const METADATA_VALUE_MAX = 500;
const METADATA_ENTRIES_MAX = 50;

// ---------------------------------------------------------------------------
// Client-only helpers — these encode rules the OpenAPI contract does NOT express
// (FQDN shape, ISO-4217 / ISO-3166 patterns, libphonenumber validity). They are
// layered ON TOP of the spec-derived `partiesConstraints` by the resolver
// factories below. The spec already carries required / maxLength / minLength /
// format:email, so those are NOT re-implemented here.
// ---------------------------------------------------------------------------

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

// ISO-4217 currency code (e.g. EUR) and ISO-3166-1 alpha-2 country code (e.g. BE).
const ISO_4217 = /^[A-Z]{3}$/;
const ISO_3166_ALPHA2 = /^[A-Z]{2}$/;

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

function isBlank(value: unknown): value is null | undefined | '' {
  return value === undefined || value === null || value === '';
}

// ---------------------------------------------------------------------------
// Form-value types — hand-written, mirroring the inputs of each DTO. `T | null`
// fields are required-but-nullable (the inputs render `''`/`null`), matching the
// previous zod-inferred shapes so RHF's strict Resolver generics keep working.
// ---------------------------------------------------------------------------

export interface PartyCreateFormValues {
  kind: string;
  name: string;
  defaultCurrency: string;
  /** Singular UI selection ('None' + assignable roles); mapped to `roles` at submit. */
  role: string;
  website: string | null;
  language: string | null;
  timezone: string | null;
  internalNotes: string | null;
}

export interface PartyIdentityFormValues {
  name: string;
  website: string | null;
  language: string | null;
  timezone: string | null;
  internalNotes: string | null;
}

export interface PartyAddressFormValues {
  kind: string;
  street1: string;
  street2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  label: string | null;
  isDefault?: boolean;
}

export interface PartyEmailFormValues {
  address: string;
  label: string | null;
  isPrimary?: boolean;
}

export interface PartyPhoneFormValues {
  kind: string;
  number: string;
  label: string | null;
  isPrimary?: boolean;
}

export interface PartyExternalMappingFormValues {
  providerName: string;
  externalId: string;
}

export interface PartyTaxStatusFormValues {
  isExempt: boolean;
  reverseCharge: boolean;
  vatin: string | null;
}

// ---------------------------------------------------------------------------
// Resolver plumbing. Each factory builds the spec resolver from the matching
// `partiesConstraints` DTO, then augments it with the client-only rules above —
// only setting a field error the spec resolver left untouched, so a spec error
// always wins (mirrors @granit/react-ui-cms-hostnames + @granit/react-ui-ai).
// ---------------------------------------------------------------------------

type ResolverField = { readonly name: string };
type ResolverOptions = { readonly fields: Record<string, ResolverField> };
type ResolverErrors = Record<string, { type: string; message: string }>;

// Builtin validation message code (host-provided, mirrors @granit/validation's
// VALIDATION_ERROR_CODES.pattern). Reused for the client-only enum / ISO-pattern
// guards below so they render through the same `Validation:Builtin:RegularExpression`
// string the spec resolver emits, parameterized with the field's label.
const CODE_PATTERN = 'Validation:Builtin:RegularExpression';

function patternError(t: TranslateFn, fieldLabelKey: string): { type: string; message: string } {
  return {
    type: CODE_PATTERN,
    message: t(CODE_PATTERN, { PropertyName: t(fieldLabelKey), nsSeparator: false }),
  };
}

/** Builds a labelResolver mapping spec field names to the `Parties.Fields.*` keys the dialogs render. */
function fieldLabel(t: TranslateFn, overrides: Record<string, string>): (field: string) => string {
  return (field) => {
    const key = overrides[field];
    return key ? t(key) : field;
  };
}

export function createPartyCreateResolver(t: TranslateFn): Resolver<PartyCreateFormValues> {
  const baseResolver = createConstraintsResolver(partiesConstraints.PartyCreateRequest, t, {
    labelResolver: fieldLabel(t, {
      name: 'Parties.Fields.Name',
      defaultCurrency: 'Parties.Fields.DefaultCurrency',
      website: 'Parties.Fields.Website',
      language: 'Parties.Fields.Language',
      timezone: 'Parties.Fields.Timezone',
      internalNotes: 'Parties.Fields.InternalNotes',
    }),
  });

  return (async (values: Record<string, unknown>, context: unknown, options: ResolverOptions) => {
    const result = await baseResolver(values, context, options);
    const errors = result.errors as ResolverErrors;

    // kind ∈ PARTY_KINDS (spec: required only — the <Select> already constrains it).
    if (!errors.kind && !PARTY_KINDS.includes(values.kind as never)) {
      errors.kind = patternError(t, 'Parties.Fields.Kind');
    }
    // defaultCurrency ISO-4217 (spec: required + length 3, but no pattern).
    if (
      !errors.defaultCurrency &&
      typeof values.defaultCurrency === 'string' &&
      values.defaultCurrency !== '' &&
      !ISO_4217.test(values.defaultCurrency)
    ) {
      errors.defaultCurrency = patternError(t, 'Parties.Fields.DefaultCurrency');
    }
    // role ∈ ['None', ...assignable] (spec key is `roles`, plural, unconstrained).
    if (!errors.role && !['None', ...PARTY_ASSIGNABLE_ROLES].includes(values.role as never)) {
      errors.role = patternError(t, 'Parties.Fields.InitialRole');
    }
    // website FQDN (spec: maxLength only).
    if (
      !errors.website &&
      typeof values.website === 'string' &&
      values.website !== '' &&
      !isParseableUrl(values.website)
    ) {
      errors.website = { type: 'url', message: t('Validation.InvalidUrl') };
    }

    return result;
  }) as unknown as Resolver<PartyCreateFormValues>;
}

export function createPartyIdentityResolver(t: TranslateFn): Resolver<PartyIdentityFormValues> {
  const baseResolver = createConstraintsResolver(partiesConstraints.PartyUpdateRequest, t, {
    labelResolver: fieldLabel(t, {
      name: 'Parties.Fields.Name',
      website: 'Parties.Fields.Website',
      language: 'Parties.Fields.Language',
      timezone: 'Parties.Fields.Timezone',
      internalNotes: 'Parties.Fields.InternalNotes',
    }),
  });

  return (async (values: Record<string, unknown>, context: unknown, options: ResolverOptions) => {
    const result = await baseResolver(values, context, options);
    const errors = result.errors as ResolverErrors;

    // website FQDN (spec: maxLength only).
    if (
      !errors.website &&
      typeof values.website === 'string' &&
      values.website !== '' &&
      !isParseableUrl(values.website)
    ) {
      errors.website = { type: 'url', message: t('Validation.InvalidUrl') };
    }

    return result;
  }) as unknown as Resolver<PartyIdentityFormValues>;
}

export function createPartyAddressResolver(t: TranslateFn): Resolver<PartyAddressFormValues> {
  const baseResolver = createConstraintsResolver(partiesConstraints.PartyAddressRequest, t, {
    labelResolver: fieldLabel(t, {
      kind: 'Parties.Fields.AddressKind',
      street1: 'Parties.Fields.Street1',
      street2: 'Parties.Fields.Street2',
      city: 'Parties.Fields.City',
      state: 'Parties.Fields.State',
      postalCode: 'Parties.Fields.PostalCode',
      country: 'Parties.Fields.Country',
      label: 'Parties.Fields.Label',
    }),
  });

  return (async (values: Record<string, unknown>, context: unknown, options: ResolverOptions) => {
    const result = await baseResolver(values, context, options);
    const errors = result.errors as ResolverErrors;

    // kind ∈ ADDRESS_KINDS (spec: required only).
    if (!errors.kind && !ADDRESS_KINDS.includes(values.kind as never)) {
      errors.kind = patternError(t, 'Parties.Fields.AddressKind');
    }
    // country ISO-3166-1 alpha-2 (spec: required + length 2, but no pattern).
    if (
      !errors.country &&
      typeof values.country === 'string' &&
      values.country !== '' &&
      !ISO_3166_ALPHA2.test(values.country)
    ) {
      errors.country = patternError(t, 'Parties.Fields.Country');
    }

    return result;
  }) as unknown as Resolver<PartyAddressFormValues>;
}

export function createPartyEmailResolver(t: TranslateFn): Resolver<PartyEmailFormValues> {
  // `address` is fully covered by the spec: required + maxLength 320 + format:email.
  // No client augmentation needed — the spec resolver emits the email-format error.
  const baseResolver = createConstraintsResolver(partiesConstraints.PartyEmailRequest, t, {
    labelResolver: fieldLabel(t, {
      address: 'Parties.Fields.Email',
      label: 'Parties.Fields.Label',
    }),
  });

  return baseResolver as unknown as Resolver<PartyEmailFormValues>;
}

export function createPartyPhoneResolver(t: TranslateFn): Resolver<PartyPhoneFormValues> {
  const baseResolver = createConstraintsResolver(partiesConstraints.PartyPhoneRequest, t, {
    labelResolver: fieldLabel(t, {
      kind: 'Parties.Fields.PhoneKind',
      number: 'Parties.Fields.PhoneNumber',
      label: 'Parties.Fields.Label',
    }),
  });

  return (async (values: Record<string, unknown>, context: unknown, options: ResolverOptions) => {
    const result = await baseResolver(values, context, options);
    const errors = result.errors as ResolverErrors;

    // kind ∈ PHONE_KINDS (spec: required only).
    if (!errors.kind && !PHONE_KINDS.includes(values.kind as never)) {
      errors.kind = patternError(t, 'Parties.Fields.PhoneKind');
    }
    // number passes libphonenumber-js validation (spec: required + maxLength only).
    if (
      !errors.number &&
      typeof values.number === 'string' &&
      values.number !== '' &&
      !isValidPhoneNumber(values.number)
    ) {
      errors.number = { type: 'phone', message: t('Parties.Phones.InvalidNumber') };
    }

    return result;
  }) as unknown as Resolver<PartyPhoneFormValues>;
}

export function createPartyExternalMappingResolver(
  t: TranslateFn
): Resolver<PartyExternalMappingFormValues> {
  // `providerName` (required + maxLength 64) and `externalId` (required + maxLength 256)
  // are both fully covered by the spec — no client-only rule to preserve.
  const baseResolver = createConstraintsResolver(
    partiesConstraints.PartyExternalMappingRequest,
    t,
    {
      labelResolver: fieldLabel(t, {
        providerName: 'Parties.Fields.Provider',
        externalId: 'Parties.Fields.ExternalId',
      }),
    }
  );

  return baseResolver as unknown as Resolver<PartyExternalMappingFormValues>;
}

export function createPartyTaxStatusResolver(t: TranslateFn): Resolver<PartyTaxStatusFormValues> {
  const baseResolver = createConstraintsResolver(partiesConstraints.PartyTaxStatusRequest, t, {
    labelResolver: fieldLabel(t, {
      vatin: 'Parties.Fields.Vatin',
    }),
  });

  return (async (values: Record<string, unknown>, context: unknown, options: ResolverOptions) => {
    const result = await baseResolver(values, context, options);
    const errors = result.errors as ResolverErrors;

    const isExempt = values.isExempt === true;
    const reverseCharge = values.reverseCharge === true;

    // Cross-field: VAT exempt and reverse charge are mutually exclusive.
    if (!errors.reverseCharge && isExempt && reverseCharge) {
      errors.reverseCharge = {
        type: 'custom',
        message: t('Parties.Validation.ExemptAndReverseCharge'),
      };
    }
    // Cross-field: reverse charge requires a VATIN.
    if (
      !errors.vatin &&
      reverseCharge &&
      (isBlank(values.vatin) || (typeof values.vatin === 'string' && values.vatin.trim() === ''))
    ) {
      errors.vatin = {
        type: 'required',
        message: t('Validation.Required', { field: t('Parties.Fields.Vatin') }),
      };
    }

    return result;
  }) as unknown as Resolver<PartyTaxStatusFormValues>;
}

// ---------------------------------------------------------------------------
// Metadata — the metadata tab manages a dynamic key/value list outside RHF, so
// these limits drive its inline guards (max entries, per-field maxLength).
// ---------------------------------------------------------------------------

export const metadataLimits = {
  keyMax: METADATA_KEY_MAX,
  valueMax: METADATA_VALUE_MAX,
  entriesMax: METADATA_ENTRIES_MAX,
} as const;

export const partyLimits = {
  nameMax: NAME_MAX,
  notesMax: NOTES_MAX,
} as const;
