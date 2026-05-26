// ---------------------------------------------------------------------------
// @granit/react-documents/testing — In-memory fixtures
// ---------------------------------------------------------------------------
//
// Stable UUIDs + ISO timestamps anchored on 2026-05-11T10:00:00Z (currentDate).
// Imported by the MSW handler factory; consumers may import the raw fixtures
// directly to seed Storybook stories or visual tests.

import type {
  DocumentResponse,
  DocumentVersionResponse,
  FolderResponse,
  ShareResponse,
  TenantStorageQuotaResponse,
  TrashedDocumentResponse,
} from '@granit/documents';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

// Stable owner identifiers used across all fixtures.
const OWNER_USER_ID = '00000000-0000-4000-8000-0000000000a1';
const OTHER_USER_ID = '00000000-0000-4000-8000-0000000000a2';

// Anchor every relative timestamp to the project's currentDate.
const T0 = '2026-05-11T10:00:00Z';
const T1 = '2026-05-11T09:00:00Z';
const T2 = '2026-05-10T16:30:00Z';
const T3 = '2026-05-09T11:00:00Z';
const T4 = '2026-05-05T08:00:00Z';
const T5 = '2026-04-28T12:00:00Z';

// ---------------------------------------------------------------------------
// Folders
// ---------------------------------------------------------------------------

export const FOLDER_CONTRACTS_ID = '00000000-0000-4000-8000-00000000f001';
export const FOLDER_INVOICES_ID = '00000000-0000-4000-8000-00000000f002';
export const FOLDER_CONTRACTS_2025_ID = '00000000-0000-4000-8000-00000000f003';
export const FOLDER_CONTRACTS_2026_ID = '00000000-0000-4000-8000-00000000f004';

export const mockFoldersData: Mutable<FolderResponse>[] = [
  {
    id: FOLDER_CONTRACTS_ID,
    parentFolderId: null,
    name: 'Contracts',
    path: '/Contracts',
    depth: 1,
    ownerId: OWNER_USER_ID,
    status: 'Active',
    trashedAt: null,
    permission: 'Manage',
  },
  {
    id: FOLDER_INVOICES_ID,
    parentFolderId: null,
    name: 'Invoices',
    path: '/Invoices',
    depth: 1,
    ownerId: OWNER_USER_ID,
    status: 'Active',
    trashedAt: null,
    permission: 'Manage',
  },
  {
    id: FOLDER_CONTRACTS_2025_ID,
    parentFolderId: FOLDER_CONTRACTS_ID,
    name: '2025',
    path: '/Contracts/2025',
    depth: 2,
    ownerId: OWNER_USER_ID,
    status: 'Active',
    trashedAt: null,
    permission: 'Manage',
  },
  {
    id: FOLDER_CONTRACTS_2026_ID,
    parentFolderId: FOLDER_CONTRACTS_ID,
    name: '2026',
    path: '/Contracts/2026',
    depth: 2,
    ownerId: OWNER_USER_ID,
    status: 'Active',
    trashedAt: null,
    permission: 'Manage',
  },
];

// ---------------------------------------------------------------------------
// Documents (active)
// ---------------------------------------------------------------------------

export const DOC_NDA_ID = '00000000-0000-4000-8000-00000000d001';
export const DOC_MSA_ID = '00000000-0000-4000-8000-00000000d002';
export const DOC_SOW_2025_ID = '00000000-0000-4000-8000-00000000d003';
export const DOC_SOW_2026_ID = '00000000-0000-4000-8000-00000000d004';
export const DOC_INVOICE_001_ID = '00000000-0000-4000-8000-00000000d005';
export const DOC_INVOICE_002_ID = '00000000-0000-4000-8000-00000000d006';
export const DOC_INVOICE_003_ID = '00000000-0000-4000-8000-00000000d007';

export const mockDocumentsData: Mutable<DocumentResponse>[] = [
  {
    id: DOC_NDA_ID,
    folderId: FOLDER_CONTRACTS_ID,
    name: 'NDA.pdf',
    description: 'Mutual non-disclosure agreement',
    ownerId: OWNER_USER_ID,
    currentVersionId: 'v-' + DOC_NDA_ID + '-2',
    status: 'Active',
    trashedAt: null,
    permission: 'Manage',
  },
  {
    id: DOC_MSA_ID,
    folderId: FOLDER_CONTRACTS_ID,
    name: 'MSA.pdf',
    description: 'Master services agreement',
    ownerId: OWNER_USER_ID,
    currentVersionId: 'v-' + DOC_MSA_ID + '-1',
    status: 'Active',
    trashedAt: null,
    permission: 'Manage',
  },
  {
    id: DOC_SOW_2025_ID,
    folderId: FOLDER_CONTRACTS_2025_ID,
    name: 'SOW-2025-Q1.pdf',
    description: null,
    ownerId: OWNER_USER_ID,
    currentVersionId: 'v-' + DOC_SOW_2025_ID + '-1',
    status: 'Active',
    trashedAt: null,
    permission: 'Edit',
  },
  {
    id: DOC_SOW_2026_ID,
    folderId: FOLDER_CONTRACTS_2026_ID,
    name: 'SOW-2026-Q1.pdf',
    description: null,
    ownerId: OTHER_USER_ID,
    currentVersionId: 'v-' + DOC_SOW_2026_ID + '-1',
    status: 'Active',
    trashedAt: null,
    permission: 'Read',
  },
  {
    id: DOC_INVOICE_001_ID,
    folderId: FOLDER_INVOICES_ID,
    name: 'INV-001.pdf',
    description: null,
    ownerId: OWNER_USER_ID,
    currentVersionId: 'v-' + DOC_INVOICE_001_ID + '-1',
    status: 'Active',
    trashedAt: null,
    permission: 'Manage',
  },
  {
    id: DOC_INVOICE_002_ID,
    folderId: FOLDER_INVOICES_ID,
    name: 'INV-002.pdf',
    description: null,
    ownerId: OWNER_USER_ID,
    currentVersionId: 'v-' + DOC_INVOICE_002_ID + '-1',
    status: 'Active',
    trashedAt: null,
    permission: 'Manage',
  },
  {
    id: DOC_INVOICE_003_ID,
    folderId: FOLDER_INVOICES_ID,
    name: 'INV-003.pdf',
    description: 'Draft, pending review',
    ownerId: OWNER_USER_ID,
    currentVersionId: 'v-' + DOC_INVOICE_003_ID + '-2',
    status: 'Active',
    trashedAt: null,
    permission: 'Manage',
  },
];

// ---------------------------------------------------------------------------
// Versions
// ---------------------------------------------------------------------------

function makeVersions(
  documentId: string,
  count: number,
  baseTimes: readonly string[]
): Mutable<DocumentVersionResponse>[] {
  const versions: Mutable<DocumentVersionResponse>[] = [];
  for (let n = 1; n <= count; n++) {
    versions.push({
      id: `v-${documentId}-${n}`,
      documentId,
      versionNumber: n,
      blobDescriptorId: `blob-${documentId}-${n}`,
      sizeBytes: 250_000 * n + 1024,
      contentType: 'application/pdf',
      contentHash: `sha256:${documentId.slice(-6)}${n}`,
      uploadedByUserId: OWNER_USER_ID,
      uploadedAt: baseTimes[n - 1] ?? T5,
      commitMessage: n === 1 ? 'Initial upload' : `Revision ${n}`,
      isCurrent: n === count,
    });
  }
  return versions;
}

export const mockVersionsData: Mutable<DocumentVersionResponse>[] = [
  ...makeVersions(DOC_NDA_ID, 2, [T4, T2]),
  ...makeVersions(DOC_MSA_ID, 1, [T3]),
  ...makeVersions(DOC_SOW_2025_ID, 3, [T5, T4, T1]),
  ...makeVersions(DOC_SOW_2026_ID, 1, [T2]),
  ...makeVersions(DOC_INVOICE_001_ID, 1, [T3]),
  ...makeVersions(DOC_INVOICE_002_ID, 1, [T2]),
  ...makeVersions(DOC_INVOICE_003_ID, 2, [T3, T1]),
];

// ---------------------------------------------------------------------------
// Trashed documents (urgent + non-urgent branches)
// ---------------------------------------------------------------------------

export const DOC_TRASH_URGENT_ID = '00000000-0000-4000-8000-00000000dt01';
export const DOC_TRASH_OK_ID = '00000000-0000-4000-8000-00000000dt02';

export const mockTrashedDocumentsData: Mutable<TrashedDocumentResponse>[] = [
  {
    id: DOC_TRASH_URGENT_ID,
    folderId: FOLDER_INVOICES_ID,
    name: 'INV-old-draft.pdf',
    ownerId: OWNER_USER_ID,
    trashedAt: T2,
    daysUntilPermanentDeletion: 5,
  },
  {
    id: DOC_TRASH_OK_ID,
    folderId: FOLDER_CONTRACTS_ID,
    name: 'Contract-draft.pdf',
    ownerId: OWNER_USER_ID,
    trashedAt: T4,
    daysUntilPermanentDeletion: 25,
  },
];

// ---------------------------------------------------------------------------
// Shares (intentionally empty — exercise the empty-state UI)
// ---------------------------------------------------------------------------

export const mockSharesData: Mutable<ShareResponse>[] = [];

// ---------------------------------------------------------------------------
// Quota (25% used = 2.5 GB / 10 GB)
// ---------------------------------------------------------------------------

export const mockQuotaData: Mutable<TenantStorageQuotaResponse> = {
  limitBytes: 10 * 1024 ** 3,
  usageBytes: 2.5 * 1024 ** 3,
  percentUsed: 25,
  updatedAt: T0,
};

// ---------------------------------------------------------------------------
// Common constants re-exported for handler use
// ---------------------------------------------------------------------------

export const MOCK_OWNER_USER_ID = OWNER_USER_ID;
export const MOCK_ANCHOR_TIME = T0;
