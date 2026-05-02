import { fireEvent, render } from '@testing-library/react';
import i18n from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { describe, expect, it } from 'vitest';

import { WidgetActionProvider } from '../components/widget-action-context.js';
import { ImageWidget } from '../components/widgets/image-widget.js';
import { TextWidget } from '../components/widgets/text-widget.js';
import { defaultWidgetActionHandlers } from '../lib/default-widget-action-handlers.js';
import { composeWidgetActionHandlers } from '../lib/widget-action-handler.js';

import type { ImageWidgetDefinition, TextWidgetDefinition } from '@granit/dashboards';
import type { ReactNode } from 'react';

const testI18n = i18n.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  nsSeparator: false,
  keySeparator: false,
  resources: {
    en: {
      translation: {
        'Widget:Logo.Alt': 'Granit logo',
        'Widget:Caption': 'Some caption',
        'Widget:Heading': 'Welcome',
        'Widget:Subheading': 'Sub',
      },
    },
  },
  interpolation: { escapeValue: false },
});

function withProviders(node: ReactNode, captured: { target?: string }) {
  const handlers = composeWidgetActionHandlers(defaultWidgetActionHandlers, {
    OpenDetail: (action) => {
      captured.target = action.target;
    },
  });
  return render(
    <I18nextProvider i18n={testI18n}>
      <WidgetActionProvider handlers={handlers}>{node}</WidgetActionProvider>
    </I18nextProvider>
  );
}

describe('ImageWidget', () => {
  const baseWidget: ImageWidgetDefinition = {
    slug: 'Logo',
    type: 'image',
    position: 0,
    size: { width: 4, height: 1 },
    source: 'https://cdn.example/logo.png',
    altLocalizationKey: 'Widget:Logo.Alt',
  };

  it('renders a non-interactive image when no Click action is wired', () => {
    const captured: { target?: string } = {};
    const { container } = withProviders(<ImageWidget widget={baseWidget} />, captured);

    const root = container.querySelector('[data-slot="image-widget"]');
    expect(root?.tagName).toBe('DIV');
    expect(root?.getAttribute('data-interactive')).toBeNull();

    const img = container.querySelector('img');
    expect(img?.getAttribute('alt')).toBe('Granit logo');
    expect(img?.getAttribute('loading')).toBe('lazy');
  });

  it('uses the default Contain object-fit when fit is omitted', () => {
    const captured: { target?: string } = {};
    const { container } = withProviders(<ImageWidget widget={baseWidget} />, captured);
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img.style.objectFit).toBe('contain');
  });

  it.each([
    ['Cover', 'cover'],
    ['Fill', 'fill'],
    ['Contain', 'contain'],
  ] as const)('maps fit %s to object-fit %s', (fit, css) => {
    const captured: { target?: string } = {};
    const { container } = withProviders(<ImageWidget widget={{ ...baseWidget, fit }} />, captured);
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img.style.objectFit).toBe(css);
  });

  it('renders a native button and dispatches the Click action on body click', () => {
    const captured: { target?: string } = {};
    const widget: ImageWidgetDefinition = {
      ...baseWidget,
      actions: [{ trigger: 'Click', kind: 'OpenDetail', target: 'logo-detail' }],
    };
    const { container } = withProviders(<ImageWidget widget={widget} />, captured);
    const root = container.querySelector('[data-slot="image-widget"]') as HTMLElement;
    expect(root.tagName).toBe('BUTTON');
    expect(root.getAttribute('type')).toBe('button');
    expect(root.getAttribute('data-interactive')).toBe('');

    fireEvent.click(root);
    expect(captured.target).toBe('logo-detail');
  });
});

describe('TextWidget', () => {
  const baseWidget: TextWidgetDefinition = {
    slug: 'Caption',
    type: 'text',
    position: 0,
    size: { width: 6, height: 1 },
    contentLocalizationKey: 'Widget:Caption',
    style: 'Caption',
  };

  it.each([
    ['Body', 'P', 'body'],
    ['Caption', 'P', 'caption'],
    ['Heading', 'H2', 'heading'],
    ['Subheading', 'H3', 'subheading'],
  ] as const)('renders style %s as %s with data-style %s', (style, expectedTag, expectedAttr) => {
    const captured: { target?: string } = {};
    const { container } = withProviders(<TextWidget widget={{ ...baseWidget, style }} />, captured);
    const node = container.querySelector('[data-slot="text-widget"]');
    expect(node?.tagName).toBe(expectedTag);
    expect(node?.getAttribute('data-style')).toBe(expectedAttr);
    expect(node?.getAttribute('role')).toBeNull();
    expect(node?.getAttribute('tabindex')).toBeNull();
  });

  it('keyboard activation (Enter / Space) dispatches the Click action on the styled element', () => {
    const captured: { target?: string } = {};
    const widget: TextWidgetDefinition = {
      ...baseWidget,
      style: 'Subheading',
      actions: [{ trigger: 'Click', kind: 'OpenDetail', target: 'kb-text' }],
    };
    const { container } = withProviders(<TextWidget widget={widget} />, captured);
    const root = container.querySelector('[data-slot="text-widget"]') as HTMLElement;
    expect(root.getAttribute('role')).toBe('button');
    expect(root.getAttribute('tabindex')).toBe('0');

    fireEvent.click(root);
    expect(captured.target).toBe('kb-text');

    captured.target = undefined;
    fireEvent.keyDown(root, { key: 'Enter' });
    expect(captured.target).toBe('kb-text');

    captured.target = undefined;
    fireEvent.keyDown(root, { key: ' ' });
    expect(captured.target).toBe('kb-text');
  });

  it('ignores irrelevant key presses', () => {
    const captured: { target?: string } = {};
    const widget: TextWidgetDefinition = {
      ...baseWidget,
      style: 'Body',
      actions: [{ trigger: 'Click', kind: 'OpenDetail', target: 'noop' }],
    };
    const { container } = withProviders(<TextWidget widget={widget} />, captured);
    const root = container.querySelector('[data-slot="text-widget"]') as HTMLElement;
    fireEvent.keyDown(root, { key: 'Tab' });
    expect(captured.target).toBeUndefined();
  });
});
