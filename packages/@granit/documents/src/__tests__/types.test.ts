import { describe, expectTypeOf, it } from 'vitest';

import type {
  DocumentResponse,
  DocumentStatus,
  EffectivePermissionLevel,
  FolderResponse,
  FolderStatus,
  ShareGranteeType,
  SharePermissionLevel,
  ShareResponse,
  ShareTargetType,
  TenantStorageQuotaResponse,
  TrashedDocumentResponse,
  UploadTicketResponse,
} from '../types/index';

describe('Folder types', () => {
  it('FolderResponse.parentFolderId is nullable for tenant-root children', () => {
    expectTypeOf<FolderResponse>().toMatchTypeOf<{
      readonly parentFolderId: string | null;
      readonly path: string;
      readonly depth: number;
      readonly status: FolderStatus;
      readonly trashedAt: string | null;
      readonly permission: EffectivePermissionLevel | null;
    }>();
  });

  it('FolderStatus is the Active/Trashed string union (no null)', () => {
    expectTypeOf<FolderStatus>().toEqualTypeOf<'Active' | 'Trashed'>();
  });
});

describe('Document types', () => {
  it('DocumentResponse exposes nullable description and currentVersionId', () => {
    expectTypeOf<DocumentResponse>().toMatchTypeOf<{
      readonly description: string | null;
      readonly currentVersionId: string | null;
      readonly status: DocumentStatus;
      readonly trashedAt: string | null;
    }>();
  });

  it('DocumentStatus covers the full lifecycle including PermanentlyDeleted', () => {
    expectTypeOf<DocumentStatus>().toEqualTypeOf<'Active' | 'Trashed' | 'PermanentlyDeleted'>();
  });

  it('TrashedDocumentResponse.daysUntilPermanentDeletion is a number', () => {
    expectTypeOf<TrashedDocumentResponse>().toMatchTypeOf<{
      readonly id: string;
      readonly folderId: string;
      readonly trashedAt: string;
      readonly daysUntilPermanentDeletion: number;
    }>();
  });

  it('UploadTicketResponse.requiredHeaders is a readonly Record<string, string>', () => {
    expectTypeOf<UploadTicketResponse>().toMatchTypeOf<{
      readonly blobId: string;
      readonly uploadUrl: string;
      readonly requiredHeaders: Readonly<Record<string, string>>;
    }>();
  });
});

describe('Share types', () => {
  it('ShareResponse carries the target-type discriminator with nullable folderId/documentId', () => {
    expectTypeOf<ShareResponse>().toMatchTypeOf<{
      readonly targetType: ShareTargetType;
      readonly folderId: string | null;
      readonly documentId: string | null;
      readonly granteeType: ShareGranteeType;
      readonly permission: SharePermissionLevel;
      readonly expiresAt: string | null;
    }>();
  });

  it('SharePermissionLevel is the Read/Edit/Manage string union', () => {
    expectTypeOf<SharePermissionLevel>().toEqualTypeOf<'Read' | 'Edit' | 'Manage'>();
  });

  it('ShareTargetType is the Folder/Document string union', () => {
    expectTypeOf<ShareTargetType>().toEqualTypeOf<'Folder' | 'Document'>();
  });

  it('ShareGranteeType is the User/Role/Group string union', () => {
    expectTypeOf<ShareGranteeType>().toEqualTypeOf<'User' | 'Role' | 'Group'>();
  });
});

describe('Quota types', () => {
  it('TenantStorageQuotaResponse exposes numeric byte counters + percentUsed', () => {
    expectTypeOf<TenantStorageQuotaResponse>().toMatchTypeOf<{
      readonly limitBytes: number;
      readonly usageBytes: number;
      readonly percentUsed: number;
      readonly updatedAt: string;
    }>();
  });
});
