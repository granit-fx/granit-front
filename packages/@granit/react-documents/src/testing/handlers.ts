// ---------------------------------------------------------------------------
// @granit/react-documents/testing — MSW handlers
// ---------------------------------------------------------------------------
//
// Stateful in-memory implementation of every endpoint in the Phase 1
// Documents wire contract (folders, documents, versions, shares, tags, quota,
// trash + QueryEngine list). Handlers mutate module-level arrays so subsequent
// GETs reflect prior mutations within a single test/dev session.

import { createQueryMetaHandler } from '@granit/react-query-engine/testing';
import { noContent, notFound, parseFilters, parseSort } from '@granit/testing/msw';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants.js';

import {
  DOC_TRASH_OK_ID,
  DOC_TRASH_URGENT_ID,
  MOCK_OWNER_USER_ID,
  mockDocumentsData,
  mockFoldersData,
  mockQuotaData,
  mockSharesData,
  mockTrashedDocumentsData,
  mockVersionsData,
} from './data.js';
import { documentQueryMetadata } from './query-meta.js';

import type {
  AppendVersionRequest,
  CreateFolderRequest,
  DocumentResponse,
  DocumentTagAssignmentResponse,
  DocumentVersionResponse,
  DownloadUrlResponse,
  FinalizeUploadRequest,
  FolderBreadcrumbResponse,
  FolderResponse,
  GrantShareRequest,
  ListDocumentTagsResponse,
  ListDocumentVersionsResponse,
  ListFoldersResponse,
  ListSharesResponse,
  ListTrashedDocumentsResponse,
  MoveDocumentRequest,
  MoveFolderRequest,
  RenameDocumentRequest,
  RenameFolderRequest,
  ShareResponse,
  TenantStorageQuotaResponse,
  TransferOwnerRequest,
  TrashedDocumentResponse,
  UploadTicketRequest,
  UploadTicketResponse,
} from '@granit/documents';
import type { RequestHandler } from 'msw';

/** Options for {@link createDocumentsHandlers}. */
export interface CreateDocumentsHandlersOptions {
  /** Override the API base path (default: `/api/v1/documents`). */
  readonly basePath?: string;
}

let blobCounter = 1000;
let shareCounter = 1;

const NIL_GUID = '00000000-0000-0000-0000-000000000000';

function newId(prefix: string, counter: number): string {
  const hex = counter.toString(16).padStart(12, '0');
  return `00000000-0000-4000-8000-${prefix.padEnd(4, '0').slice(0, 4)}${hex}`;
}

function invalidNewOwner(value: unknown): boolean {
  return typeof value !== 'string' || value.length === 0 || value.toLowerCase() === NIL_GUID;
}

function unprocessableEntity(detail: string) {
  return HttpResponse.json(
    {
      type: 'about:blank',
      title: 'Unprocessable Entity',
      status: 422,
      detail,
    },
    { status: 422 }
  );
}

/**
 * Create stateful MSW handlers for the Documents Phase 1 surface.
 *
 * Handlers mutate in-memory state — mutations are reflected by subsequent
 * GETs within the same handler set. Call again to reset.
 */
export function createDocumentsHandlers(
  options: CreateDocumentsHandlersOptions = {}
): RequestHandler[] {
  const basePath = options.basePath ?? DEFAULT_BASE_PATH;

  // Fresh per-call state so each setup gets a clean slate.
  const folders = mockFoldersData.map((f) => ({ ...f }));
  const documents = mockDocumentsData.map((d) => ({ ...d }));
  const versions = mockVersionsData.map((v) => ({ ...v }));
  const trashed = mockTrashedDocumentsData.map((t) => ({ ...t }));
  const shares: ShareResponse[] = mockSharesData.map((s) => ({ ...s }));
  const quota: TenantStorageQuotaResponse = { ...mockQuotaData };

  function findFolder(id: string): FolderResponse | undefined {
    return folders.find((f) => f.id === id);
  }
  function findDocument(id: string): DocumentResponse | undefined {
    return documents.find((d) => d.id === id);
  }

  function nextVersionNumber(documentId: string): number {
    let max = 0;
    for (const v of versions) {
      if (v.documentId === documentId && v.versionNumber > max) max = v.versionNumber;
    }
    return max + 1;
  }

  function recomputePath(folder: FolderResponse): string {
    if (!folder.parentFolderId) return `/${folder.name}`;
    const parent = findFolder(folder.parentFolderId);
    if (!parent) return `/${folder.name}`;
    return `${parent.path}/${folder.name}`;
  }

  return [
    // ── QueryEngine /meta + list ─────────────────────────────────────────────
    createQueryMetaHandler(`${basePath}/documents`, documentQueryMetadata),

    http.get(`${basePath}/documents`, ({ request }) => {
      const url = new URL(request.url);
      const filters = parseFilters(url);
      const sort = parseSort(url);
      const page = Number(url.searchParams.get('page') ?? 1);
      const pageSize = Number(url.searchParams.get('pageSize') ?? 50);

      let filtered = documents.filter((d) => d.status !== 'PermanentlyDeleted');
      for (const f of filters) {
        if (f.operator !== 'Eq') continue;
        if (f.field === 'folderId') {
          filtered = filtered.filter((d) => d.folderId === f.value);
        } else if (f.field === 'status') {
          filtered = filtered.filter((d) => d.status === f.value);
        } else if (f.field === 'ownerId') {
          filtered = filtered.filter((d) => d.ownerId === f.value);
        } else if (f.field === 'name') {
          filtered = filtered.filter((d) => d.name === f.value);
        }
      }

      if (sort.some((s) => s.field === 'name')) {
        const entry = sort.find((s) => s.field === 'name');
        filtered = [...filtered].sort((a, b) => {
          const cmp = a.name.localeCompare(b.name);
          return entry?.desc ? -cmp : cmp;
        });
      }

      const start = (page - 1) * pageSize;
      const items = filtered.slice(start, start + pageSize);
      return HttpResponse.json({ items, totalCount: filtered.length });
    }),

    // ── Folders ──────────────────────────────────────────────────────────────
    http.get(`${basePath}/folders`, ({ request }) => {
      const url = new URL(request.url);
      const parentId = url.searchParams.get('parentId');
      const status = (url.searchParams.get('status') ?? 'Active') as FolderResponse['status'];
      const list = folders.filter((f) => {
        if (f.status !== status) return false;
        if (parentId === null) return f.parentFolderId === null;
        return f.parentFolderId === parentId;
      });
      const body: ListFoldersResponse = { folders: list };
      return HttpResponse.json(body);
    }),

    http.post(`${basePath}/folders`, async ({ request }) => {
      const body = (await request.json()) as CreateFolderRequest;
      const parent = body.parentFolderId ? findFolder(body.parentFolderId) : null;
      const id = newId('f9', folders.length + 1);
      const created: FolderResponse = {
        id,
        parentFolderId: body.parentFolderId,
        name: body.name,
        path: parent ? `${parent.path}/${body.name}` : `/${body.name}`,
        depth: (parent?.depth ?? 0) + 1,
        ownerId: MOCK_OWNER_USER_ID,
        status: 'Active',
        trashedAt: null,
        permission: 'Manage',
      };
      folders.push(created);
      return HttpResponse.json(created, { status: 201 });
    }),

    http.get(`${basePath}/folders/:id/breadcrumb`, ({ params }) => {
      const id = params.id as string;
      const target = findFolder(id);
      if (!target) return notFound();
      const chain: FolderResponse[] = [];
      let cursor: FolderResponse | undefined = target;
      while (cursor) {
        chain.unshift(cursor);
        cursor = cursor.parentFolderId ? findFolder(cursor.parentFolderId) : undefined;
      }
      const body: FolderBreadcrumbResponse = { folders: chain };
      return HttpResponse.json(body);
    }),

    http.post(`${basePath}/folders/:id/move`, async ({ params, request }) => {
      const id = params.id as string;
      const folder = findFolder(id);
      if (!folder) return notFound();
      const body = (await request.json()) as MoveFolderRequest;
      const updated: FolderResponse = {
        ...folder,
        parentFolderId: body.newParentFolderId,
      };
      const withPath = { ...updated, path: recomputePath(updated) };
      Object.assign(folder, withPath);
      return HttpResponse.json(folder);
    }),

    http.put(`${basePath}/folders/:id/owner`, async ({ params, request }) => {
      const id = params.id as string;
      const folder = findFolder(id);
      if (!folder) return notFound();
      const body = (await request.json()) as TransferOwnerRequest;
      if (invalidNewOwner(body.newOwnerId)) {
        return unprocessableEntity('newOwnerId must be a non-empty Guid.');
      }
      if (folder.status === 'Trashed') {
        return unprocessableEntity('Cannot transfer ownership of a trashed folder.');
      }
      Object.assign(folder, { ...folder, ownerId: body.newOwnerId });
      return HttpResponse.json(folder);
    }),

    http.post(`${basePath}/folders/:id/restore`, ({ params }) => {
      const id = params.id as string;
      const folder = findFolder(id);
      if (!folder) return notFound();
      const restored: FolderResponse = { ...folder, status: 'Active', trashedAt: null };
      Object.assign(folder, restored);
      return HttpResponse.json(folder);
    }),

    http.get(`${basePath}/folders/:id`, ({ params }) => {
      const id = params.id as string;
      const folder = findFolder(id);
      if (!folder) return notFound();
      return HttpResponse.json(folder);
    }),

    http.patch(`${basePath}/folders/:id`, async ({ params, request }) => {
      const id = params.id as string;
      const folder = findFolder(id);
      if (!folder) return notFound();
      const body = (await request.json()) as RenameFolderRequest;
      const renamed: FolderResponse = { ...folder, name: body.name };
      Object.assign(folder, { ...renamed, path: recomputePath(renamed) });
      return HttpResponse.json(folder);
    }),

    http.delete(`${basePath}/folders/:id`, ({ params }) => {
      const id = params.id as string;
      const folder = findFolder(id);
      if (!folder) return notFound();
      const trashedFolder: FolderResponse = {
        ...folder,
        status: 'Trashed',
        trashedAt: new Date().toISOString(),
      };
      Object.assign(folder, trashedFolder);
      return HttpResponse.json(folder);
    }),

    // ── Folder shares ────────────────────────────────────────────────────────
    http.get(`${basePath}/folders/:folderId/shares`, ({ params }) => {
      const folderId = params.folderId as string;
      const items = shares.filter((s) => s.folderId === folderId);
      const body: ListSharesResponse = { items };
      return HttpResponse.json(body);
    }),

    http.post(`${basePath}/folders/:folderId/shares`, async ({ params, request }) => {
      const folderId = params.folderId as string;
      if (!findFolder(folderId)) return notFound();
      const body = (await request.json()) as GrantShareRequest;
      const share: ShareResponse = {
        id: newId('s1', shareCounter++),
        targetType: 'Folder',
        folderId,
        documentId: null,
        granteeType: body.granteeType,
        granteeId: body.granteeId,
        permission: body.permission,
        isDefault: body.isDefault ?? true,
        expiresAt: body.expiresAt ?? null,
        createdAt: new Date().toISOString(),
        createdByUserId: MOCK_OWNER_USER_ID,
      };
      shares.push(share);
      return HttpResponse.json(share, { status: 201 });
    }),

    // ── Documents ────────────────────────────────────────────────────────────
    http.post(`${basePath}/documents/upload-ticket`, async ({ request }) => {
      const body = (await request.json()) as UploadTicketRequest;
      const blobId = newId('b1', blobCounter++);
      const payload: UploadTicketResponse = {
        blobId,
        uploadUrl: `mock://upload/${blobId}?name=${encodeURIComponent(body.fileName)}`,
        httpMethod: 'PUT',
        expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
        requiredHeaders: {},
      };
      return HttpResponse.json(payload);
    }),

    http.post(`${basePath}/documents/finalize`, async ({ request }) => {
      const body = (await request.json()) as FinalizeUploadRequest;
      const docId = newId('d9', documents.length + 1);
      const initialVersion: DocumentVersionResponse = {
        id: `v-${docId}-1`,
        documentId: docId,
        versionNumber: 1,
        blobDescriptorId: body.blobId,
        sizeBytes: 512_000,
        contentType: 'application/octet-stream',
        contentHash: `sha256:${docId.slice(-6)}1`,
        uploadedByUserId: MOCK_OWNER_USER_ID,
        uploadedAt: new Date().toISOString(),
        commitMessage: body.commitMessage ?? 'Initial upload',
        isCurrent: true,
      };
      versions.push(initialVersion);
      const created: DocumentResponse = {
        id: docId,
        folderId: body.folderId ?? '',
        name: body.name,
        description: body.description ?? null,
        ownerId: MOCK_OWNER_USER_ID,
        currentVersionId: initialVersion.id,
        status: 'Active',
        trashedAt: null,
        permission: 'Manage',
      };
      documents.push(created);
      return HttpResponse.json(created, { status: 201 });
    }),

    http.get(`${basePath}/documents/trash`, ({ request }) => {
      const url = new URL(request.url);
      const skip = Number(url.searchParams.get('skip') ?? 0);
      const take = Number(url.searchParams.get('take') ?? 50);
      const all: readonly TrashedDocumentResponse[] = trashed;
      const slice = all.slice(skip, skip + take);
      const body: ListTrashedDocumentsResponse = {
        documents: slice,
        totalCount: all.length,
        skip,
        take,
      };
      return HttpResponse.json(body);
    }),

    http.get(`${basePath}/documents/:id/versions`, ({ params, request }) => {
      const id = params.id as string;
      if (!findDocument(id)) return notFound();
      const url = new URL(request.url);
      const skip = Number(url.searchParams.get('skip') ?? 0);
      const take = Number(url.searchParams.get('take') ?? 50);
      const all = versions
        .filter((v) => v.documentId === id)
        .sort((a, b) => b.versionNumber - a.versionNumber);
      const slice = all.slice(skip, skip + take);
      const body: ListDocumentVersionsResponse = {
        versions: slice,
        totalCount: all.length,
        skip,
        take,
      };
      return HttpResponse.json(body);
    }),

    http.post(`${basePath}/documents/:id/versions`, async ({ params, request }) => {
      const id = params.id as string;
      const doc = findDocument(id);
      if (!doc) return notFound();
      const body = (await request.json()) as AppendVersionRequest;
      for (const v of versions) {
        if (v.documentId === id && v.isCurrent) {
          (v as DocumentVersionResponse & { isCurrent: boolean }).isCurrent = false;
        }
      }
      const versionNumber = nextVersionNumber(id);
      const newVersion: DocumentVersionResponse = {
        id: `v-${id}-${versionNumber}`,
        documentId: id,
        versionNumber,
        blobDescriptorId: body.blobId,
        sizeBytes: 256_000 + versionNumber * 1024,
        contentType: 'application/octet-stream',
        contentHash: `sha256:${id.slice(-6)}${versionNumber}`,
        uploadedByUserId: MOCK_OWNER_USER_ID,
        uploadedAt: new Date().toISOString(),
        commitMessage: body.commitMessage ?? null,
        isCurrent: true,
      };
      versions.push(newVersion);
      Object.assign(doc, { ...doc, currentVersionId: newVersion.id });
      return HttpResponse.json(newVersion, { status: 201 });
    }),

    http.get(`${basePath}/documents/:id/download`, ({ params, request }) => {
      const id = params.id as string;
      if (!findDocument(id)) return notFound();
      const url = new URL(request.url);
      const versionId = url.searchParams.get('versionId');
      const body: DownloadUrlResponse = {
        url: `mock://download/${id}${versionId ? `?versionId=${versionId}` : ''}`,
        expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
      };
      return HttpResponse.json(body);
    }),

    // Tags
    http.get(`${basePath}/documents/:id/tags`, ({ params }) => {
      const id = params.id as string;
      if (!findDocument(id)) return notFound();
      const body: ListDocumentTagsResponse = { items: [] };
      return HttpResponse.json(body);
    }),

    http.post(`${basePath}/documents/:id/tags/:tagId`, ({ params }) => {
      const documentId = params.id as string;
      const tagId = params.tagId as string;
      if (!findDocument(documentId)) return notFound();
      const assignment: DocumentTagAssignmentResponse = {
        id: newId('t1', shareCounter++),
        tenantId: null,
        tagId,
        documentId,
        assignedAt: new Date().toISOString(),
        assignedByUserId: MOCK_OWNER_USER_ID,
      };
      return HttpResponse.json(assignment, { status: 201 });
    }),

    http.delete(`${basePath}/documents/:id/tags/:tagId`, ({ params }) => {
      const documentId = params.id as string;
      if (!findDocument(documentId)) return notFound();
      return noContent();
    }),

    // Shares attached to a document
    http.get(`${basePath}/documents/:documentId/shares`, ({ params }) => {
      const documentId = params.documentId as string;
      const items = shares.filter((s) => s.documentId === documentId);
      const body: ListSharesResponse = { items };
      return HttpResponse.json(body);
    }),

    http.post(`${basePath}/documents/:documentId/shares`, async ({ params, request }) => {
      const documentId = params.documentId as string;
      if (!findDocument(documentId)) return notFound();
      const body = (await request.json()) as GrantShareRequest;
      const share: ShareResponse = {
        id: newId('s2', shareCounter++),
        targetType: 'Document',
        folderId: null,
        documentId,
        granteeType: body.granteeType,
        granteeId: body.granteeId,
        permission: body.permission,
        isDefault: false,
        expiresAt: body.expiresAt ?? null,
        createdAt: new Date().toISOString(),
        createdByUserId: MOCK_OWNER_USER_ID,
      };
      shares.push(share);
      return HttpResponse.json(share, { status: 201 });
    }),

    http.put(`${basePath}/documents/:id/owner`, async ({ params, request }) => {
      const id = params.id as string;
      const doc = findDocument(id);
      if (!doc) return notFound();
      const body = (await request.json()) as TransferOwnerRequest;
      if (invalidNewOwner(body.newOwnerId)) {
        return unprocessableEntity('newOwnerId must be a non-empty Guid.');
      }
      if (doc.status !== 'Active') {
        return unprocessableEntity('Cannot transfer ownership of a trashed document.');
      }
      Object.assign(doc, { ...doc, ownerId: body.newOwnerId });
      return HttpResponse.json(doc);
    }),

    // Document move / restore / permanent delete
    http.post(`${basePath}/documents/:id/move`, async ({ params, request }) => {
      const id = params.id as string;
      const doc = findDocument(id);
      if (!doc) return notFound();
      const body = (await request.json()) as MoveDocumentRequest;
      Object.assign(doc, { ...doc, folderId: body.newFolderId ?? '' });
      return HttpResponse.json(doc);
    }),

    http.post(`${basePath}/documents/:id/restore`, ({ params }) => {
      const id = params.id as string;
      const doc = findDocument(id);
      if (!doc) return notFound();
      Object.assign(doc, { ...doc, status: 'Active', trashedAt: null });
      const trashIdx = trashed.findIndex((t) => t.id === id);
      if (trashIdx >= 0) trashed.splice(trashIdx, 1);
      return HttpResponse.json(doc);
    }),

    http.delete(`${basePath}/documents/:id/permanent`, ({ params }) => {
      const id = params.id as string;
      const trashIdx = trashed.findIndex((t) => t.id === id);
      const docIdx = documents.findIndex((d) => d.id === id);
      if (
        trashIdx === -1 &&
        docIdx === -1 &&
        ![DOC_TRASH_OK_ID, DOC_TRASH_URGENT_ID].includes(id)
      ) {
        return notFound();
      }
      if (trashIdx >= 0) trashed.splice(trashIdx, 1);
      if (docIdx >= 0) {
        const doc = documents[docIdx];
        if (doc) {
          Object.assign(doc, { ...doc, status: 'PermanentlyDeleted' });
        }
      }
      return noContent();
    }),

    http.get(`${basePath}/documents/:id`, ({ params }) => {
      const id = params.id as string;
      const doc = findDocument(id);
      if (!doc) return notFound();
      return HttpResponse.json(doc);
    }),

    http.patch(`${basePath}/documents/:id`, async ({ params, request }) => {
      const id = params.id as string;
      const doc = findDocument(id);
      if (!doc) return notFound();
      const body = (await request.json()) as RenameDocumentRequest;
      const next: DocumentResponse = {
        ...doc,
        name: body.name ?? doc.name,
        description: body.clearDescription ? null : (body.description ?? doc.description),
      };
      Object.assign(doc, next);
      return HttpResponse.json(doc);
    }),

    http.delete(`${basePath}/documents/:id`, ({ params }) => {
      const id = params.id as string;
      const doc = findDocument(id);
      if (!doc) return notFound();
      const trashedAt = new Date().toISOString();
      Object.assign(doc, { ...doc, status: 'Trashed', trashedAt });
      trashed.push({
        id: doc.id,
        folderId: doc.folderId,
        name: doc.name,
        ownerId: doc.ownerId,
        trashedAt,
        daysUntilPermanentDeletion: 30,
      });
      return HttpResponse.json(doc);
    }),

    // ── Shares (revoke) ──────────────────────────────────────────────────────
    http.delete(`${basePath}/shares/:id`, ({ params }) => {
      const id = params.id as string;
      const idx = shares.findIndex((s) => s.id === id);
      if (idx === -1) return notFound();
      shares.splice(idx, 1);
      return noContent();
    }),

    // ── Quota ────────────────────────────────────────────────────────────────
    http.get(`${basePath}/quota`, () => HttpResponse.json(quota)),
  ];
}
