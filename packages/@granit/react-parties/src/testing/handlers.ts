import { ENUM_OPERATORS, STRING_OPERATORS } from '@granit/query-engine';
import { createQueryMetaHandler } from '@granit/react-query-engine/testing';
import { created, pagedResponse } from '@granit/testing/msw';
import { toEntityId } from '@granit/types';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import { sampleDuplicates, sampleParties, toListItem } from './data';

import type {
  FieldConflictResponse,
  PartyAddressId,
  PartyAddressRequest,
  PartyCreateConflictResponse,
  PartyCreateRequest,
  PartyDuplicateMergeRequest,
  PartyEmailId,
  PartyEmailRequest,
  PartyExternalMappingId,
  PartyExternalMappingRequest,
  PartyId,
  PartyMergeRequest,
  PartyMergeResponse,
  PartyMetadataRequest,
  PartyPhoneId,
  PartyPhoneRequest,
  PartyResponse,
  PartyRoleRequest,
  PartyTaxStatusRequest,
  PartyUpdateRequest,
} from '@granit/parties';
import type { QueryMetadata } from '@granit/query-engine';
import type { Mutable } from '@granit/testing';

const PARTY_KINDS = ['Individual', 'Company', 'Department'];
const PARTY_STATUSES = ['Active', 'Suspended', 'Archived'];
const PARTY_ROLES = ['None', 'Customer', 'Supplier', 'Employee', 'Lead'];

/** Mock /meta payload for the parties resource. */
export const partyQueryMetadata: QueryMetadata = {
  columns: [
    {
      name: 'id',
      label: 'ID',
      type: 'Guid',
      order: 0,
      isSortable: false,
      isFilterable: false,
      isVisible: false,
    },
    {
      name: 'name',
      label: 'Name',
      type: 'String',
      order: 1,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'kind',
      label: 'Kind',
      type: 'String',
      order: 2,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'roles',
      label: 'Roles',
      type: 'String',
      order: 3,
      isSortable: false,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'String',
      order: 4,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'defaultCurrency',
      label: 'Currency',
      type: 'String',
      order: 5,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'primaryEmail',
      label: 'Primary email',
      type: 'String',
      order: 6,
      isSortable: false,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'primaryPhone',
      label: 'Primary phone',
      type: 'String',
      order: 7,
      isSortable: false,
      isFilterable: true,
      isVisible: false,
    },
    {
      name: 'tenantId',
      label: 'Tenant',
      type: 'Guid',
      order: 8,
      isSortable: false,
      isFilterable: true,
      isVisible: false,
    },
  ],
  filterableFields: [
    { name: 'name', type: 'String', operators: STRING_OPERATORS },
    { name: 'kind', type: 'String', operators: ENUM_OPERATORS, enumValues: PARTY_KINDS },
    { name: 'roles', type: 'String', operators: ENUM_OPERATORS, enumValues: PARTY_ROLES },
    { name: 'status', type: 'String', operators: ENUM_OPERATORS, enumValues: PARTY_STATUSES },
    { name: 'defaultCurrency', type: 'String', operators: ENUM_OPERATORS },
    { name: 'primaryEmail', type: 'String', operators: STRING_OPERATORS },
    { name: 'primaryPhone', type: 'String', operators: STRING_OPERATORS },
    { name: 'tenantId', type: 'Guid', operators: ENUM_OPERATORS },
  ],
  sortableFields: [
    { name: 'name' },
    { name: 'kind' },
    { name: 'status' },
    { name: 'defaultCurrency' },
  ],
  presetFilterGroups: [],
  quickFilters: [
    { name: 'active', label: 'Active', isDefault: true },
    { name: 'suspended', label: 'Suspended', isDefault: false },
    { name: 'archived', label: 'Archived', isDefault: false },
  ],
  dateFilters: [],
  groupByFields: [
    { name: 'kind', type: 'String' },
    { name: 'status', type: 'String' },
    { name: 'defaultCurrency', type: 'String' },
  ],
  pagination: {
    defaultPageSize: 25,
    maxPageSize: 100,
    maxStreamSize: 50_000,
    supportsCursor: false,
  },
  defaultSort: 'name',
};

let createCounter = 1000;
let subEntityCounter = 1000;

function findById(id: string): Mutable<PartyResponse> | undefined {
  return sampleParties.find((p) => p.id === id);
}

function nextSubId(prefix: string): string {
  subEntityCounter += 1;
  return toEntityId(`${prefix}-${subEntityCounter}`);
}

function notFound() {
  return new HttpResponse(null, { status: 404 });
}

/**
 * Create stateful MSW handlers for the parties admin endpoints. Mutations
 * update the in-memory `sampleParties` store so list / detail reads observe
 * them across requests within the same browser session.
 *
 * @param baseUrl - API base path (default: `/api/v1/parties`).
 */
export function createPartiesHandlers(baseUrl = DEFAULT_BASE_PATH) {
  return [
    // ── GET /meta — query metadata ───────────────────────────────────
    createQueryMetaHandler(baseUrl, partyQueryMetadata),

    // ── GET list ─────────────────────────────────────────────────────
    http.get(baseUrl, ({ request }) => {
      const url = new URL(request.url);
      const role = url.searchParams.get('role');
      const items = role
        ? sampleParties.filter((p) =>
            p.roles
              .split(',')
              .map((r) => r.trim())
              .includes(role)
          )
        : sampleParties;
      return HttpResponse.json(items.map(toListItem));
    }),

    // ── Duplicate candidates: paged inbox (QueryEngine shape) ────────
    // MUST appear before the `/:id` catch-all below so the literal segment
    // "duplicates" is not interpreted as a party id.
    http.get(`${baseUrl}/duplicates`, ({ request }) => {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get('page') ?? '1');
      const pageSize = Number(url.searchParams.get('pageSize') ?? '20');
      const pending = sampleDuplicates.filter((d) => d.dismissedAt == null);
      const start = (page - 1) * pageSize;
      const items = pending.slice(start, start + pageSize);
      return pagedResponse(items, pending.length);
    }),

    // ── Duplicate candidates: per-party flat list ────────────────────
    http.get(`${baseUrl}/:id/duplicate-candidates`, ({ params }) => {
      const partyId = params.id as string;
      const rows = sampleDuplicates.filter(
        (d) => (d.partyId === partyId || d.candidateId === partyId) && d.dismissedAt == null
      );
      return HttpResponse.json(rows);
    }),

    // ── Duplicate candidates: dismiss ────────────────────────────────
    http.post(`${baseUrl}/duplicates/:id/dismiss`, ({ params }) => {
      const row = sampleDuplicates.find((d) => d.id === params.id);
      if (!row) return notFound();
      row.dismissedAt = new Date().toISOString();
      return new HttpResponse(null, { status: 204 });
    }),

    // ── Duplicate candidates: merge shortcut ─────────────────────────
    http.post(`${baseUrl}/duplicates/:id/merge`, async ({ params, request }) => {
      const row = sampleDuplicates.find((d) => d.id === params.id);
      if (!row) return notFound();

      const body = (await request.json()) as PartyDuplicateMergeRequest;
      let loserId: string;
      if (body.survivorId === row.partyId) {
        loserId = row.candidateId;
      } else if (body.survivorId === row.candidateId) {
        loserId = row.partyId;
      } else {
        return HttpResponse.json(
          { detail: 'survivorId is not part of the candidate pair on the supplied id.' },
          { status: 422 }
        );
      }

      const survivor = findById(body.survivorId);
      const loser = findById(loserId);
      if (!survivor || !loser) return notFound();

      // Reuse the same merge response shape — apply minimal demo mutations
      // so the inbox refresh + party detail refresh both observe the change.
      loser.status = 'Archived';
      row.dismissedAt = new Date().toISOString();

      const response: PartyMergeResponse = {
        survivorId: survivor.id,
        loserId: loser.id,
        conflicts: computeConflicts(survivor, loser),
        rewriteCounts: rewriteCountsFor(loser),
        dryRun: false,
      };
      return HttpResponse.json(response);
    }),

    // ── GET detail ───────────────────────────────────────────────────
    http.get(`${baseUrl}/:id`, ({ params }) => {
      const party = findById(params.id as string);
      return party ? HttpResponse.json(party) : notFound();
    }),

    // ── POST create ──────────────────────────────────────────────────
    http.post(baseUrl, async ({ request }) => {
      const body = (await request.json()) as PartyCreateRequest;

      // Tier-1 (Deterministic) duplicate detection: case-insensitive name
      // match against active parties. Bypassable via `?force=true` (URL flag)
      // or `X-Skip-Duplicate-Check: true` (header) — mirrors the production
      // contract surfaced by `createParty` / `CreatePartyOptions`.
      const url = new URL(request.url);
      const forceFlag = url.searchParams.get('force') === 'true';
      const skipHeader = request.headers.get('x-skip-duplicate-check') === 'true';
      if (!forceFlag && !skipHeader) {
        const needle = body.name.trim().toLowerCase();
        const matches = sampleParties
          .filter((p) => p.status !== 'Archived' && p.name.toLowerCase() === needle)
          .map(toListItem)
          .slice(0, 5);
        if (matches.length > 0) {
          const conflict: PartyCreateConflictResponse = {
            title: 'Duplicate party detected',
            detail: `A ${matches.length === 1 ? 'party' : 'few parties'} with the name "${body.name}" already exist. Pick how to proceed.`,
            tier: 'Deterministic',
            candidates: matches,
          };
          return HttpResponse.json(conflict, { status: 409 });
        }
      }

      createCounter += 1;
      const newParty: Mutable<PartyResponse> = {
        id: toEntityId<'Party'>(
          `00000000-0000-0000-0000-${createCounter.toString(16).padStart(12, '0')}`
        ) as PartyId,
        tenantId: null,
        kind: body.kind,
        name: body.name,
        defaultCurrency: body.defaultCurrency,
        timezone: body.timezone ?? 'UTC',
        language: body.language ?? null,
        website: body.website ?? null,
        taxId: body.taxId ?? null,
        registrationNumber: body.registrationNumber ?? null,
        parentContactId: null,
        userId: null,
        avatarBlobId: null,
        roles: body.roles ?? 'Customer',
        status: 'Active',
        addresses: [],
        emails: [],
        phones: [],
        externalMappings: [],
        taxStatus: { isExempt: false, reverseCharge: false, vatin: null, evidenceBlobId: null },
        metadata: {},
        internalNotes: body.internalNotes ?? null,
      };
      sampleParties.push(newParty);
      return created(newParty);
    }),

    // ── PATCH identity ───────────────────────────────────────────────
    http.patch(`${baseUrl}/:id`, async ({ params, request }) => {
      const party = findById(params.id as string);
      if (!party) return notFound();
      const body = (await request.json()) as PartyUpdateRequest;
      party.name = body.name;
      if (body.website !== undefined) party.website = body.website ?? null;
      if (body.language !== undefined) party.language = body.language ?? null;
      if (body.timezone !== undefined) party.timezone = body.timezone ?? party.timezone;
      if (body.internalNotes !== undefined) party.internalNotes = body.internalNotes ?? null;
      return HttpResponse.json(party);
    }),

    // ── Lifecycle ────────────────────────────────────────────────────
    http.post(`${baseUrl}/:id/suspend`, ({ params }) => {
      const party = findById(params.id as string);
      if (!party) return notFound();
      if (party.status === 'Archived') {
        return HttpResponse.json({ detail: 'Cannot suspend an archived party.' }, { status: 409 });
      }
      party.status = 'Suspended';
      return new HttpResponse(null, { status: 204 });
    }),
    http.post(`${baseUrl}/:id/activate`, ({ params }) => {
      const party = findById(params.id as string);
      if (!party) return notFound();
      if (party.status === 'Archived') {
        return HttpResponse.json(
          { detail: 'Cannot reactivate an archived party.' },
          { status: 409 }
        );
      }
      party.status = 'Active';
      return new HttpResponse(null, { status: 204 });
    }),
    http.post(`${baseUrl}/:id/archive`, ({ params }) => {
      const party = findById(params.id as string);
      if (!party) return notFound();
      party.status = 'Archived';
      return new HttpResponse(null, { status: 204 });
    }),

    // ── Addresses ────────────────────────────────────────────────────
    http.post(`${baseUrl}/:id/addresses`, async ({ params, request }) => {
      const party = findById(params.id as string);
      if (!party) return notFound();
      const body = (await request.json()) as PartyAddressRequest;
      const isFirstOfKind = !party.addresses.some((a) => a.kind === body.kind);
      const promote = body.isDefault === true || isFirstOfKind;
      if (promote) {
        party.addresses = party.addresses.map((a) =>
          a.kind === body.kind ? { ...a, isDefault: false } : a
        );
      }
      party.addresses = [
        ...party.addresses,
        {
          id: nextSubId('addr') as PartyAddressId,
          kind: body.kind,
          isDefault: promote,
          label: body.label ?? null,
          line1: body.line1,
          city: body.city,
          postalCode: body.postalCode,
          country: body.country,
          companyName: body.companyName ?? null,
          line2: body.line2 ?? null,
          state: body.state ?? null,
        },
      ];
      return created(party);
    }),
    http.delete(`${baseUrl}/:id/addresses/:addressId`, ({ params }) => {
      const party = findById(params.id as string);
      if (!party) return notFound();
      party.addresses = party.addresses.filter((a) => a.id !== params.addressId);
      return new HttpResponse(null, { status: 204 });
    }),

    // ── Emails ───────────────────────────────────────────────────────
    http.post(`${baseUrl}/:id/emails`, async ({ params, request }) => {
      const party = findById(params.id as string);
      if (!party) return notFound();
      const body = (await request.json()) as PartyEmailRequest;
      const promote = body.isPrimary === true || party.emails.length === 0;
      if (promote) {
        party.emails = party.emails.map((e) => ({ ...e, isPrimary: false }));
      }
      party.emails = [
        ...party.emails,
        {
          id: nextSubId('email') as PartyEmailId,
          address: body.address,
          isPrimary: promote,
          label: body.label ?? null,
        },
      ];
      return created(party);
    }),
    http.delete(`${baseUrl}/:id/emails/:emailId`, ({ params }) => {
      const party = findById(params.id as string);
      if (!party) return notFound();
      party.emails = party.emails.filter((e) => e.id !== params.emailId);
      return new HttpResponse(null, { status: 204 });
    }),

    // ── Phones ───────────────────────────────────────────────────────
    http.post(`${baseUrl}/:id/phones`, async ({ params, request }) => {
      const party = findById(params.id as string);
      if (!party) return notFound();
      const body = (await request.json()) as PartyPhoneRequest;
      const promote = body.isPrimary === true || party.phones.length === 0;
      if (promote) {
        party.phones = party.phones.map((p) => ({ ...p, isPrimary: false }));
      }
      party.phones = [
        ...party.phones,
        {
          id: nextSubId('phone') as PartyPhoneId,
          kind: body.kind,
          number: body.number,
          isPrimary: promote,
          label: body.label ?? null,
        },
      ];
      return created(party);
    }),
    http.delete(`${baseUrl}/:id/phones/:phoneId`, ({ params }) => {
      const party = findById(params.id as string);
      if (!party) return notFound();
      party.phones = party.phones.filter((p) => p.id !== params.phoneId);
      return new HttpResponse(null, { status: 204 });
    }),

    // ── External mappings ────────────────────────────────────────────
    http.post(`${baseUrl}/:id/external-mappings`, async ({ params, request }) => {
      const party = findById(params.id as string);
      if (!party) return notFound();
      const body = (await request.json()) as PartyExternalMappingRequest;
      if (party.externalMappings.some((m) => m.providerName === body.providerName)) {
        return HttpResponse.json(
          { detail: `Provider '${body.providerName}' already mapped.` },
          { status: 409 }
        );
      }
      party.externalMappings = [
        ...party.externalMappings,
        {
          id: nextSubId('map') as PartyExternalMappingId,
          providerName: body.providerName,
          externalId: body.externalId,
        },
      ];
      return created(party);
    }),
    http.delete(`${baseUrl}/:id/external-mappings/:providerName`, ({ params }) => {
      const party = findById(params.id as string);
      if (!party) return notFound();
      party.externalMappings = party.externalMappings.filter(
        (m) => m.providerName !== decodeURIComponent(params.providerName as string)
      );
      return new HttpResponse(null, { status: 204 });
    }),

    // ── Roles ────────────────────────────────────────────────────────
    http.post(`${baseUrl}/:id/roles`, async ({ params, request }) => {
      const party = findById(params.id as string);
      if (!party) return notFound();
      const body = (await request.json()) as PartyRoleRequest;
      const current = new Set(
        party.roles
          .split(',')
          .map((r) => r.trim())
          .filter((r) => r && r !== 'None')
      );
      current.add(body.role);
      party.roles = current.size > 0 ? [...current].join(', ') : 'None';
      return new HttpResponse(null, { status: 204 });
    }),
    http.delete(`${baseUrl}/:id/roles/:role`, ({ params }) => {
      const party = findById(params.id as string);
      if (!party) return notFound();
      const current = new Set(
        party.roles
          .split(',')
          .map((r) => r.trim())
          .filter((r) => r && r !== 'None')
      );
      current.delete(params.role as string);
      party.roles = current.size > 0 ? [...current].join(', ') : 'None';
      return new HttpResponse(null, { status: 204 });
    }),

    // ── Tax status ───────────────────────────────────────────────────
    http.put(`${baseUrl}/:id/tax-status`, async ({ params, request }) => {
      const party = findById(params.id as string);
      if (!party) return notFound();
      const body = (await request.json()) as PartyTaxStatusRequest;
      if (body.reverseCharge && !body.vatin) {
        return HttpResponse.json(
          { detail: 'Reverse-charge requires a VAT identification number.' },
          { status: 422 }
        );
      }
      party.taxStatus = {
        isExempt: body.isExempt,
        reverseCharge: body.reverseCharge,
        vatin: body.vatin ?? null,
        evidenceBlobId: body.evidenceBlobId ?? null,
      };
      return HttpResponse.json(party);
    }),
    http.delete(`${baseUrl}/:id/tax-status`, ({ params }) => {
      const party = findById(params.id as string);
      if (!party) return notFound();
      party.taxStatus = {
        isExempt: false,
        reverseCharge: false,
        vatin: null,
        evidenceBlobId: null,
      };
      return HttpResponse.json(party);
    }),

    // ── Metadata ─────────────────────────────────────────────────────
    http.put(`${baseUrl}/:id/metadata`, async ({ params, request }) => {
      const party = findById(params.id as string);
      if (!party) return notFound();
      const body = (await request.json()) as PartyMetadataRequest;
      party.metadata = { ...body.metadata };
      return HttpResponse.json(party);
    }),

    // ── vCard ────────────────────────────────────────────────────────
    http.get(`${baseUrl}/:id/vcard`, ({ params }) => {
      const party = findById(params.id as string);
      if (!party) return notFound();
      const vcard = `BEGIN:VCARD\r\nVERSION:4.0\r\nFN:${party.name}\r\nEND:VCARD\r\n`;
      return new HttpResponse(vcard, {
        status: 200,
        headers: { 'Content-Type': 'text/vcard; charset=utf-8' },
      });
    }),

    // ── Merge preview ────────────────────────────────────────────────
    http.get(`${baseUrl}/:survivorId/merge/preview`, ({ params, request }) => {
      const survivor = findById(params.survivorId as string);
      const url = new URL(request.url);
      const loserIdParam = url.searchParams.get('loserId');
      const loser = loserIdParam ? findById(loserIdParam) : undefined;
      if (!survivor || !loser) return notFound();
      return HttpResponse.json(buildMergeResponse(survivor, loser, /* dryRun */ true));
    }),

    // ── Merge commit ─────────────────────────────────────────────────
    http.post(`${baseUrl}/:survivorId/merge`, async ({ params, request }) => {
      const survivor = findById(params.survivorId as string);
      const body = (await request.json()) as PartyMergeRequest;
      const loser = findById(body.loserId);
      if (!survivor || !loser) return notFound();

      // Demo invariants — exercise the 422 + 409 branches the UI must handle.
      if (loser.status === 'Archived') {
        return HttpResponse.json({ detail: 'Cannot merge an archived loser.' }, { status: 422 });
      }
      if (loser.id === survivor.id) {
        return HttpResponse.json(
          { detail: 'Survivor and loser must be different parties.' },
          { status: 422 }
        );
      }
      if (loser.defaultCurrency !== survivor.defaultCurrency) {
        return HttpResponse.json(
          { detail: 'Currency mismatch between survivor and loser.' },
          { status: 422 }
        );
      }
      if (loser.tenantId !== survivor.tenantId) {
        return HttpResponse.json({ detail: 'Tenant scope mismatch.' }, { status: 422 });
      }

      if (body.dryRun) {
        return HttpResponse.json(buildMergeResponse(survivor, loser, true));
      }

      // Apply choices: when "Loser" wins on a known scalar, copy the loser's value.
      const choices = body.choices ?? {};
      if (choices['Name'] === 'Loser') survivor.name = loser.name;
      if (choices['Website'] === 'Loser') survivor.website = loser.website;
      if (choices['Language'] === 'Loser') survivor.language = loser.language;
      if (choices['Timezone'] === 'Loser') survivor.timezone = loser.timezone;
      if (choices['TaxId'] === 'Loser') survivor.taxId = loser.taxId;
      if (choices['RegistrationNumber'] === 'Loser')
        survivor.registrationNumber = loser.registrationNumber;
      if (choices['TaxStatus'] === 'Loser') survivor.taxStatus = { ...loser.taxStatus };
      if (choices['InternalNotes'] === 'Loser') survivor.internalNotes = loser.internalNotes;

      // Per-key metadata overrides (e.g. "Metadata.segment").
      const mergedMetadata: Record<string, string> = { ...survivor.metadata };
      for (const [key, value] of Object.entries(loser.metadata)) {
        if (!(key in mergedMetadata)) {
          mergedMetadata[key] = value;
        } else if (choices[`Metadata.${key}`] === 'Loser') {
          mergedMetadata[key] = value;
        }
      }
      survivor.metadata = mergedMetadata;

      // Tombstone the loser by archiving — simplistic demo behaviour.
      loser.status = 'Archived';

      return HttpResponse.json(buildMergeResponse(survivor, loser, false));
    }),
  ];
}

// ── Merge helpers ─────────────────────────────────────────────────────────

function buildMergeResponse(
  survivor: PartyResponse,
  loser: PartyResponse,
  dryRun: boolean
): PartyMergeResponse {
  return {
    survivorId: survivor.id,
    loserId: loser.id,
    conflicts: computeConflicts(survivor, loser),
    rewriteCounts: rewriteCountsFor(loser),
    dryRun,
  };
}

function computeConflicts(
  survivor: PartyResponse,
  loser: PartyResponse
): readonly FieldConflictResponse[] {
  const conflicts: FieldConflictResponse[] = [];

  scalarConflict(conflicts, 'Name', survivor.name, loser.name, 'Survivor');
  scalarConflict(conflicts, 'Website', survivor.website, loser.website, 'Survivor');
  scalarConflict(conflicts, 'Language', survivor.language, loser.language, 'Survivor');
  scalarConflict(conflicts, 'Timezone', survivor.timezone, loser.timezone, 'Survivor');
  scalarConflict(conflicts, 'TaxId', survivor.taxId, loser.taxId, 'Survivor');
  scalarConflict(
    conflicts,
    'RegistrationNumber',
    survivor.registrationNumber,
    loser.registrationNumber,
    'Survivor'
  );

  // Tax status: prefer the more permissive side (exempt or reverse-charge)
  // so customers don't accidentally lose a beneficial classification.
  const sTax = survivor.taxStatus;
  const lTax = loser.taxStatus;
  const taxEqual =
    sTax.isExempt === lTax.isExempt &&
    sTax.reverseCharge === lTax.reverseCharge &&
    sTax.vatin === lTax.vatin;
  if (!taxEqual) {
    const surfaceLoser =
      !sTax.isExempt && !sTax.reverseCharge && (lTax.isExempt || lTax.reverseCharge);
    conflicts.push({
      fieldPath: 'TaxStatus',
      survivorValue: stringifyTaxStatus(sTax),
      loserValue: stringifyTaxStatus(lTax),
      default: surfaceLoser ? 'Loser' : 'Survivor',
    });
  }

  scalarConflict(
    conflicts,
    'InternalNotes',
    survivor.internalNotes,
    loser.internalNotes,
    'Survivor'
  );

  // Per-key metadata overlap.
  for (const key of Object.keys(loser.metadata)) {
    const sv = survivor.metadata[key] ?? null;
    const lv = loser.metadata[key] ?? null;
    if (sv !== null && lv !== null && sv !== lv) {
      conflicts.push({
        fieldPath: `Metadata.${key}`,
        survivorValue: sv,
        loserValue: lv,
        default: 'Survivor',
      });
    }
  }

  return conflicts;
}

function scalarConflict(
  out: FieldConflictResponse[],
  fieldPath: string,
  survivorValue: string | null,
  loserValue: string | null,
  defaultWinner: 'Survivor' | 'Loser'
) {
  if (survivorValue === loserValue) return;
  // Only one side set → no conflict, the populated value will win automatically.
  if (survivorValue == null || loserValue == null) return;
  out.push({ fieldPath, survivorValue, loserValue, default: defaultWinner });
}

function stringifyTaxStatus(t: PartyResponse['taxStatus']): string {
  if (t.isExempt) return 'Exempt';
  if (t.reverseCharge) return `ReverseCharge (${t.vatin ?? '?'})`;
  return 'Standard';
}

function rewriteCountsFor(loser: PartyResponse): Readonly<Record<string, number>> {
  // Crude demo heuristic: more populated parties pretend to have more rows.
  const populationScore =
    loser.emails.length +
    loser.phones.length +
    loser.addresses.length +
    loser.externalMappings.length;
  return {
    'Invoice.PartyId': loser.roles.includes('Customer') ? 12 + populationScore : 0,
    'Subscription.PartyId': loser.roles.includes('Customer') ? 2 : 0,
    'BalanceAccount.PartyId': loser.roles.includes('Customer') ? 1 : 0,
    'Payment.PartyId': loser.roles.includes('Customer') ? 8 : 0,
    'Party.ParentContactId': 0,
    'Party.Children': 0,
  };
}
