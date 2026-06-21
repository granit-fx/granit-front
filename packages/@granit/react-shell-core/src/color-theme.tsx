import { createContext, useContext, type ReactNode } from 'react';
import { useStore } from 'zustand';
import { type StoreApi } from 'zustand/vanilla';

import { type ColorThemeState } from '@granit/shell-core';

const ColorThemeStoreContext = createContext<StoreApi<ColorThemeState> | null>(null);

export interface ColorThemeStoreProviderProps {
  /** A store created with `createColorThemeStore` from @granit/shell-core. */
  readonly store: StoreApi<ColorThemeState>;
  readonly children: ReactNode;
}

/**
 * Provide a colour-theme store to the React tree. The store is injected (not a
 * module singleton) so multiple apps on one page keep independent theme state.
 */
export function ColorThemeStoreProvider({ store, children }: ColorThemeStoreProviderProps) {
  return <ColorThemeStoreContext.Provider value={store}>{children}</ColorThemeStoreContext.Provider>;
}

/** Read from the colour-theme store with a selector. */
export function useColorThemeStore<U>(selector: (state: ColorThemeState) => U): U {
  const store = useContext(ColorThemeStoreContext);
  if (!store) {
    throw new Error('useColorThemeStore must be used within a <ColorThemeStoreProvider>');
  }
  return useStore(store, selector);
}
