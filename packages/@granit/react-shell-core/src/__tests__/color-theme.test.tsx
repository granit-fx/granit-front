import { createColorThemeStore } from '@granit/shell-core';
import { act, renderHook } from '@testing-library/react';
import { type ReactNode } from 'react';

import { ColorThemeStoreProvider, useColorThemeStore } from '../color-theme';

// The store now offers ThemeDescriptor[] (id/label/swatch), not bare ids — its
// `setColorTheme` rejects ids absent from this list, so they must be descriptors.
const THEMES = [
  { id: 'blue', label: 'Blue', swatch: '#1e40af' },
  { id: 'teal', label: 'Teal', swatch: '#0f766e' },
] as const;

function makeWrapper(store: ReturnType<typeof createColorThemeStore>) {
  return ({ children }: { children: ReactNode }) => (
    <ColorThemeStoreProvider store={store}>{children}</ColorThemeStoreProvider>
  );
}

describe('useColorThemeStore', () => {
  it('reads the selected slice from the injected store', () => {
    const store = createColorThemeStore({ storageKey: 'ct', defaultTheme: 'blue', themes: THEMES });
    const { result } = renderHook(() => useColorThemeStore((s) => s.colorTheme), {
      wrapper: makeWrapper(store),
    });
    expect(result.current).toBe('blue');
  });

  it('re-renders when the store updates', () => {
    const store = createColorThemeStore({
      storageKey: 'ct2',
      defaultTheme: 'blue',
      themes: THEMES,
    });
    const { result } = renderHook(() => useColorThemeStore((s) => s.colorTheme), {
      wrapper: makeWrapper(store),
    });
    act(() => store.getState().setColorTheme('teal'));
    expect(result.current).toBe('teal');
  });

  it('throws when used outside a ColorThemeStoreProvider', () => {
    expect(() => renderHook(() => useColorThemeStore((s) => s.colorTheme))).toThrow(
      /within a <ColorThemeStoreProvider>/
    );
  });
});
