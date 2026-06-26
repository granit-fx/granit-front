import { persist } from 'zustand/middleware';
import { createStore, type StoreApi } from 'zustand/vanilla';

/**
 * A selectable colour theme as shown in a theme menu. Apps assemble their
 * offered list from catalogue packages (`@granit/ui-theme`, `@granit/ui-themes`,
 * or their own), so each theme is self-describing — the menu needs no central
 * swatch/label registry. `id` is the `data-theme` value applied to `<html>`.
 */
export interface ThemeDescriptor {
  /** Stable id, used as the `<html data-theme>` value and persistence key. */
  id: string;
  /** Human-readable label for the menu (apps may still localise it). */
  label: string;
  /** Preview-dot colour (a literal CSS colour, not `var(--…)`). */
  swatch: string;
}

/**
 * The reactive colour-theme state: the active theme id, a setter, and the list
 * of offered themes (the app's chosen subset of the catalogue).
 */
export interface ColorThemeState {
  colorTheme: string;
  setColorTheme: (theme: string) => void;
  /** The themes this app offers (its chosen subset of the catalogue). */
  themes: readonly ThemeDescriptor[];
}

export interface CreateColorThemeStoreOptions {
  /** localStorage key for persistence (per app, so tenants don't collide). */
  storageKey: string;
  /** Applied on first load / when storage is empty. Must be one of `themes`. */
  defaultTheme: string;
  /** The themes this app offers — its subset of the catalogue, as descriptors. */
  themes: readonly ThemeDescriptor[];
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
  const { themes, defaultTheme } = options;
  // Snap any unknown value (e.g. a persisted theme the app no longer offers) to
  // the default, so removing a theme from the subset can never strand a user.
  const normalize = (theme: string): string =>
    themes.some((t) => t.id === theme) ? theme : defaultTheme;

  return createStore<ColorThemeState>()(
    persist(
      (set) => ({
        colorTheme: defaultTheme,
        themes,
        setColorTheme: (colorTheme) => {
          const next = normalize(colorTheme);
          setDataTheme(next);
          set({ colorTheme: next });
        },
      }),
      {
        name: options.storageKey,
        version: options.version ?? 1,
        migrate: options.migrate,
        // `themes` is config, not user state — persist only the choice and take
        // the offered list from this load's options.
        partialize: (state) => ({ colorTheme: state.colorTheme }),
        merge: (persisted, current) => ({
          ...current,
          colorTheme: normalize(
            (persisted as Partial<ColorThemeState>)?.colorTheme ?? current.colorTheme
          ),
        }),
        onRehydrateStorage: () => (state) => {
          if (state?.colorTheme) setDataTheme(normalize(state.colorTheme));
        },
      }
    )
  );
}
