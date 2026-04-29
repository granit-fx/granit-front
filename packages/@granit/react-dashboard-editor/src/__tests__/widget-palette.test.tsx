import { fireEvent, render } from '@testing-library/react';
import i18n from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import { WidgetPalette } from '../components/widget-palette.js';
import { defaultWidgetCatalog } from '../lib/widget-catalog.js';

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
        'Dashboard:Widget.Markdown.Label': 'Markdown',
        'Dashboard:Widget.Text.Label': 'Text',
        'Dashboard:Widget.Image.Label': 'Image',
      },
    },
  },
  interpolation: { escapeValue: false },
});

function wrap(node: ReactNode) {
  return render(<I18nextProvider i18n={testI18n}>{node}</I18nextProvider>);
}

describe('WidgetPalette', () => {
  it('renders one button per catalog entry, labelled via i18n', () => {
    const { container } = wrap(<WidgetPalette catalog={defaultWidgetCatalog} onAdd={vi.fn()} />);
    const buttons = container.querySelectorAll('[data-slot="widget-palette-item"]');
    expect(buttons).toHaveLength(3);
    expect(buttons[0]?.textContent).toContain('Markdown');
    expect(buttons[1]?.textContent).toContain('Text');
    expect(buttons[2]?.textContent).toContain('Image');
  });

  it('tags each button with the widget type for downstream styling / e2e selectors', () => {
    const { container } = wrap(<WidgetPalette catalog={defaultWidgetCatalog} onAdd={vi.fn()} />);
    const types = Array.from(container.querySelectorAll('[data-slot="widget-palette-item"]')).map(
      (b) => b.getAttribute('data-widget-type')
    );
    expect(types).toEqual(['markdown', 'text', 'image']);
  });

  it('invokes onAdd with the matching entry when a button is clicked', () => {
    const onAdd = vi.fn();
    const { container } = wrap(<WidgetPalette catalog={defaultWidgetCatalog} onAdd={onAdd} />);
    const markdownButton = container.querySelector(
      '[data-slot="widget-palette-item"][data-widget-type="markdown"]'
    );
    if (!(markdownButton instanceof HTMLElement)) {
      throw new Error('markdown button not found');
    }
    fireEvent.click(markdownButton);
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd.mock.calls[0]?.[0]?.type).toBe('markdown');
  });

  it('renders an icon span only when iconKey is set on the entry', () => {
    const { container } = wrap(
      <WidgetPalette
        catalog={[
          {
            type: 'plain',
            labelLocalizationKey: 'Plain',
            defaultSize: { width: 1, height: 1 },
            createDefaultWidget: (slug, position) => ({
              slug,
              type: 'plain',
              position,
              size: { width: 1, height: 1 },
            }),
          },
        ]}
        onAdd={vi.fn()}
      />
    );
    const icons = container.querySelectorAll('[data-slot="widget-palette-icon"]');
    expect(icons).toHaveLength(0);
  });

  it('exposes a toolbar role with an aria-label for assistive tech', () => {
    const { container } = wrap(<WidgetPalette catalog={defaultWidgetCatalog} onAdd={vi.fn()} />);
    const toolbar = container.querySelector('[data-slot="widget-palette"]');
    expect(toolbar?.getAttribute('role')).toBe('toolbar');
    expect(toolbar?.getAttribute('aria-label')).toBe('Widget palette');
  });
});
