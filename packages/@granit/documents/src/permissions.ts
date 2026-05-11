export const DocumentsPermissions = {
  Folders: {
    Read: 'Documents.Folders.Read',
    Manage: 'Documents.Folders.Manage',
  },
  Documents: {
    Read: 'Documents.Documents.Read',
    Manage: 'Documents.Documents.Manage',
  },
  Shares: {
    Read: 'Documents.Shares.Read',
    Manage: 'Documents.Shares.Manage',
  },
  Tags: {
    Read: 'Documents.Tags.Read',
    Manage: 'Documents.Tags.Manage',
  },
  Quotas: {
    Read: 'Documents.Quotas.Read',
  },
} as const;
