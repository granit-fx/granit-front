import { createColorThemeStore } from '../color-theme-store';

const THEMES = [
  { id: 'blue', label: 'Blue', swatch: '#1e40af' },
  { id: 'teal', label: 'Teal', swatch: '#115e59' },
  { id: 'rose', label: 'Rose', swatch: '#9f1239' },
] as const;

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe('createColorThemeStore', () => {
  it('initialises with the default theme', () => {
    const store = createColorThemeStore({ storageKey: 'k', defaultTheme: 'blue', themes: THEMES });
    expect(store.getState().colorTheme).toBe('blue');
  });

  it('updates state and reflects the choice onto <html data-theme>', () => {
    const store = createColorThemeStore({ storageKey: 'k', defaultTheme: 'blue', themes: THEMES });
    store.getState().setColorTheme('teal');
    expect(store.getState().colorTheme).toBe('teal');
    expect(document.documentElement.dataset.theme).toBe('teal');
  });

  it('persists the choice under the provided storage key', () => {
    const store = createColorThemeStore({
      storageKey: 'app-theme',
      defaultTheme: 'blue',
      themes: THEMES,
    });
    store.getState().setColorTheme('rose');
    const persisted = JSON.parse(localStorage.getItem('app-theme') ?? '{}');
    expect(persisted.state.colorTheme).toBe('rose');
  });

  it('keeps independent state per store (no shared singleton)', () => {
    const a = createColorThemeStore({ storageKey: 'a', defaultTheme: 'blue', themes: THEMES });
    const b = createColorThemeStore({ storageKey: 'b', defaultTheme: 'blue', themes: THEMES });
    a.getState().setColorTheme('teal');
    expect(a.getState().colorTheme).toBe('teal');
    expect(b.getState().colorTheme).toBe('blue');
  });

  it('exposes the offered themes (the app subset)', () => {
    const store = createColorThemeStore({ storageKey: 'k', defaultTheme: 'blue', themes: THEMES });
    expect(store.getState().themes).toEqual(THEMES);
  });

  it('snaps an unknown theme to the default', () => {
    const store = createColorThemeStore({ storageKey: 'k', defaultTheme: 'blue', themes: THEMES });
    store.getState().setColorTheme('amber'); // not in THEMES
    expect(store.getState().colorTheme).toBe('blue');
    expect(document.documentElement.dataset.theme).toBe('blue');
  });

  it('snaps a persisted theme the app no longer offers to the default', () => {
    localStorage.setItem(
      'app-theme',
      JSON.stringify({ state: { colorTheme: 'amber' }, version: 1 })
    );
    const store = createColorThemeStore({
      storageKey: 'app-theme',
      defaultTheme: 'blue',
      themes: THEMES, // 'amber' removed from the offered set
    });
    expect(store.getState().colorTheme).toBe('blue');
  });
});
