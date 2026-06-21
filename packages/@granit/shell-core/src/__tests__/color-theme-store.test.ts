import { createColorThemeStore } from '../color-theme-store';

const THEMES = ['blue', 'teal', 'rose'] as const;

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
    const store = createColorThemeStore({ storageKey: 'app-theme', defaultTheme: 'blue', themes: THEMES });
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
});
