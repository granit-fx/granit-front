import { persist } from 'zustand/middleware';
import { createStore, type StoreApi } from 'zustand/vanilla';

/**
 * The reactive colour-theme state: the active theme + a setter. The theme is a
 * plain `string` — the agnostic store stays decoupled from any app's specific
 * theme union (apps keep that typing alongside their @granit/ui-theme palettes).
 */
export interface ColorThemeState {
  colorTheme: string;
  setColorTheme: (theme: string) => void;
}

export interface CreateColorThemeStoreOptions {
  /** localStorage key for persistence (per app, so tenants don't collide). */
  storageKey: string;
  /** Applied on first load / when storage is empty. Must be one of `themes`. */
  defaultTheme: string;
  /** The set of valid theme names (mirrors @granit/ui-theme COLOR_THEMES). */
  themes: readonly string[];
  /** Optional persisted-state migration (e.g. renamed/removed themes). */
  migrate?: (persisted: unknown, version: number) => ColorThemeState;
  /** Storage version, bumped when `migrate` changes shape. Defaults to 1. */
  version?: number;
}

const setDataTheme = (theme: string): void => {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = theme;
  }
};

/**
 * Create a framework-agnostic colour-theme store (vanilla Zustand) that
 * persists the choice and reflects it onto `<html data-theme>` so the
 * @granit/ui-theme `[data-theme=…]` palettes apply.
 *
 * Returns a `StoreApi` — bind it to a UI framework at the edge (React via
 * `@granit/react-shell-core`'s `ColorThemeStoreProvider`). The store is created
 * per call (not a module singleton) so multiple apps on one page don't share
 * state.
 */
export function createColorThemeStore(
  options: CreateColorThemeStoreOptions
): StoreApi<ColorThemeState> {
  return createStore<ColorThemeState>()(
    persist(
      (set) => ({
        colorTheme: options.defaultTheme,
        setColorTheme: (colorTheme) => {
          setDataTheme(colorTheme);
          set({ colorTheme });
        },
      }),
      {
        name: options.storageKey,
        version: options.version ?? 1,
        migrate: options.migrate,
        onRehydrateStorage: () => (state) => {
          if (state?.colorTheme) setDataTheme(state.colorTheme);
        },
      }
    )
  );
}
