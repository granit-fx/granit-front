import type {
  DashboardDefinition,
  ImageWidgetDefinition,
  MarkdownWidgetDefinition,
  TextWidgetDefinition,
} from '@granit/dashboards';

/**
 * Showcase landing dashboard — exercises the framework's three built-in
 * static-content widgets (`markdown` / `image` / `text`) without any
 * analytics dependency. The render bundle in
 * `@granit/react-dashboards/testing` mirrors this definition;
 * both stay in sync until the backend ships
 * `IDashboardDefinitionRegistry` and the showcase imports definitions
 * over HTTP.
 *
 * Sized to read comfortably at 12 columns × 120px rows: a wide banner
 * headlines the page, a hero image fills the next row, and a text tile
 * closes with a "what's next" pointer back into the editor flow.
 */

const banner: MarkdownWidgetDefinition = {
  slug: 'Banner',
  type: 'markdown',
  position: 0,
  size: { width: 12, height: 2 },
  contentLocalizationKey: 'Widget:Granit.Showcase.Welcome.Banner.Content',
};

const hero: ImageWidgetDefinition = {
  slug: 'Hero',
  type: 'image',
  position: 1,
  size: { width: 12, height: 3 },
  // Reliable public placeholder — apps swap this for their branding
  // (URL or `blob:` reference resolved via @granit/blob-storage).
  source: 'https://placehold.co/1200x600/0f172a/f8fafc.png?text=Granit+Showcase',
  altLocalizationKey: 'Widget:Granit.Showcase.Welcome.Hero.Alt',
  fit: 'Cover',
};

const cta: TextWidgetDefinition = {
  slug: 'NextSteps',
  type: 'text',
  position: 2,
  size: { width: 12, height: 1 },
  contentLocalizationKey: 'Widget:Granit.Showcase.Welcome.NextSteps.Content',
  style: 'Subheading',
};

export const sampleWelcomeDashboard: DashboardDefinition = {
  name: 'Granit.Showcase.Welcome',
  category: 'General',
  isSystem: false,
  version: '1.0.0',
  layout: { columns: 12, rowHeight: 120 },
  widgets: [banner, hero, cta],
};
