/**
 * English translation bundle for `@granit/react-documents`. Consumers
 * register it via:
 *
 *   i18n.addResourceBundle('en', 'documents', documentsTranslationsEn);
 *
 * Components in this package don't call `useTranslation` directly — they
 * expose `labels` props that apps populate from `t()`. This keeps the
 * components testable without i18next bootstrap, and keeps the framework
 * headless: apps own when and how to mount i18n.
 */
export interface DocumentsTranslations {
  readonly Folder: {
    readonly Tree: {
      readonly Add: string;
      readonly AddRoot: string;
      readonly Rename: string;
      readonly Delete: string;
      readonly DeleteConfirmQuestion: string;
      readonly DeleteConfirm: string;
      readonly DeleteCancel: string;
      readonly Empty: string;
      readonly Loading: string;
      readonly Error: string;
      readonly NewFolderName: string;
    };
    readonly Breadcrumb: {
      readonly Loading: string;
      readonly Root: string;
    };
  };
  readonly Document: {
    readonly Detail: {
      readonly Loading: string;
      readonly NotFound: string;
      readonly Owner: string;
      readonly Status: string;
      readonly Description: string;
      readonly NoDescription: string;
      readonly Download: string;
      readonly Rename: string;
      readonly Versions: string;
      readonly Shares: string;
      readonly Tags: string;
    };
    readonly List: {
      readonly Empty: string;
      readonly NameHeader: string;
      readonly StatusHeader: string;
      readonly SelectHeader: string;
      readonly SelectRow: string;
      readonly Rename: string;
      readonly Trash: string;
      readonly TrashConfirm: string;
      readonly TrashCancel: string;
      readonly Loading: string;
      readonly Error: string;
      readonly Previous: string;
      readonly Next: string;
    };
    readonly Toolbar: {
      readonly NoSelection: string;
      readonly OneSelected: string;
      readonly ManySelected: string;
      readonly ClearSelection: string;
      readonly BulkTrash: string;
      readonly BulkTrashConfirm: string;
      readonly BulkTrashConfirmOk: string;
      readonly BulkTrashCancel: string;
      readonly InspectorToggle: string;
      readonly ViewList: string;
      readonly ViewGrid: string;
      readonly Zoom: string;
    };
    readonly Upload: {
      readonly Button: string;
      readonly Uploading: string;
      readonly QuotaExceeded: string;
      readonly TooLarge: string;
      readonly Failed: string;
    };
    readonly DropZone: {
      readonly Overlay: string;
      readonly UploadingCount: string;
      readonly TooLarge: string;
      readonly QuotaExceeded: string;
      readonly Failed: string;
    };
  };
  readonly Versions: {
    readonly Title: string;
    readonly Empty: string;
    readonly Loading: string;
    readonly VersionHeader: string;
    readonly AuthorHeader: string;
    readonly DateHeader: string;
    readonly SizeHeader: string;
    readonly MessageHeader: string;
    readonly Download: string;
    readonly Current: string;
    readonly Previous: string;
    readonly Next: string;
  };
  readonly Shares: {
    readonly DialogTitle: string;
    readonly GranteeTypeHeader: string;
    readonly GranteeHeader: string;
    readonly PermissionHeader: string;
    readonly ExpiresAtHeader: string;
    readonly Revoke: string;
    readonly Empty: string;
    readonly AddShare: string;
    readonly GranteeTypeUser: string;
    readonly GranteeTypeRole: string;
    readonly GranteeTypeGroup: string;
    readonly PermissionRead: string;
    readonly PermissionEdit: string;
    readonly PermissionManage: string;
    readonly IsDefault: string;
    readonly Grant: string;
    readonly Cancel: string;
    readonly Loading: string;
  };
  readonly Trash: {
    readonly Title: string;
    readonly Empty: string;
    readonly Loading: string;
    readonly NameHeader: string;
    readonly TrashedAtHeader: string;
    readonly CountdownHeader: string;
    readonly DaysRemaining: string;
    readonly Restore: string;
    readonly PermanentlyDelete: string;
    readonly PermanentlyDeleteConfirm: string;
    readonly Previous: string;
    readonly Next: string;
  };
  readonly Quota: {
    readonly Title: string;
    readonly Used: string;
    readonly Limit: string;
    readonly PercentUsed: string;
    readonly UpdatedAt: string;
    readonly Loading: string;
  };
  readonly Explorer: {
    readonly Title: string;
    readonly InspectorEmpty: string;
    readonly InspectorMultiple: string;
  };
  readonly QuickLook: {
    readonly Title: string;
    readonly Close: string;
    readonly Download: string;
    readonly Previous: string;
    readonly Next: string;
    readonly Loading: string;
    readonly LoadingPreview: string;
    readonly Unsupported: string;
    readonly DownloadToView: string;
    readonly PreviewError: string;
    readonly Position: string;
  };
}

export const documentsTranslationsEn: DocumentsTranslations = {
  Folder: {
    Tree: {
      Add: 'New folder',
      AddRoot: 'New root folder',
      Rename: 'Rename',
      Delete: 'Delete',
      DeleteConfirmQuestion: 'Move this folder to the trash? Its contents will be trashed too.',
      DeleteConfirm: 'Confirm',
      DeleteCancel: 'Cancel',
      Empty: 'No folders.',
      Loading: 'Loading…',
      Error: 'Failed to load folders.',
      NewFolderName: 'Folder name',
    },
    Breadcrumb: {
      Loading: 'Loading…',
      Root: 'Root',
    },
  },
  Document: {
    Detail: {
      Loading: 'Loading document…',
      NotFound: 'Document not found.',
      Owner: 'Owner',
      Status: 'Status',
      Description: 'Description',
      NoDescription: 'No description.',
      Download: 'Download current version',
      Rename: 'Rename',
      Versions: 'Versions',
      Shares: 'Shares',
      Tags: 'Tags',
    },
    List: {
      Empty: 'This folder is empty.',
      NameHeader: 'Name',
      StatusHeader: 'Status',
      SelectHeader: 'Select all',
      SelectRow: 'Select',
      Rename: 'Rename',
      Trash: 'Move to trash',
      TrashConfirm: 'Confirm',
      TrashCancel: 'Cancel',
      Loading: 'Loading documents…',
      Error: 'Failed to load documents.',
      Previous: 'Previous',
      Next: 'Next',
    },
    Toolbar: {
      NoSelection: 'No selection',
      OneSelected: 'Selected: {{name}}',
      ManySelected: '{{count}} selected',
      ClearSelection: 'Clear selection',
      BulkTrash: 'Move to trash',
      BulkTrashConfirm: 'Move {{count}} item(s) to trash?',
      BulkTrashConfirmOk: 'Confirm',
      BulkTrashCancel: 'Cancel',
      InspectorToggle: 'Toggle inspector',
      ViewList: 'List view',
      ViewGrid: 'Grid view',
      Zoom: 'Tile size',
    },
    Upload: {
      Button: 'Upload',
      Uploading: 'Uploading…',
      QuotaExceeded: 'Tenant storage quota exceeded.',
      TooLarge: 'File is too large.',
      Failed: 'Upload failed.',
    },
    DropZone: {
      Overlay: 'Drop files to upload',
      UploadingCount: 'Uploading {{done}} / {{total}}…',
      TooLarge: 'File is too large.',
      QuotaExceeded: 'Tenant storage quota exceeded.',
      Failed: 'Upload failed.',
    },
  },
  Versions: {
    Title: 'Version history',
    Empty: 'No versions yet.',
    Loading: 'Loading versions…',
    VersionHeader: 'Version',
    AuthorHeader: 'Author',
    DateHeader: 'Date',
    SizeHeader: 'Size',
    MessageHeader: 'Message',
    Download: 'Download',
    Current: 'current',
    Previous: 'Previous',
    Next: 'Next',
  },
  Shares: {
    DialogTitle: 'Shares',
    GranteeTypeHeader: 'Type',
    GranteeHeader: 'Grantee',
    PermissionHeader: 'Permission',
    ExpiresAtHeader: 'Expires',
    Revoke: 'Revoke',
    Empty: 'No shares yet.',
    AddShare: 'Add share',
    GranteeTypeUser: 'User',
    GranteeTypeRole: 'Role',
    GranteeTypeGroup: 'Group',
    PermissionRead: 'Read',
    PermissionEdit: 'Edit',
    PermissionManage: 'Manage',
    IsDefault: 'Inherit to children',
    Grant: 'Grant',
    Cancel: 'Cancel',
    Loading: 'Loading shares…',
  },
  Trash: {
    Title: 'Trash',
    Empty: 'Trash is empty.',
    Loading: 'Loading trash…',
    NameHeader: 'Name',
    TrashedAtHeader: 'Trashed',
    CountdownHeader: 'Auto-deletion',
    DaysRemaining: 'days left',
    Restore: 'Restore',
    PermanentlyDelete: 'Permanently delete',
    PermanentlyDeleteConfirm: 'Permanently delete this document? This cannot be undone.',
    Previous: 'Previous',
    Next: 'Next',
  },
  Quota: {
    Title: 'Storage usage',
    Used: 'Used',
    Limit: 'Limit',
    PercentUsed: '% used',
    UpdatedAt: 'Updated',
    Loading: 'Loading quota…',
  },
  Explorer: {
    Title: 'Documents',
    InspectorEmpty: 'Select a document to see its details.',
    InspectorMultiple: '{{count}} documents selected.',
  },
  QuickLook: {
    Title: 'Preview',
    Close: 'Close',
    Download: 'Download',
    Previous: 'Previous',
    Next: 'Next',
    Loading: 'Loading…',
    LoadingPreview: 'Loading preview…',
    Unsupported: 'No preview available for {{kind}} files.',
    DownloadToView: 'Download to view',
    PreviewError: 'Failed to load preview.',
    Position: '{{current}} / {{total}}',
  },
};
