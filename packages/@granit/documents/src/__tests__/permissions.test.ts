import { describe, expect, it } from 'vitest';

import { DocumentsPermissions } from '../permissions';

describe('DocumentsPermissions', () => {
  it('exposes the Folders Read/Manage keys matching the backend', () => {
    expect(DocumentsPermissions.Folders.Read).toBe('Documents.Folders.Read');
    expect(DocumentsPermissions.Folders.Manage).toBe('Documents.Folders.Manage');
  });

  it('exposes the Documents Read/Manage keys matching the backend', () => {
    expect(DocumentsPermissions.Documents.Read).toBe('Documents.Documents.Read');
    expect(DocumentsPermissions.Documents.Manage).toBe('Documents.Documents.Manage');
  });

  it('exposes the Shares Read/Manage keys matching the backend', () => {
    expect(DocumentsPermissions.Shares.Read).toBe('Documents.Shares.Read');
    expect(DocumentsPermissions.Shares.Manage).toBe('Documents.Shares.Manage');
  });

  it('exposes the Tags Read/Manage keys matching the backend', () => {
    expect(DocumentsPermissions.Tags.Read).toBe('Documents.Tags.Read');
    expect(DocumentsPermissions.Tags.Manage).toBe('Documents.Tags.Manage');
  });

  it('exposes the Quotas.Read key matching the backend', () => {
    expect(DocumentsPermissions.Quotas.Read).toBe('Documents.Quotas.Read');
  });
});
