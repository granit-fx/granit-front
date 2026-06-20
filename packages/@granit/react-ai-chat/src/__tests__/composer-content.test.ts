import { describe, expect, it } from 'vitest';

import {
  createChipElement,
  formatChipToken,
  isEditorEmpty,
  serializeEditor,
  tokenizeMessageContent,
} from '../components/composer-content';

/** Build an editor root from text + chip specs interleaved in document order. */
function editor(
  ...nodes: ReadonlyArray<string | Parameters<typeof createChipElement>[1]>
): HTMLElement {
  const root = document.createElement('div');
  for (const node of nodes) {
    if (typeof node === 'string') root.appendChild(document.createTextNode(node));
    else root.appendChild(createChipElement(document, node));
  }
  return root;
}

describe('serializeEditor', () => {
  it('injects each chip label into the message at its place in the sentence', () => {
    const root = editor(
      'Fait moi un ',
      { kind: 'prompt', id: 'daily-brief', label: 'Daily brief' },
      ' sur ',
      { kind: 'mention', id: 'ua-1', type: 'account', label: 'United Airlines' },
      ' de manière précise.'
    );

    const { message } = serializeEditor(root);
    // Chips leave a bold marker so the message re-renders them on reload.
    expect(message).toBe(
      'Fait moi un **/Daily brief** sur **@United Airlines** de manière précise.'
    );
  });

  it('collects mentions and prompt refs from the chips', () => {
    const root = editor(
      { kind: 'prompt', id: 'p1', label: 'Summarize' },
      ' ',
      { kind: 'mention', id: 'a1', type: 'account', label: 'Acme' },
      ' ',
      { kind: 'mention', id: 'c2', type: 'contact', label: 'Jane' }
    );

    const { mentions, promptRefs } = serializeEditor(root);
    expect(promptRefs).toEqual(['p1']);
    expect(mentions).toEqual([
      { type: 'account', id: 'a1', label: 'Acme' },
      { type: 'contact', id: 'c2', label: 'Jane' },
    ]);
  });

  it('trims ends and collapses whitespace introduced around chips', () => {
    const root = editor(
      '  hello   ',
      { kind: 'mention', id: 'a1', type: 'account', label: 'Acme' },
      '   world  '
    );

    expect(serializeEditor(root).message).toBe('hello **@Acme** world');
  });

  it('returns an empty request for an empty editor', () => {
    const { message, mentions, promptRefs } = serializeEditor(editor());
    expect(message).toBe('');
    expect(mentions).toEqual([]);
    expect(promptRefs).toEqual([]);
  });
});

describe('formatChipToken / tokenizeMessageContent round-trip', () => {
  it('wraps a chip label in a bold, kind-prefixed marker', () => {
    expect(formatChipToken('prompt', 'Daily brief')).toBe('**/Daily brief**');
    expect(formatChipToken('mention', 'United Airlines')).toBe('**@United Airlines**');
  });

  it('splits a message back into text and chip segments', () => {
    const segments = tokenizeMessageContent(
      'Fait moi un **/Daily brief** sur **@United Airlines** précise.'
    );
    expect(segments).toEqual([
      { type: 'text', value: 'Fait moi un ' },
      { type: 'chip', kind: 'prompt', label: 'Daily brief' },
      { type: 'text', value: ' sur ' },
      { type: 'chip', kind: 'mention', label: 'United Airlines' },
      { type: 'text', value: ' précise.' },
    ]);
  });

  it('returns a single text segment when there are no chip markers', () => {
    expect(tokenizeMessageContent('just text')).toEqual([{ type: 'text', value: 'just text' }]);
  });

  it('leaves plain bold (no leading / or @) untouched as text', () => {
    expect(tokenizeMessageContent('a **bold** word')).toEqual([
      { type: 'text', value: 'a **bold** word' },
    ]);
  });
});

describe('isEditorEmpty', () => {
  it('is true for blank text and a lone <br>', () => {
    expect(isEditorEmpty(editor())).toBe(true);
    expect(isEditorEmpty(editor('   '))).toBe(true);
    const withBr = editor();
    withBr.appendChild(document.createElement('br'));
    expect(isEditorEmpty(withBr)).toBe(true);
  });

  it('is false when a chip is present even without text', () => {
    expect(isEditorEmpty(editor({ kind: 'prompt', id: 'p1', label: 'X' }))).toBe(false);
  });

  it('is false when text is present', () => {
    expect(isEditorEmpty(editor('hi'))).toBe(false);
  });
});

describe('createChipElement', () => {
  it('stores the payload on data attributes and renders the label', () => {
    const chip = createChipElement(document, {
      kind: 'mention',
      id: 'a1',
      type: 'account',
      label: 'Acme',
    });
    expect(chip.dataset.slot).toBe('composer-chip');
    expect(chip.dataset.kind).toBe('mention');
    expect(chip.dataset.id).toBe('a1');
    expect(chip.dataset.type).toBe('account');
    expect(chip.contentEditable).toBe('false');
    expect(chip.textContent).toBe('Acme');
  });

  it('adds a colored dot when an icon color is supplied', () => {
    const chip = createChipElement(document, { kind: 'prompt', id: 'p1', label: 'X' }, '#ff0000');
    const dot = chip.querySelector('span[aria-hidden="true"]');
    expect(dot).not.toBeNull();
    expect((dot as HTMLElement).style.backgroundColor).toBe('rgb(255, 0, 0)');
  });
});
