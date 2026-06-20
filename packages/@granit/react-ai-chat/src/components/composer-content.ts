import type { StagedMention } from './composer-types';
import type { PromptId } from '@granit/ai-chat';

/**
 * Inline chip model for the composer's `contenteditable` input. Both `/` prompts
 * and `@` mentions are rendered as non-editable chip elements sitting in the text
 * flow; their data attributes are the source of truth that {@link serializeEditor}
 * reads back into a submittable request — the DOM is the single store, so there is
 * no parallel React state to keep in sync.
 */

/** `data-slot` marking a chip element in the editor. */
export const CHIP_SLOT = 'composer-chip';

/** A chip's kind, stored on `data-kind`. */
export type ChipKind = 'prompt' | 'mention';

/** Everything needed to render and later serialize a chip. */
export interface ChipSpec {
  readonly kind: ChipKind;
  /** Prompt id (`/`) or mention id (`@`). */
  readonly id: string;
  /** Mention type (`@` only); omitted for prompts. */
  readonly type?: string;
  /** Visible text, also injected into the serialized message. */
  readonly label: string;
}

/** The chip element's CSS — a subtle inline pill that reads as part of the text. */
const CHIP_CLASS =
  'mx-0.5 inline-flex select-none items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 align-baseline text-sm font-medium text-primary';

/**
 * Build a non-editable chip element for the editor. The element carries its
 * payload on `data-*` so {@link serializeEditor} can reconstruct the request
 * without any React state. A leading colored dot (when {@link iconColor} is set)
 * mirrors the host's glyph without the framework hardcoding an icon set.
 */
export function createChipElement(
  doc: Document,
  spec: ChipSpec,
  iconColor?: string | null
): HTMLElement {
  const chip = doc.createElement('span');
  chip.dataset.slot = CHIP_SLOT;
  chip.dataset.kind = spec.kind;
  chip.dataset.id = spec.id;
  if (spec.type) chip.dataset.type = spec.type;
  chip.dataset.label = spec.label;
  chip.contentEditable = 'false';
  chip.className = CHIP_CLASS;

  if (iconColor) {
    const dot = doc.createElement('span');
    dot.setAttribute('aria-hidden', 'true');
    dot.className = 'size-2 shrink-0 rounded-full';
    dot.style.backgroundColor = iconColor;
    chip.appendChild(dot);
  }

  chip.appendChild(doc.createTextNode(spec.label));
  return chip;
}

/**
 * Marker a chip leaves in the serialized message so it survives the round-trip
 * (send → persist → reload) with no extra wire fields: a bold run of the kind
 * char + label — slash for a prompt, `**@United Airlines**` for a mention.
 * Mirrors how Gemini keeps mentions
 * as bold `@…` runs in the text; the markdown-bold delimiters bound multi-word
 * labels unambiguously, {@link tokenizeMessageContent} turns them back into chips
 * for display, and the raw text stays the canonical `content`.
 */
export function formatChipToken(kind: ChipKind, label: string): string {
  return `**${kind === 'prompt' ? '/' : '@'}${label}**`;
}

/** Matches a chip token, capturing its kind char (`/`|`@`) and label. */
const CHIP_TOKEN = /\*\*([/@])([^*]+)\*\*/g;

/** A run of plain text or a chip, in document order. */
export type ContentSegment =
  | { readonly type: 'text'; readonly value: string }
  | { readonly type: 'chip'; readonly kind: ChipKind; readonly label: string };

/**
 * Split a persisted message into text + chip segments for rendering. Inverse of
 * {@link formatChipToken}: every `[[/…]]` / `[[@…]]` marker becomes a chip
 * segment, everything else stays verbatim text — so a reloaded message shows the
 * same chips the user composed, with no server-side metadata.
 */
export function tokenizeMessageContent(content: string): readonly ContentSegment[] {
  const segments: ContentSegment[] = [];
  let last = 0;
  for (const match of content.matchAll(CHIP_TOKEN)) {
    const index = match.index ?? 0;
    if (index > last) segments.push({ type: 'text', value: content.slice(last, index) });
    segments.push({
      type: 'chip',
      kind: match[1] === '/' ? 'prompt' : 'mention',
      label: match[2]!,
    });
    last = index + match[0].length;
  }
  if (last < content.length) segments.push({ type: 'text', value: content.slice(last) });
  return segments;
}

/** Whether a node is a composer chip element. */
function isChip(node: Node): node is HTMLElement {
  return node.nodeType === 1 && (node as HTMLElement).dataset?.slot === CHIP_SLOT;
}

/** The request fields a composer turn carries beyond plain text. */
export interface SerializedEditor {
  readonly message: string;
  readonly mentions: readonly StagedMention[];
  readonly promptRefs: readonly PromptId[];
}

/**
 * Read the editor DOM back into a submittable shape. Walks in document order so
 * each chip contributes its {@link formatChipToken} marker to
 * {@link SerializedEditor.message} at its place in the sentence (so the message
 * re-renders with the same chips) while also populating the structured
 * {@link SerializedEditor.mentions}/{@link SerializedEditor.promptRefs}.
 * Leading/trailing whitespace is trimmed and runs of inner whitespace collapsed,
 * so the chip's surrounding spaces never produce doubled gaps.
 */
export function serializeEditor(root: HTMLElement): SerializedEditor {
  const parts: string[] = [];
  const mentions: StagedMention[] = [];
  const promptRefs: PromptId[] = [];

  const walk = (node: Node): void => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === 3) {
        parts.push(child.textContent ?? '');
      } else if (isChip(child)) {
        const { kind, id, type, label = '' } = child.dataset;
        parts.push(formatChipToken(kind === 'mention' ? 'mention' : 'prompt', label));
        if (kind === 'mention' && id && type) {
          mentions.push({ type, id, label });
        } else if (kind === 'prompt' && id) {
          promptRefs.push(id as PromptId);
        }
      } else if (child.nodeName === 'BR') {
        parts.push('\n');
      } else {
        walk(child);
      }
    }
  };
  walk(root);

  const message = parts
    .join('')
    .replace(/[^\S\n]+/g, ' ')
    .trim();
  return { message, mentions, promptRefs };
}

/**
 * True when the editor holds no text and no chips — used to drive the placeholder
 * and disable Send. A lone `<br>` (browsers seed an empty editable with one)
 * still counts as empty.
 */
export function isEditorEmpty(root: HTMLElement): boolean {
  if (root.querySelector(`[data-slot="${CHIP_SLOT}"]`)) return false;
  return (root.textContent ?? '').trim().length === 0;
}
