import { ImageWidget } from '../components/widgets/image-widget.js';
import { MarkdownWidget } from '../components/widgets/markdown-widget.js';
import { TextWidget } from '../components/widgets/text-widget.js';

import type { WidgetRegistry, WidgetRenderer } from './widget-registry.js';

/**
 * Framework-default registry — covers every `FrameworkWidgetDefinition` type
 * shipped by `@granit/dashboards`. Compose this with downstream registries
 * (analytics, IoT, app-specific) via `composeRegistries` so apps never need
 * to re-register the basics.
 */
export const defaultWidgetRegistry: WidgetRegistry = Object.freeze({
  markdown: MarkdownWidget as WidgetRenderer,
  image: ImageWidget as WidgetRenderer,
  text: TextWidget as WidgetRenderer,
});
