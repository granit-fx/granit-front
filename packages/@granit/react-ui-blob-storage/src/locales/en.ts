/**
 * English admin strings for the Blob Storage UI. Flat `BlobStorage.*` keys in
 * the `translation` namespace (the host registers them with separators
 * disabled, so the dotted keys are looked up verbatim).
 */
export const blobStorageTranslationsEn = {
  'BlobStorage.Actions.Delete': 'Delete',
  'BlobStorage.Actions.DeleteSuccess': '"{{name}}" deleted',
  'BlobStorage.Actions.Download': 'Download',
  'BlobStorage.CleanupOrphans.Button': 'Cleanup orphans',
  'BlobStorage.CleanupOrphans.DialogDescription':
    'This will delete blobs stuck in "Pending" or "Uploading" state past the orphan threshold. The action is irreversible.',
  'BlobStorage.CleanupOrphans.DialogTitle': 'Clean up orphan blobs?',
  'BlobStorage.CleanupOrphans.Success': '{{count}} orphan blob cleaned up',
  'BlobStorage.Columns.Container': 'Container',
  'BlobStorage.Columns.ContentType': 'Content Type',
  'BlobStorage.Columns.CreatedAt': 'Created At',
  'BlobStorage.Columns.FileName': 'File Name',
  'BlobStorage.Columns.Size': 'Size',
  'BlobStorage.Columns.Status': 'Status',
  'BlobStorage.DeleteDialog.Description':
    'This will permanently delete "{{name}}". This action cannot be undone — the file content is crypto-shredded on the server.',
  'BlobStorage.DeleteDialog.ReasonLabel': 'Reason (optional)',
  'BlobStorage.DeleteDialog.ReasonPlaceholder': 'Why is this file being deleted?',
  'BlobStorage.DeleteDialog.Title': 'Delete file',
  'BlobStorage.Description': 'Manage file storage',
  'BlobStorage.Records': 'records',
  'BlobStorage.Title': 'Blob Storage',
} as const;
