import { createColorThemeStore } from '@granit/shell-core';
import { act, renderHook } from '@testing-library/react';
import { type ReactNode } from 'react';

import { ColorThemeStoreProvider, useColorThemeStore } from '../color-theme';

const THEMES = ['blue', 'teal'] as const;

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
    const store = createColorThemeStore({ storageKey: 'ct2', defaultTheme: 'blue', themes: THEMES });
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
