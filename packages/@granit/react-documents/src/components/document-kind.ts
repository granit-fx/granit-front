/**
 * Coarse-grained classification of a document based on its filename
 * extension. Used by `<DocumentsList>` grid mode and tile renderers to
 * pick an icon / accent color (the package emits `data-granit-document-kind`,
 * apps own the visual layer).
 *
 * Extension-driven on purpose — `DocumentResponse` doesn't carry a MIME
 * type today; mapping by extension keeps tile rendering local and avoids
 * a round-trip per row. Update the table when new file types start
 * showing up in real tenants.
 */
export type DocumentKind =
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'doc'
  | 'spreadsheet'
  | 'presentation'
  | 'archive'
  | 'code'
  | 'text'
  | 'other';

const KIND_BY_EXTENSION: ReadonlyMap<string, DocumentKind> = new Map<string, DocumentKind>([
  // images
  ['jpg', 'image'],
  ['jpeg', 'image'],
  ['png', 'image'],
  ['gif', 'image'],
  ['webp', 'image'],
  ['avif', 'image'],
  ['bmp', 'image'],
  ['tif', 'image'],
  ['tiff', 'image'],
  ['svg', 'image'],
  ['heic', 'image'],
  // video
  ['mp4', 'video'],
  ['mov', 'video'],
  ['webm', 'video'],
  ['mkv', 'video'],
  ['avi', 'video'],
  // audio
  ['mp3', 'audio'],
  ['wav', 'audio'],
  ['ogg', 'audio'],
  ['flac', 'audio'],
  ['m4a', 'audio'],
  // pdf
  ['pdf', 'pdf'],
  // word-likes
  ['doc', 'doc'],
  ['docx', 'doc'],
  ['odt', 'doc'],
  ['rtf', 'doc'],
  // spreadsheets
  ['xls', 'spreadsheet'],
  ['xlsx', 'spreadsheet'],
  ['ods', 'spreadsheet'],
  ['csv', 'spreadsheet'],
  ['tsv', 'spreadsheet'],
  // presentations
  ['ppt', 'presentation'],
  ['pptx', 'presentation'],
  ['odp', 'presentation'],
  // archives
  ['zip', 'archive'],
  ['rar', 'archive'],
  ['tar', 'archive'],
  ['gz', 'archive'],
  ['tgz', 'archive'],
  ['7z', 'archive'],
  ['bz2', 'archive'],
  // code
  ['js', 'code'],
  ['mjs', 'code'],
  ['cjs', 'code'],
  ['ts', 'code'],
  ['tsx', 'code'],
  ['jsx', 'code'],
  ['py', 'code'],
  ['rb', 'code'],
  ['go', 'code'],
  ['rs', 'code'],
  ['cs', 'code'],
  ['java', 'code'],
  ['kt', 'code'],
  ['swift', 'code'],
  ['cpp', 'code'],
  ['cc', 'code'],
  ['cxx', 'code'],
  ['c', 'code'],
  ['h', 'code'],
  ['hpp', 'code'],
  ['sh', 'code'],
  ['bash', 'code'],
  ['zsh', 'code'],
  ['ps1', 'code'],
  ['sql', 'code'],
  ['html', 'code'],
  ['htm', 'code'],
  ['css', 'code'],
  ['scss', 'code'],
  ['less', 'code'],
  ['json', 'code'],
  ['xml', 'code'],
  ['yaml', 'code'],
  ['yml', 'code'],
  ['toml', 'code'],
  // text
  ['md', 'text'],
  ['mdx', 'text'],
  ['txt', 'text'],
  ['log', 'text'],
]);

/**
 * Returns the document kind for a filename. Case-insensitive; everything
 * after the last `.` is the extension. Files without an extension and
 * unknown extensions both fall back to `'other'`.
 */
export function classifyDocumentName(name: string): DocumentKind {
  const dot = name.lastIndexOf('.');
  if (dot <= 0 || dot === name.length - 1) return 'other';
  const ext = name.slice(dot + 1).toLowerCase();
  return KIND_BY_EXTENSION.get(ext) ?? 'other';
}

/**
 * Short uppercase token suitable for displaying inside a tile when no
 * thumbnail is available — typically the extension itself, capped to 4
 * chars. Files without an extension fall back to a generic placeholder.
 */
export function documentBadge(name: string): string {
  const dot = name.lastIndexOf('.');
  if (dot <= 0 || dot === name.length - 1) return '·';
  return name
    .slice(dot + 1)
    .slice(0, 4)
    .toUpperCase();
}
