import { TooltipProvider } from '@granit/react-ui';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import i18next from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';
import { type ReactElement, type ReactNode } from 'react';

// Shared render helper for @granit/react-ui-admin-kit component tests. The kit's
// components call `useTranslation()` from @granit/react-localization, so they
// need an initialised i18next instance in context. We init once with no
// resources — `t(key)` echoes the key back, which keeps assertions stable
// without coupling tests to copy. Excluded from coverage (see vitest.config.ts).
let initialised = false;

export async function setupI18n(): Promise<void> {
  if (initialised || i18next.isInitialized) {
    initialised = true;
    return;
  }
  await i18next.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    resources: { en: { translation: {} } },
    interpolation: { escapeValue: false },
  });
  initialised = true;
}

function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18next}>
      <TooltipProvider>{children}</TooltipProvider>
    </I18nextProvider>
  );
}

export function renderWithI18n(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
  return render(ui, { wrapper: Providers, ...options });
}
