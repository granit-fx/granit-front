import { ImageConfigForm } from '../components/forms/image-config-form.js';
import { MarkdownConfigForm } from '../components/forms/markdown-config-form.js';
import { TextConfigForm } from '../components/forms/text-config-form.js';

import type { WidgetConfigForm, WidgetConfigFormRegistry } from './widget-config-form-registry.js';

/**
 * Framework-default config-form registry — covers every
 * `FrameworkWidgetDefinition` kind shipped by `@granit/dashboards`. Compose
 * with downstream registries (analytics, IoT, app-specific) via
 * `composeWidgetConfigFormRegistries` so apps never need to re-register
 * the basics.
 */
export const defaultWidgetConfigFormRegistry: WidgetConfigFormRegistry = Object.freeze({
  markdown: MarkdownConfigForm as WidgetConfigForm,
  text: TextConfigForm as WidgetConfigForm,
  image: ImageConfigForm as WidgetConfigForm,
});
