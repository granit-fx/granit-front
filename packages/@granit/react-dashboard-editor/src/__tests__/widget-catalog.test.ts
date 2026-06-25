import { describe, expect, it } from 'vitest';

import {
  addWidget,
  composeCatalogs,
  defaultWidgetCatalog,
  DEFAULT_MIN_WIDGET_SIZE,
  resolveWidgetMinSize,
} from '../lib/widget-catalog';

import type { WidgetCatalogEntry } from '../lib/widget-catalog';
import type { DashboardDefinition } from '@granit/dashboards';

const baseDefinition: DashboardDefinition = {
  name: 'Test',
  category: 'General',
  isSystem: false,
  version: '1.0.0',
  layout: { columns: 12, rowHeight: 80 },
  widgets: [],
};

describe('resolveWidgetMinSize', () => {
  const catalog: readonly WidgetCatalogEntry[] = [
    {
      type: 'kpi',
      labelLocalizationKey: 'k',
      defaultSize: { width: 3, height: 2 },
      minSize: { width: 2, height: 2 },
      createDefaultWidget: (slug, position) => ({
        slug,
        type: 'kpi',
        position,
        size: { width: 3, height: 2 },
      }),
    },
  ];

  it('returns the matching entry minSize', () => {
    expect(resolveWidgetMinSize(catalog, 'kpi')).toEqual({ width: 2, height: 2 });
  });

  it('falls back to DEFAULT_MIN_WIDGET_SIZE for an unknown type', () => {
    expect(resolveWidgetMinSize(catalog, 'chart')).toBe(DEFAULT_MIN_WIDGET_SIZE);
  });

  it('falls back to DEFAULT_MIN_WIDGET_SIZE when no catalog is supplied', () => {
    expect(resolveWidgetMinSize(undefined, 'kpi')).toBe(DEFAULT_MIN_WIDGET_SIZE);
  });

  it('falls back to DEFAULT_MIN_WIDGET_SIZE when the entry omits minSize', () => {
    const noMin: readonly WidgetCatalogEntry[] = [
      {
        type: 'bare',
        labelLocalizationKey: 'b',
        defaultSize: { width: 2, height: 2 },
        createDefaultWidget: (slug, position) => ({
          slug,
          type: 'bare',
          position,
          size: { width: 2, height: 2 },
        }),
      },
    ];
    expect(resolveWidgetMinSize(noMin, 'bare')).toBe(DEFAULT_MIN_WIDGET_SIZE);
  });
});

describe('defaultWidgetCatalog', () => {
  it('ships entries for the framework widget kinds (markdown / text / image)', () => {
    const types = defaultWidgetCatalog.map((entry) => entry.type);
    expect(types).toEqual(['markdown', 'text', 'image']);
  });

  it('factories produce widgets whose declared type matches the entry', () => {
    for (const entry of defaultWidgetCatalog) {
      const created = entry.createDefaultWidget('Tmp', 0);
      expect(created.type).toBe(entry.type);
      expect(created.slug).toBe('Tmp');
      expect(created.position).toBe(0);
    }
  });
});

describe('composeCatalogs', () => {
  const a: WidgetCatalogEntry = {
    type: 'a',
    labelLocalizationKey: 'a.label',
    defaultSize: { width: 1, height: 1 },
    createDefaultWidget: (slug, position) => ({
      slug,
      type: 'a',
      position,
      size: { width: 1, height: 1 },
    }),
  };
  const b: WidgetCatalogEntry = {
    type: 'b',
    labelLocalizationKey: 'b.label',
    defaultSize: { width: 2, height: 1 },
    createDefaultWidget: (slug, position) => ({
      slug,
      type: 'b',
      position,
      size: { width: 2, height: 1 },
    }),
  };
  const aOverride: WidgetCatalogEntry = { ...a, labelLocalizationKey: 'a.override' };

  it('merges multiple catalogs', () => {
    const merged = composeCatalogs([a], [b]);
    expect(merged.map((e) => e.type)).toEqual(['a', 'b']);
  });

  it('lets later catalogs override earlier ones on type collision', () => {
    const merged = composeCatalogs([a], [aOverride]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.labelLocalizationKey).toBe('a.override');
  });

  it('returns a frozen array', () => {
    const merged = composeCatalogs([a]);
    expect(Object.isFrozen(merged)).toBe(true);
  });
});

describe('addWidget', () => {
  const markdownEntry = defaultWidgetCatalog.find((e) => e.type === 'markdown');
  const textEntry = defaultWidgetCatalog.find((e) => e.type === 'text');

  it('appends a new widget at the next position', () => {
    if (!markdownEntry) throw new Error('markdown entry missing');
    const next = addWidget(baseDefinition, markdownEntry);
    expect(next.widgets).toHaveLength(1);
    expect(next.widgets[0]?.position).toBe(0);
    expect(next.widgets[0]?.type).toBe('markdown');
  });

  it('mints a unique slug derived from the entry type, suffixed with the lowest free integer', () => {
    if (!markdownEntry) throw new Error('markdown entry missing');
    const once = addWidget(baseDefinition, markdownEntry);
    const twice = addWidget(once, markdownEntry);
    expect(once.widgets[0]?.slug).toBe('Markdown1');
    expect(twice.widgets[1]?.slug).toBe('Markdown2');
  });

  it('skips slugs that already exist (gap-tolerant)', () => {
    if (!markdownEntry) throw new Error('markdown entry missing');
    const seeded: DashboardDefinition = {
      ...baseDefinition,
      widgets: [
        {
          slug: 'Markdown1',
          type: 'markdown',
          position: 0,
          size: { width: 12, height: 1 },
          contentLocalizationKey: 'Widget:Markdown1.Content',
        },
        {
          slug: 'Markdown3',
          type: 'markdown',
          position: 1,
          size: { width: 12, height: 1 },
          contentLocalizationKey: 'Widget:Markdown3.Content',
        },
      ],
    };
    const next = addWidget(seeded, markdownEntry);
    expect(next.widgets[2]?.slug).toBe('Markdown2');
  });

  it('forces the entry-declared default size onto the created widget', () => {
    if (!textEntry) throw new Error('text entry missing');
    const rogueEntry: WidgetCatalogEntry = {
      ...textEntry,
      defaultSize: { width: 4, height: 2 },
      createDefaultWidget: (slug, position) => ({
        slug,
        type: 'text',
        position,
        // The factory accidentally returns a different size — addWidget
        // must re-stamp it from the catalog entry to keep the two in sync.
        size: { width: 99, height: 99 },
        contentLocalizationKey: `Widget:${slug}.Content`,
        style: 'Body',
      }),
    };
    const next = addWidget(baseDefinition, rogueEntry);
    expect(next.widgets[0]?.size).toEqual({ width: 4, height: 2 });
  });

  it('does not mutate the input definition', () => {
    if (!markdownEntry) throw new Error('markdown entry missing');
    const before = baseDefinition.widgets;
    addWidget(baseDefinition, markdownEntry);
    expect(baseDefinition.widgets).toBe(before);
    expect(baseDefinition.widgets).toHaveLength(0);
  });
});
