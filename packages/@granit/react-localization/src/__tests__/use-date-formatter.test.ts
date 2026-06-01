import { renderHook } from '@testing-library/react';
import * as React from 'react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it } from 'vitest';

import { createReactLocalization } from '../create-react-localization';
import { useDateFormatter } from '../use-date-formatter';
import { TimezoneProvider } from '../use-timezone';

function createWrapper(i18n: ReturnType<typeof createReactLocalization>, timezone?: string | null) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    const i18nEl = React.createElement(I18nextProvider, { i18n }, children);
    if (timezone !== undefined) {
      return React.createElement(TimezoneProvider, { value: timezone }, i18nEl);
    }
    return i18nEl;
  };
}

describe('useDateFormatter', () => {
  it('should return formatDate and formatDateTime functions', async () => {
    const i18n = createReactLocalization();
    await i18n.changeLanguage('en');

    const { result } = renderHook(() => useDateFormatter(), {
      wrapper: createWrapper(i18n),
    });

    expect(result.current.formatDate).toBeTypeOf('function');
    expect(result.current.formatDateTime).toBeTypeOf('function');
  });

  it('should format a date string with formatDate', async () => {
    const i18n = createReactLocalization();
    await i18n.changeLanguage('en');

    const { result } = renderHook(() => useDateFormatter(), {
      wrapper: createWrapper(i18n),
    });

    // PPP format for en-US: "April 15, 2025" (long date)
    const formatted = result.current.formatDate('2025-04-15T10:30:00Z');
    expect(formatted).toMatch(/April 15/);
    expect(formatted).toMatch(/2025/);
  });

  it('should format a date string with formatDateTime including time', async () => {
    const i18n = createReactLocalization();
    await i18n.changeLanguage('en');

    const { result } = renderHook(() => useDateFormatter(), {
      wrapper: createWrapper(i18n),
    });

    const formatted = result.current.formatDateTime('2025-04-15T10:30:45Z');
    expect(formatted).toMatch(/April 15/);
    expect(formatted).toMatch(/\d{2}:\d{2}:\d{2}/);
  });

  it('should accept Date objects as input', async () => {
    const i18n = createReactLocalization();
    await i18n.changeLanguage('en');

    const { result } = renderHook(() => useDateFormatter(), {
      wrapper: createWrapper(i18n),
    });

    const date = new Date(2025, 0, 1); // January 1, 2025
    const formatted = result.current.formatDate(date);
    expect(formatted).toMatch(/January 1/);
    expect(formatted).toMatch(/2025/);
  });

  it('should convert UTC date to the provided timezone', async () => {
    const i18n = createReactLocalization();
    await i18n.changeLanguage('en');

    const { result } = renderHook(() => useDateFormatter(), {
      wrapper: createWrapper(i18n, 'America/New_York'),
    });

    // 2025-01-01T03:00:00Z is still Dec 31 in New York (UTC-5)
    const formatted = result.current.formatDate('2025-01-01T03:00:00Z');
    expect(formatted).toMatch(/December 31/);
    expect(formatted).toMatch(/2024/);
  });

  it('should show timezone-correct time in formatDateTime', async () => {
    const i18n = createReactLocalization();
    await i18n.changeLanguage('en');

    const { result } = renderHook(() => useDateFormatter(), {
      wrapper: createWrapper(i18n, 'Europe/Brussels'),
    });

    // 10:00 UTC → 11:00 CET (Europe/Brussels, UTC+1 in January)
    const formatted = result.current.formatDateTime('2025-01-15T10:00:00Z');
    expect(formatted).toMatch(/11:00:00/);
  });

  it('should fall back to browser timezone when provider value is null', async () => {
    const i18n = createReactLocalization();
    await i18n.changeLanguage('en');

    const { result } = renderHook(() => useDateFormatter(), {
      wrapper: createWrapper(i18n, null),
    });

    const formatted = result.current.formatDate('2025-04-15T10:30:00Z');
    expect(formatted).toMatch(/2025/);
  });
});
