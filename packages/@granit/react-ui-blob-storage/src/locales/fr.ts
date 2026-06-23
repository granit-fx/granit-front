/**
 * French admin strings for the Blob Storage UI. Mirrors {@link blobStorageTranslationsEn}.
 */
export const blobStorageTranslationsFr = {
  'BlobStorage.Actions.Delete': 'Supprimer',
  'BlobStorage.Actions.DeleteSuccess': '« {{name}} » supprimé',
  'BlobStorage.Actions.Download': 'Télécharger',
  'BlobStorage.CleanupOrphans.Button': 'Nettoyer les orphelins',
  'BlobStorage.CleanupOrphans.DialogDescription':
    "Cette action supprimera les blobs bloqués à l'état « En attente » ou « Téléversement » au-delà du seuil d'orphelin. Elle est irréversible.",
  'BlobStorage.CleanupOrphans.DialogTitle': 'Nettoyer les blobs orphelins ?',
  'BlobStorage.CleanupOrphans.Success': '{{count}} blob orphelin nettoyé',
  'BlobStorage.Columns.Container': 'Conteneur',
  'BlobStorage.Columns.ContentType': 'Type de contenu',
  'BlobStorage.Columns.CreatedAt': 'Créé le',
  'BlobStorage.Columns.FileName': 'Nom du fichier',
  'BlobStorage.Columns.Size': 'Taille',
  'BlobStorage.Columns.Status': 'Statut',
  'BlobStorage.DeleteDialog.Description':
    'Cette action supprimera définitivement « {{name}} ». Elle est irréversible — le contenu du fichier est détruit cryptographiquement sur le serveur.',
  'BlobStorage.DeleteDialog.ReasonLabel': 'Motif (facultatif)',
  'BlobStorage.DeleteDialog.ReasonPlaceholder': 'Pourquoi ce fichier est-il supprimé ?',
  'BlobStorage.DeleteDialog.Title': 'Supprimer le fichier',
  'BlobStorage.Description': 'Gérer le stockage de fichiers',
  'BlobStorage.Records': 'enregistrements',
  'BlobStorage.Title': 'Stockage de fichiers',
} as const;
