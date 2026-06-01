import { renderHook } from '@testing-library/react';
import * as React from 'react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it } from 'vitest';

import { createReactLocalization } from '../create-react-localization';
import { useTranslation } from '../use-translation';

import type { i18n } from 'i18next';

function createWrapper(i18nInstance: i18n) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(I18nextProvider, { i18n: i18nInstance }, children);
  };
}

describe('useTranslation', () => {
  describe('with global separators enabled (default)', () => {
    it('resolves nested keys via the default namespace', async () => {
      const i18n = createReactLocalization();
      i18n.addResourceBundle('en', 'translation', {
        Group: { Greeting: 'Hello' },
      });
      await i18n.changeLanguage('en');

      const { result } = renderHook(() => useTranslation(), {
        wrapper: createWrapper(i18n),
      });

      expect(result.current.t('Group.Greeting')).toBe('Hello');
    });

    it('resolves nested keys in a custom namespace', async () => {
      const i18n = createReactLocalization();
      i18n.addResourceBundle('en', 'workflow', {
        Transition: { DraftToPublished: { Title: 'Publish?' } },
      });
      await i18n.changeLanguage('en');

      const { result } = renderHook(() => useTranslation('workflow'), {
        wrapper: createWrapper(i18n),
      });

      expect(result.current.t('Transition.DraftToPublished.Title')).toBe('Publish?');
    });
  });

  describe('with global separators disabled (flat backend bundles)', () => {
    it('keeps flat keys working in the default namespace', async () => {
      const i18n = createReactLocalization();
      i18n.options.nsSeparator = false;
      i18n.options.keySeparator = false;
      i18n.addResourceBundle('en', 'translation', {
        'Dashboard:X.Description': 'flat literal key',
      });
      await i18n.changeLanguage('en');

      const { result } = renderHook(() => useTranslation(), {
        wrapper: createWrapper(i18n),
      });

      expect(result.current.t('Dashboard:X.Description')).toBe('flat literal key');
    });

    it('resolves nested keys in a custom namespace despite global flat config', async () => {
      const i18n = createReactLocalization();
      i18n.options.nsSeparator = false;
      i18n.options.keySeparator = false;
      i18n.addResourceBundle('en', 'workflow', {
        Transition: {
          DraftToPublished: {
            Title: 'Publish this item?',
            Description: 'Publishing makes the item available.',
            Confirm: 'Publish',
          },
        },
      });
      await i18n.changeLanguage('en');

      const { result } = renderHook(() => useTranslation('workflow'), {
        wrapper: createWrapper(i18n),
      });

      expect(result.current.t('Transition.DraftToPublished.Title')).toBe('Publish this item?');
      expect(result.current.t('Transition.DraftToPublished.Confirm')).toBe('Publish');
    });

    it('accepts namespaced keys (`ns:key`) in a custom namespace', async () => {
      const i18n = createReactLocalization();
      i18n.options.nsSeparator = false;
      i18n.options.keySeparator = false;
      i18n.addResourceBundle('en', 'workflow', {
        Transition: { DraftToPublished: { Title: 'Publish this item?' } },
      });
      await i18n.changeLanguage('en');

      const { result } = renderHook(() => useTranslation('workflow'), {
        wrapper: createWrapper(i18n),
      });

      // buildLifecycleTransitionPrompt returns keys prefixed with `workflow:`.
      expect(result.current.t('workflow:Transition.DraftToPublished.Title')).toBe(
        'Publish this item?'
      );
    });

    it('does not override the default namespace even when explicit', async () => {
      const i18n = createReactLocalization();
      i18n.options.nsSeparator = false;
      i18n.options.keySeparator = false;
      i18n.addResourceBundle('en', 'translation', {
        'Dashboard:X.Description': 'flat literal',
      });
      await i18n.changeLanguage('en');

      const { result } = renderHook(() => useTranslation('translation'), {
        wrapper: createWrapper(i18n),
      });

      expect(result.current.t('Dashboard:X.Description')).toBe('flat literal');
    });
  });
});
