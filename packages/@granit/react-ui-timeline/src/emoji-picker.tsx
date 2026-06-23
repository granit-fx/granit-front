import { lazy, Suspense, useEffect, type ReactNode } from 'react';

import { useTranslation } from '@granit/react-localization';
import { useTheme } from 'next-themes';

interface EmojiMartSelection {
  readonly native: string;
  readonly unified?: string;
  readonly shortcodes?: string;
  readonly name?: string;
}

interface EmojiMartProps {
  readonly set?: 'twitter' | 'apple' | 'google' | 'facebook' | 'native';
  readonly onEmojiSelect?: (emoji: EmojiMartSelection) => void;
  readonly autoFocus?: boolean;
  readonly theme?: 'auto' | 'light' | 'dark';
  readonly locale?: string;
  readonly previewPosition?: 'top' | 'bottom' | 'none';
  readonly skinTonePosition?: 'preview' | 'search' | 'none';
  readonly perLine?: number;
  readonly maxFrequentRows?: number;
}

// Dynamic-import the emoji-mart picker + the **Twitter** data bundle.
// `@emoji-mart/data`'s default export is `sets/15/native.json`, which
// strips the `x`/`y` sprite coordinates emoji-mart needs to position
// each glyph on the Twemoji spritesheet — combining the default data
// with `set="twitter"` produces a broken picker where every cell
// renders as `#️⃣` (the (0,0) cell). Loading the Twitter set directly
// ships the coordinates so the picker aligns with the chip rendering
// (which uses Twemoji via `<TwemojiImage>`).
//
// Code-split so the ~200 KB cost is paid only the first time the
// picker is opened.
const Picker = lazy(async () => {
  const [{ default: PickerComponent }, dataModule] = await Promise.all([
    import('@emoji-mart/react'),
    import('@emoji-mart/data/sets/15/twitter.json'),
  ]);
  return {
    default: function ConfiguredPicker(props: EmojiMartProps): ReactNode {
      return <PickerComponent data={dataModule.default} {...props} />;
    },
  };
});

export interface EmojiPickerProps {
  /** Fires with the literal emoji grapheme (`native`) on user pick. */
  readonly onSelect: (emoji: string) => void;
  /** Optional dismiss callback — `Escape` is the default. */
  readonly onClose?: () => void;
}

// Open-catalog emoji picker built on emoji-mart, configured to:
//  - emit Twemoji codepoints so picked glyphs round-trip cleanly
//    through `<TwemojiImage>` regardless of the user's OS,
//  - mirror the app theme (next-themes → light / dark / auto),
//  - localise category names via i18next's current language.
//
// First mount is async — emoji-mart + its data module are dynamic
// imports. A `null` fallback keeps the parent popover stable while
// the chunk loads (popovers compute their own placement so a
// momentarily empty content doesn't jump).
export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const { resolvedTheme } = useTheme();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (!onClose) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    globalThis.addEventListener('keydown', handler);
    return () => globalThis.removeEventListener('keydown', handler);
  }, [onClose]);

  const theme: EmojiMartProps['theme'] = resolveTheme(resolvedTheme);

  // The picker is mounted inside a Radix Popover which already provides
  // dialog semantics — adding `role="dialog"` here would duplicate them
  // (and trips eslint-plugin-jsx-a11y's "prefer <dialog>" rule).
  return (
    <div data-slot="emoji-picker">
      <Suspense fallback={null}>
        <Picker
          set="twitter"
          theme={theme}
          locale={i18n.language.split('-')[0]}
          autoFocus
          previewPosition="none"
          skinTonePosition="search"
          perLine={8}
          maxFrequentRows={1}
          onEmojiSelect={(emoji) => onSelect(emoji.native)}
        />
      </Suspense>
    </div>
  );
}

function resolveTheme(resolvedTheme: string | undefined): EmojiMartProps['theme'] {
  if (resolvedTheme === 'dark') return 'dark';
  if (resolvedTheme === 'light') return 'light';
  return 'auto';
}
