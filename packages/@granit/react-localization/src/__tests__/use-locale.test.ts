import { act, renderHook } from '@testing-library/react';
import * as React from 'react';
import { I18nextProvider } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createReactLocalization } from '../create-react-localization';
import { useLocale } from '../use-locale';

afterEach(() => {
  localStorage.clear();
});

function createWrapper(i18n: ReturnType<typeof createReactLocalization>) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(I18nextProvider, { i18n }, children);
  };
}

describe('useLocale', () => {
  it('should return the current locale from i18next', async () => {
    const i18n = createReactLocalization();
    await i18n.changeLanguage('en');

    const { result } = renderHook(() => useLocale(), {
      wrapper: createWrapper(i18n),
    });

    expect(result.current.locale).toBe('en');
  });

  it('should return "fr" as fallback when no language is set', () => {
    const i18n = createReactLocalization();

    const { result } = renderHook(() => useLocale(), {
      wrapper: createWrapper(i18n),
    });

    expect(result.current.locale).toBe('fr');
  });

  it('should persist to localStorage and change i18next language when setLocale is called', async () => {
    const i18n = createReactLocalization();
    await i18n.changeLanguage('fr');

    const { result } = renderHook(() => useLocale(), {
      wrapper: createWrapper(i18n),
    });

    act(() => {
      result.current.setLocale('en');
    });

    expect(localStorage.getItem('dd:locale')).toBe('"en"');
    expect(i18n.language).toBe('en');
  });

  it('should call onLocaleChange when setLocale is called', async () => {
    const i18n = createReactLocalization();
    await i18n.changeLanguage('fr');
    const onLocaleChange = vi.fn();

    const { result } = renderHook(() => useLocale({ onLocaleChange }), {
      wrapper: createWrapper(i18n),
    });

    act(() => {
      result.current.setLocale('en');
    });

    expect(onLocaleChange).toHaveBeenCalledWith('en');
    expect(onLocaleChange).toHaveBeenCalledTimes(1);
  });

  it('should work without onLocaleChange callback', async () => {
    const i18n = createReactLocalization();
    await i18n.changeLanguage('fr');

    const { result } = renderHook(() => useLocale(), {
      wrapper: createWrapper(i18n),
    });

    act(() => {
      result.current.setLocale('de');
    });

    expect(i18n.language).toBe('de');
  });
});
