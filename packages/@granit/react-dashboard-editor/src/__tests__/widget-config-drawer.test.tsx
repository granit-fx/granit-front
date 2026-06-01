import { fireEvent, render } from '@testing-library/react';
import i18n from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import { WidgetConfigDrawer } from '../components/widget-config-drawer';
import { defaultWidgetConfigFormRegistry } from '../lib/default-widget-config-form-registry';
import { composeWidgetConfigFormRegistries } from '../lib/widget-config-form-registry';

import type {
  ImageWidgetDefinition,
  MarkdownWidgetDefinition,
  TextWidgetDefinition,
  WidgetDefinition,
} from '@granit/dashboards';
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
        'Dashboard:Widget.Markdown.ContentKey.Label': 'Markdown content key',
        'Dashboard:Widget.Text.ContentKey.Label': 'Text content key',
        'Dashboard:Widget.Text.Style.Label': 'Style',
        'Dashboard:Widget.Image.Source.Label': 'Source',
        'Dashboard:Widget.Image.AltKey.Label': 'Alt key',
        'Dashboard:Widget.Image.Fit.Label': 'Fit',
        'Dashboard:Widget.UnknownType': 'Unknown widget type: {{type}}',
      },
    },
  },
  interpolation: { escapeValue: false },
});

function wrap(node: ReactNode) {
  return render(<I18nextProvider i18n={testI18n}>{node}</I18nextProvider>);
}

const markdownWidget: MarkdownWidgetDefinition = {
  slug: 'Markdown1',
  type: 'markdown',
  position: 0,
  size: { width: 12, height: 1 },
  contentLocalizationKey: 'Widget:Markdown1.Content',
};

const textWidget: TextWidgetDefinition = {
  slug: 'Text1',
  type: 'text',
  position: 1,
  size: { width: 3, height: 1 },
  contentLocalizationKey: 'Widget:Text1.Content',
  style: 'Body',
};

const imageWidget: ImageWidgetDefinition = {
  slug: 'Image1',
  type: 'image',
  position: 2,
  size: { width: 4, height: 4 },
  source: 'https://example.com/logo.png',
  altLocalizationKey: 'Widget:Image1.Alt',
  fit: 'Contain',
};

describe('WidgetConfigDrawer', () => {
  it('routes a markdown widget through the markdown form', () => {
    const onChange = vi.fn();
    const { container } = wrap(
      <WidgetConfigDrawer
        widget={markdownWidget}
        onChange={onChange}
        registry={defaultWidgetConfigFormRegistry}
      />
    );
    expect(container.querySelector('[data-slot="markdown-config-form"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="text-config-form"]')).toBeNull();
  });

  it('emits onChange with the patched widget when the markdown content key changes', () => {
    const onChange = vi.fn();
    const { container } = wrap(
      <WidgetConfigDrawer
        widget={markdownWidget}
        onChange={onChange}
        registry={defaultWidgetConfigFormRegistry}
      />
    );
    const input = container.querySelector('[data-slot="markdown-content-key"]');
    if (!(input instanceof HTMLInputElement)) throw new Error('input not found');
    fireEvent.change(input, { target: { value: 'Widget:Markdown1.NewKey' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0]).toEqual({
      ...markdownWidget,
      contentLocalizationKey: 'Widget:Markdown1.NewKey',
    });
  });

  it('routes a text widget through the text form and edits the style enum', () => {
    const onChange = vi.fn();
    const { container } = wrap(
      <WidgetConfigDrawer
        widget={textWidget}
        onChange={onChange}
        registry={defaultWidgetConfigFormRegistry}
      />
    );
    const select = container.querySelector('[data-slot="text-style"]');
    if (!(select instanceof HTMLSelectElement)) throw new Error('select not found');
    fireEvent.change(select, { target: { value: 'Heading' } });
    expect(onChange.mock.calls[0]?.[0]?.style).toBe('Heading');
  });

  it('routes an image widget through the image form and edits the source URL', () => {
    const onChange = vi.fn();
    const { container } = wrap(
      <WidgetConfigDrawer
        widget={imageWidget}
        onChange={onChange}
        registry={defaultWidgetConfigFormRegistry}
      />
    );
    const input = container.querySelector('[data-slot="image-source"]');
    if (!(input instanceof HTMLInputElement)) throw new Error('input not found');
    fireEvent.change(input, { target: { value: 'blob:logo-banner' } });
    expect(onChange.mock.calls[0]?.[0]?.source).toBe('blob:logo-banner');
  });

  it('falls back to the unknown-type placeholder for kinds with no registered form', () => {
    const unknown: WidgetDefinition = {
      slug: 'X',
      type: 'mystery',
      position: 0,
      size: { width: 1, height: 1 },
    };
    const { container } = wrap(
      <WidgetConfigDrawer
        widget={unknown}
        onChange={vi.fn()}
        registry={defaultWidgetConfigFormRegistry}
      />
    );
    const fallback = container.querySelector('[data-slot="widget-config-drawer-fallback"]');
    expect(fallback?.textContent).toBe('Unknown widget type: mystery');
  });

  it('surfaces the slug + type as data-attributes for downstream styling', () => {
    const { container } = wrap(
      <WidgetConfigDrawer
        widget={markdownWidget}
        onChange={vi.fn()}
        registry={defaultWidgetConfigFormRegistry}
      />
    );
    const root = container.querySelector('[data-slot="widget-config-drawer"]');
    expect(root?.getAttribute('data-widget-slug')).toBe('Markdown1');
    expect(root?.getAttribute('data-widget-type')).toBe('markdown');
  });

  it('renders the optional header slot next to the title', () => {
    const { container } = wrap(
      <WidgetConfigDrawer
        widget={markdownWidget}
        onChange={vi.fn()}
        registry={defaultWidgetConfigFormRegistry}
        header={<button type="button">Save</button>}
      />
    );
    const header = container.querySelector('[data-slot="widget-config-drawer-header"]');
    expect(header?.textContent).toContain('Save');
  });
});

describe('composeWidgetConfigFormRegistries', () => {
  it('lets later registries override earlier ones on type collision', () => {
    const CustomMarkdown = () => <div data-slot="custom-markdown" />;
    const composed = composeWidgetConfigFormRegistries(defaultWidgetConfigFormRegistry, {
      markdown: CustomMarkdown,
    });
    const { container } = wrap(
      <WidgetConfigDrawer widget={markdownWidget} onChange={vi.fn()} registry={composed} />
    );
    expect(container.querySelector('[data-slot="custom-markdown"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="markdown-config-form"]')).toBeNull();
  });

  it('returns a frozen registry', () => {
    const composed = composeWidgetConfigFormRegistries(defaultWidgetConfigFormRegistry);
    expect(Object.isFrozen(composed)).toBe(true);
  });
});
