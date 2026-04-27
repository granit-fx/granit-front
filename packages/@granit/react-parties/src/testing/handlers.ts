import { toEntityId } from '@granit/types';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants.js';

import { sampleParties, toListItem } from './data.js';

import type {
  PartyAddressId,
  PartyAddressRequest,
  PartyCreateRequest,
  PartyEmailId,
  PartyEmailRequest,
  PartyExternalMappingId,
  PartyExternalMappingRequest,
  PartyId,
  PartyMetadataRequest,
  PartyPhoneId,
  PartyPhoneRequest,
  PartyResponse,
  PartyRoleRequest,
  PartyTaxStatusRequest,
  PartyUpdateRequest,
} from '@granit/parties';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

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

    // ── GET detail ───────────────────────────────────────────────────
    http.get(`${baseUrl}/:id`, ({ params }) => {
      const party = findById(params.id as string);
      return party ? HttpResponse.json(party) : notFound();
    }),

    // ── POST create ──────────────────────────────────────────────────
    http.post(baseUrl, async ({ request }) => {
      const body = (await request.json()) as PartyCreateRequest;
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
      return HttpResponse.json(newParty, { status: 201 });
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
      return HttpResponse.json(party, { status: 201 });
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
      return HttpResponse.json(party, { status: 201 });
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
      return HttpResponse.json(party, { status: 201 });
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
      return HttpResponse.json(party, { status: 201 });
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
  ];
}
