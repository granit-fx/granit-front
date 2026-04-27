import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants.js';

import { sampleParties, sampleParty } from './data.js';

import type {
  PartyCreateRequest,
  PartyMetadataRequest,
  PartyTaxStatusRequest,
  PartyUpdateRequest,
} from '@granit/parties';

/**
 * Create stateful MSW handlers for the parties admin endpoints.
 * Mutations update the in-memory `sampleParty` so dependent reads observe them.
 *
 * @param baseUrl - API base path (default: `/api/v1/parties`).
 */
export function createPartiesHandlers(baseUrl = DEFAULT_BASE_PATH) {
  return [
    // GET list
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
      return HttpResponse.json(items);
    }),

    // GET detail
    http.get(`${baseUrl}/:id`, ({ params }) => {
      if (params.id !== sampleParty.id) {
        return new HttpResponse(null, { status: 404 });
      }
      return HttpResponse.json(sampleParty);
    }),

    // POST create
    http.post(baseUrl, async ({ request }) => {
      const body = (await request.json()) as PartyCreateRequest;
      sampleParty.name = body.name;
      sampleParty.kind = body.kind;
      sampleParty.defaultCurrency = body.defaultCurrency;
      if (body.internalNotes !== undefined) sampleParty.internalNotes = body.internalNotes ?? null;
      return HttpResponse.json(sampleParty, { status: 201 });
    }),

    // PATCH identity
    http.patch(`${baseUrl}/:id`, async ({ request }) => {
      const body = (await request.json()) as PartyUpdateRequest;
      sampleParty.name = body.name;
      if (body.website !== undefined) sampleParty.website = body.website ?? null;
      if (body.language !== undefined) sampleParty.language = body.language ?? null;
      if (body.timezone !== undefined) sampleParty.timezone = body.timezone ?? sampleParty.timezone;
      if (body.internalNotes !== undefined) sampleParty.internalNotes = body.internalNotes ?? null;
      return HttpResponse.json(sampleParty);
    }),

    // POST suspend / activate / archive
    http.post(`${baseUrl}/:id/suspend`, () => {
      sampleParty.status = 'Suspended';
      return new HttpResponse(null, { status: 204 });
    }),
    http.post(`${baseUrl}/:id/activate`, () => {
      sampleParty.status = 'Active';
      return new HttpResponse(null, { status: 204 });
    }),
    http.post(`${baseUrl}/:id/archive`, () => {
      sampleParty.status = 'Archived';
      return new HttpResponse(null, { status: 204 });
    }),

    // Sub-collections POST/DELETE — return the aggregate / 204 (state-less for tests)
    http.post(`${baseUrl}/:id/addresses`, () => HttpResponse.json(sampleParty, { status: 201 })),
    http.delete(
      `${baseUrl}/:id/addresses/:addressId`,
      () => new HttpResponse(null, { status: 204 })
    ),

    http.post(`${baseUrl}/:id/emails`, () => HttpResponse.json(sampleParty, { status: 201 })),
    http.delete(`${baseUrl}/:id/emails/:emailId`, () => new HttpResponse(null, { status: 204 })),

    http.post(`${baseUrl}/:id/phones`, () => HttpResponse.json(sampleParty, { status: 201 })),
    http.delete(`${baseUrl}/:id/phones/:phoneId`, () => new HttpResponse(null, { status: 204 })),

    http.post(`${baseUrl}/:id/external-mappings`, () =>
      HttpResponse.json(sampleParty, { status: 201 })
    ),
    http.delete(
      `${baseUrl}/:id/external-mappings/:providerName`,
      () => new HttpResponse(null, { status: 204 })
    ),

    http.post(`${baseUrl}/:id/roles`, () => new HttpResponse(null, { status: 204 })),
    http.delete(`${baseUrl}/:id/roles/:role`, () => new HttpResponse(null, { status: 204 })),

    // PUT tax status
    http.put(`${baseUrl}/:id/tax-status`, async ({ request }) => {
      const body = (await request.json()) as PartyTaxStatusRequest;
      sampleParty.taxStatus = {
        isExempt: body.isExempt,
        reverseCharge: body.reverseCharge,
        vatin: body.vatin ?? null,
        evidenceBlobId: body.evidenceBlobId ?? null,
      };
      return HttpResponse.json(sampleParty);
    }),

    // DELETE clear tax status
    http.delete(`${baseUrl}/:id/tax-status`, () => {
      sampleParty.taxStatus = {
        isExempt: false,
        reverseCharge: false,
        vatin: null,
        evidenceBlobId: null,
      };
      return HttpResponse.json(sampleParty);
    }),

    // PUT replace metadata
    http.put(`${baseUrl}/:id/metadata`, async ({ request }) => {
      const body = (await request.json()) as PartyMetadataRequest;
      sampleParty.metadata = { ...body.metadata };
      return HttpResponse.json(sampleParty);
    }),

    // GET vCard
    http.get(`${baseUrl}/:id/vcard`, () => {
      const vcard = 'BEGIN:VCARD\r\nVERSION:4.0\r\nFN:' + sampleParty.name + '\r\nEND:VCARD\r\n';
      return new HttpResponse(vcard, {
        status: 200,
        headers: { 'Content-Type': 'text/vcard; charset=utf-8' },
      });
    }),
  ];
}
