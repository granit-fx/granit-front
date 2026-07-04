import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EmojiPicker } from './emoji-picker';

// Mutable theme state driven per-test to exercise the three resolveTheme
// branches (dark / light / auto) without relying on next-themes' flaky
// jsdom system-theme resolution.
const themeState = vi.hoisted(() => ({ resolvedTheme: undefined as string | undefined }));
const i18nState = vi.hoisted(() => ({ language: 'en' }));

vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: themeState.resolvedTheme }),
}));

vi.mock('@granit/react-localization', () => ({
  useTranslation: () => ({ i18n: { language: i18nState.language } }),
}));

// Stub the emoji-mart picker + its Twitter data bundle so the lazy chunk
// resolves synchronously to a controllable button that echoes the props the
// component wires and fires onEmojiSelect on click.
vi.mock('@emoji-mart/react', () => ({
  default: (props: {
    onEmojiSelect?: (emoji: { native: string }) => void;
    theme?: string;
    locale?: string;
    set?: string;
  }) => (
    <button
      type="button"
      data-testid="picker"
      data-theme={props.theme}
      data-locale={props.locale}
      data-set={props.set}
      onClick={() => props.onEmojiSelect?.({ native: '😀' })}
    >
      pick
    </button>
  ),
}));

vi.mock('@emoji-mart/data/sets/15/twitter.json', () => ({ default: {} }));

beforeEach(() => {
  themeState.resolvedTheme = undefined;
  i18nState.language = 'en';
});

describe('EmojiPicker', () => {
  it('renders the slot wrapper synchronously and mounts the picker after the lazy chunk resolves', async () => {
    const { container } = render(<EmojiPicker onSelect={vi.fn()} />);
    expect(container.querySelector('[data-slot="emoji-picker"]')).not.toBeNull();
    const picker = await screen.findByTestId('picker');
    expect(picker.getAttribute('data-set')).toBe('twitter');
  });

  it('forwards the picked native grapheme to onSelect', async () => {
    const onSelect = vi.fn();
    render(<EmojiPicker onSelect={onSelect} />);
    const picker = await screen.findByTestId('picker');
    picker.click();
    expect(onSelect).toHaveBeenCalledWith('😀');
  });

  it('maps a dark resolved theme to the picker dark theme', async () => {
    themeState.resolvedTheme = 'dark';
    render(<EmojiPicker onSelect={vi.fn()} />);
    const picker = await screen.findByTestId('picker');
    expect(picker.getAttribute('data-theme')).toBe('dark');
  });

  it('maps a light resolved theme to the picker light theme', async () => {
    themeState.resolvedTheme = 'light';
    render(<EmojiPicker onSelect={vi.fn()} />);
    const picker = await screen.findByTestId('picker');
    expect(picker.getAttribute('data-theme')).toBe('light');
  });

  it('falls back to auto when the resolved theme is undefined', async () => {
    render(<EmojiPicker onSelect={vi.fn()} />);
    const picker = await screen.findByTestId('picker');
    expect(picker.getAttribute('data-theme')).toBe('auto');
  });

  it('derives the picker locale from the i18next language base tag', async () => {
    i18nState.language = 'fr-BE';
    render(<EmojiPicker onSelect={vi.fn()} />);
    const picker = await screen.findByTestId('picker');
    expect(picker.getAttribute('data-locale')).toBe('fr');
  });

  it('closes on Escape when an onClose callback is provided', async () => {
    const onClose = vi.fn();
    render(<EmojiPicker onSelect={vi.fn()} onClose={onClose} />);
    await screen.findByTestId('picker');
    globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ignores non-Escape keys', async () => {
    const onClose = vi.fn();
    render(<EmojiPicker onSelect={vi.fn()} onClose={onClose} />);
    await screen.findByTestId('picker');
    globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('registers no key listener when onClose is omitted', async () => {
    const addSpy = vi.spyOn(globalThis, 'addEventListener');
    render(<EmojiPicker onSelect={vi.fn()} />);
    await screen.findByTestId('picker');
    expect(addSpy.mock.calls.some(([type]) => type === 'keydown')).toBe(false);
    addSpy.mockRestore();
  });

  it('removes the key listener on unmount', async () => {
    const onClose = vi.fn();
    const removeSpy = vi.spyOn(globalThis, 'removeEventListener');
    const { unmount } = render(<EmojiPicker onSelect={vi.fn()} onClose={onClose} />);
    await screen.findByTestId('picker');
    unmount();
    await waitFor(() =>
      expect(removeSpy.mock.calls.some(([type]) => type === 'keydown')).toBe(true)
    );
    removeSpy.mockRestore();
  });
});
