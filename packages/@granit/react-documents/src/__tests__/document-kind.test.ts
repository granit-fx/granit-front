import { describe, expect, it } from 'vitest';

import { classifyDocumentName, documentBadge } from '../components/document-kind.ts';

describe('classifyDocumentName', () => {
  it.each([
    ['photo.jpg', 'image'],
    ['scan.PNG', 'image'],
    ['clip.mp4', 'video'],
    ['song.mp3', 'audio'],
    ['contract.pdf', 'pdf'],
    ['notes.docx', 'doc'],
    ['budget.XLSX', 'spreadsheet'],
    ['deck.pptx', 'presentation'],
    ['bundle.tar.gz', 'archive'],
    ['index.ts', 'code'],
    ['readme.md', 'text'],
    ['unknown.xyz', 'other'],
    ['no-extension', 'other'],
    ['.dotfile', 'other'],
    ['trailing.', 'other'],
  ])('classifies %s as %s', (name, expected) => {
    expect(classifyDocumentName(name)).toBe(expected);
  });
});

describe('documentBadge', () => {
  it('returns the uppercased extension capped to 4 chars', () => {
    expect(documentBadge('contract.pdf')).toBe('PDF');
    expect(documentBadge('archive.tar.gz')).toBe('GZ');
    expect(documentBadge('bigext.WEBP')).toBe('WEBP');
    expect(documentBadge('massive.something')).toBe('SOME');
  });

  it('falls back to a placeholder for files without an extension', () => {
    expect(documentBadge('readme')).toBe('·');
    expect(documentBadge('trailing.')).toBe('·');
  });
});
